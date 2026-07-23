import Connection from '../models/Connection.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
class ConnectionService {
  async sendRequest(senderId, receiverId) {
    if (senderId.toString() === receiverId.toString()) {
      throw new AppError('Cannot connect to yourself', 400);
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: senderId, recipient: receiverId },
        { requester: receiverId, recipient: senderId },
      ],
    });

    if (existing) {
      if (existing.status === 'pending')  throw new AppError('Request already pending', 400);
      if (existing.status === 'accepted') throw new AppError('Already connected', 400);
      throw new AppError('Cannot send request', 400);
    }

    await Connection.create({ requester: senderId, recipient: receiverId, status: 'pending' });
    return { success: true, message: 'Request sent' };
  }
  async respondToInvite(userId, connectionId, action) {
    const connection = await Connection.findById(connectionId);
    if (!connection) throw new AppError('Request not found', 404);

    if (connection.recipient.toString() !== userId.toString()) {
      throw new AppError('Not authorized', 403);
    }

    if (action === 'accept') {
      connection.status = 'accepted';
      await connection.save();
    } else {
      await Connection.findByIdAndDelete(connectionId);
    }

    return { success: true };
  }
  async getNetwork(userId) {
    const invitations = await Connection.find({ recipient: userId, status: 'pending' })
      .populate('requester', 'name institute headline');

    const connections = await Connection.find({
      $or: [
        { requester: userId, recipient: { $ne: userId } },
        { recipient: userId, requester: { $ne: userId } },
      ],
      status: 'accepted',
    })
      .populate('requester', 'name institute headline')
      .populate('recipient', 'name institute headline');

    const formattedConnections = connections.map((conn) =>
      conn.requester._id.toString() === userId.toString() ? conn.recipient : conn.requester,
    );

    const formattedInvites = invitations.map((inv) => ({ _id: inv._id, user: inv.requester }));

    return { invitations: formattedInvites, connections: formattedConnections };
  }
  async getDiscoverUsers(currentUserId) {
    const myRelationships = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    });

    const statusMap = {};
    myRelationships.forEach((rel) => {
      const otherId =
        rel.requester.toString() === currentUserId
          ? rel.recipient.toString()
          : rel.requester.toString();
      statusMap[otherId] = rel.status;
    });

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('name institute headline')
      .limit(20);

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      institute: user.institute,
      headline: user.headline,
      status: statusMap[user._id.toString()] || 'none',
    }));
  }
}

export default new ConnectionService();
