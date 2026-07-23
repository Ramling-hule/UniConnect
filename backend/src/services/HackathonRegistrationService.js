import AppError from '../utils/AppError.js';
import CacheService from './CacheService.js';
import CacheKeys from '../utils/CacheKeys.js';
import notificationManager from './notificationService.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonRegistrationRepository from '../repositories/HackathonRegistrationRepository.js';
class HackathonRegistrationService {

  async registerIndividual(hackathonId, userId, io) {
    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    this._assertRegistrationWindowOpen(hackathon);

    const existing = await HackathonRegistrationRepository.findByHackathonAndUser(hackathonId, userId);
    if (existing) throw new AppError('Already registered for this hackathon', 409);
    const lockKey  = CacheKeys.registrationLock(hackathonId, userId);
    const acquired = await CacheService.acquireLock(lockKey, `${Date.now()}`, 10);
    if (!acquired)  throw new AppError('Registration in progress, please try again', 429);

    try {
      const { status, waitlistPosition } = await this._resolveRegistrationStatus(hackathon, hackathonId);

      const registration = await HackathonRegistrationRepository.create({
        hackathon: hackathonId,
        user: userId,
        registrationType: 'individual',
        status,
        waitlistPosition,
        paymentStatus: hackathon.isFree ? 'not_required' : 'pending',
      });

      if (status === 'confirmed') {
        await HackathonRepository.incrementCount(hackathonId, 'registrationCount', 1);
      }

      await notificationManager.notify({
        recipientId: userId,
        type: 'hackathon_accepted',
        message: `You have successfully registered for "${hackathon.title}"`,
        link:    `/hackathons/${hackathon.slug}`,
        relatedId: hackathon._id,
      }, io);

      return registration;
    } finally {
      await CacheService.releaseLock(lockKey);
    }
  }

  async cancelRegistration(registrationId, userId) {
    const reg = await HackathonRegistrationRepository.findById(registrationId);
    if (!reg)                        throw new AppError('Registration not found', 404);
    if (reg.user.toString() !== userId.toString()) throw new AppError('Not authorized', 403);
    if (reg.status === 'cancelled')  throw new AppError('Already cancelled', 400);

    const wasConfirmed = reg.status === 'confirmed';
    reg.status = 'cancelled';
    await HackathonRegistrationRepository.save(reg);

    if (wasConfirmed) {
      await this._handleCancellationWaitlistPromotion(reg.hackathon._id);
    }

    return reg;
  }
  async _resolveRegistrationStatus(hackathon, hackathonId) {
    let status = 'confirmed';
    let waitlistPosition = null;

    if (hackathon.maxParticipants && hackathon.registrationCount >= hackathon.maxParticipants) {
      if (!hackathon.waitlistEnabled) throw new AppError('Hackathon is full', 409);
      const waitlistCount = await HackathonRegistrationRepository.countByStatus(hackathonId, 'waitlisted');
      status = 'waitlisted';
      waitlistPosition = waitlistCount + 1;
    }
    if (hackathon.approvalRequired) status = 'pending';
    if (!hackathon.isFree) status = 'pending';

    return { status, waitlistPosition };
  }
  async _handleCancellationWaitlistPromotion(hackathonId) {
    await HackathonRepository.incrementCount(hackathonId, 'registrationCount', -1);

    const next = await HackathonRegistrationRepository.findFirstWaitlisted(hackathonId);
    if (next) {
      next.status = 'confirmed';
      next.waitlistPosition = null;
      await HackathonRegistrationRepository.save(next);
      await HackathonRepository.incrementCount(hackathonId, 'registrationCount', 1);
    }
  }
  _assertRegistrationWindowOpen(hackathon) {
    const now = new Date();
    if (now > hackathon.timeline.registrationClose) {
      throw new AppError('Registration deadline has passed', 400);
    }
    if (now < hackathon.timeline.registrationOpen) {
      throw new AppError('Registration has not opened yet', 400);
    }
  }
}

export default new HackathonRegistrationService();
