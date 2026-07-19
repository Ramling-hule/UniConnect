import AppError from '../utils/AppError.js';
import HackathonTeam from '../models/HackathonTeam.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import Hackathon from '../models/Hackathon.js';
import Group from '../models/Group.js';
import CacheService from './CacheService.js';
import notificationManager from './notificationService.js';
import { nanoid } from '../utils/slugify.js';

/**
 * HackathonTeamService — Full team lifecycle management.
 * Reuses: CacheService (distributed locks), notificationManager, Group model (for chat rooms).
 */
class HackathonTeamService {

  async createTeam(hackathonId, captainId, { name, role, rolesNeeded, techStack }, io) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    const now = new Date();
    if (now > hackathon.timeline.registrationClose) {
      throw new AppError('Registration deadline has passed, cannot create team', 400);
    }

    // Ensure captain doesn't already have a team in this hackathon
    const existingTeam = await HackathonTeam.findOne({
      hackathon: hackathonId,
      'members.user': captainId,
    });
    if (existingTeam) throw new AppError('You are already in a team for this hackathon', 409);

    // Create a Group (reuses existing Group model) so team chat works via existing socket
    const group = await Group.create({
      name: `[Hackathon] ${name}`,
      description: `Team chat for "${hackathon.title}"`,
      admins:  [captainId],
      members: [captainId],
      privacy: 'private',
      inviteCode: nanoid(),
    });

    const team = await HackathonTeam.create({
      hackathon: hackathonId,
      name,
      captain: captainId,
      members: [{ user: captainId, role: role || 'Captain' }],
      rolesNeeded: rolesNeeded || [],
      techStack: techStack || [],
      isLookingForMembers: (rolesNeeded && rolesNeeded.length > 0),
      groupId: group._id,
    });

    return team;
  }

  async inviteMember(teamId, captainId, inviteeId, io) {
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) throw new AppError('Team not found', 404);
    if (team.captain.toString() !== captainId.toString()) {
      throw new AppError('Only the captain can invite members', 403);
    }
    if (team.isLocked) throw new AppError('Team is locked after deadline', 400);

    const hackathon = team.hackathon;
    if (team.members.length >= hackathon.maxTeamSize) {
      throw new AppError(`Team is full (max ${hackathon.maxTeamSize} members)`, 400);
    }

    const alreadyInvited = team.invitations.find(
      inv => inv.user.toString() === inviteeId.toString() && inv.status === 'pending'
    );
    if (alreadyInvited) throw new AppError('User already has a pending invitation', 409);

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    team.invitations.push({ user: inviteeId, status: 'pending', expiresAt });
    await team.save();

    await notificationManager.notify({
      recipientId: inviteeId,
      senderId: captainId,
      type: 'hackathon_invite',
      message: `You've been invited to join team "${team.name}" for "${hackathon.title}"`,
      link: `/hackathons/${hackathon.slug}/team/${teamId}`,
      relatedId: team._id,
    }, io);

    return team;
  }

  async acceptInvite(teamId, userId, io) {
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) throw new AppError('Team not found', 404);
    if (team.isLocked) throw new AppError('Team is locked after deadline', 400);

    const invite = team.invitations.find(
      inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
    );
    if (!invite) throw new AppError('No pending invitation found', 404);
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    const hackathon = team.hackathon;

    // Check if user is already in another team for this hackathon
    const existingTeam = await HackathonTeam.findOne({
      hackathon: hackathon._id,
      'members.user': userId,
      _id: { $ne: teamId },
    });
    if (existingTeam) throw new AppError('You are already in another team for this hackathon', 409);

    invite.status = 'accepted';
    team.members.push({ user: userId, role: '' });

    // Add to Group for chat access
    if (team.groupId) {
      await Group.findByIdAndUpdate(team.groupId, { $addToSet: { members: userId } });
    }

    // Update LFM status
    if (team.members.length >= hackathon.maxTeamSize) {
      team.isLookingForMembers = false;
    }

    await team.save();

    await notificationManager.notify({
      recipientId: team.captain,
      senderId: userId,
      type: 'team_joined',
      message: `A member has joined your team "${team.name}"`,
      link: `/hackathons/${hackathon.slug}/team/${teamId}`,
      relatedId: team._id,
    }, io);

    return team;
  }

  async rejectInvite(teamId, userId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);

    const invite = team.invitations.find(
      inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
    );
    if (!invite) throw new AppError('No pending invitation found', 404);

    invite.status = 'rejected';
    await team.save();
    return { message: 'Invitation rejected' };
  }

  async leaveTeam(teamId, userId, io) {
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) throw new AppError('Team not found', 404);
    if (team.isLocked) throw new AppError('Cannot leave a locked team', 400);

    if (team.captain.toString() === userId.toString()) {
      throw new AppError('Captain cannot leave. Transfer captaincy first or disband the team.', 400);
    }

    const memberIndex = team.members.findIndex(m => m.user.toString() === userId.toString());
    if (memberIndex === -1) throw new AppError('You are not a member of this team', 400);

    team.members.splice(memberIndex, 1);
    if (team.groupId) {
      await Group.findByIdAndUpdate(team.groupId, { $pull: { members: userId } });
    }
    await team.save();
    return { message: 'Successfully left the team' };
  }

  async transferCaptain(teamId, currentCaptainId, newCaptainId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);
    if (team.captain.toString() !== currentCaptainId.toString()) {
      throw new AppError('Only the current captain can transfer captaincy', 403);
    }

    const isMember = team.members.some(m => m.user.toString() === newCaptainId.toString());
    if (!isMember) throw new AppError('New captain must be a team member', 400);

    team.captain = newCaptainId;
    if (team.groupId) {
      await Group.findByIdAndUpdate(team.groupId, {
        $addToSet: { admins: newCaptainId },
        $pull: { admins: currentCaptainId },
      });
    }
    await team.save();
    return team;
  }

  async discoverTeams(hackathonId, { rolesNeeded, techStack, page = 1, limit = 20 } = {}) {
    const query = { hackathon: hackathonId, isLookingForMembers: true };
    if (rolesNeeded) query.rolesNeeded = { $in: Array.isArray(rolesNeeded) ? rolesNeeded : [rolesNeeded] };
    if (techStack)   query.techStack   = { $in: Array.isArray(techStack)   ? techStack   : [techStack] };

    const teams = await HackathonTeam.find(query)
      .populate('members.user', 'name profilePicture headline skills')
      .populate('captain', 'name profilePicture headline')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return teams;
  }
}

export default new HackathonTeamService();
