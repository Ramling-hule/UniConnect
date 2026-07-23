import AuditLog from "../models/AuditLog.js";

class AuditService {
  async log(userId, action, reqOrDeviceInfo, metadata = {}) {
    try {
      let ipAddress = "Unknown";
      let userAgent = "Unknown";

      if (reqOrDeviceInfo && reqOrDeviceInfo.ip) {
        ipAddress = reqOrDeviceInfo.ip || reqOrDeviceInfo.headers["x-forwarded-for"] || reqOrDeviceInfo.socket?.remoteAddress;
        userAgent = reqOrDeviceInfo.headers["user-agent"];
      } else if (reqOrDeviceInfo) {
        ipAddress = reqOrDeviceInfo.ipAddress || ipAddress;
        userAgent = reqOrDeviceInfo.userAgent || userAgent;
      }

      await AuditLog.create({
        userId,
        action,
        ipAddress,
        userAgent,
        metadata
      });
    } catch (err) {
      console.error("Failed to write audit log:", err.message);
    }
  }
}

export default new AuditService();
