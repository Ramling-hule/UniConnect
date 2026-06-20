import AuditLog from "../models/AuditLog.js";

class AuditService {
  async log(userId, action, reqOrDeviceInfo, metadata = {}) {
    try {
      // Determine device info
      let ipAddress = "Unknown";
      let userAgent = "Unknown";

      if (reqOrDeviceInfo && reqOrDeviceInfo.ip) {
        // Express Request Object
        ipAddress = reqOrDeviceInfo.ip || reqOrDeviceInfo.headers["x-forwarded-for"] || reqOrDeviceInfo.socket?.remoteAddress;
        userAgent = reqOrDeviceInfo.headers["user-agent"];
      } else if (reqOrDeviceInfo) {
        // Raw Device Info Object
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
