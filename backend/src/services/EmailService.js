import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.emailUser,
        pass: env.emailPass,
      },
    });
    this.transporter.verify((error) => {
      if (error) {
        logger.error("EmailService: SMTP connection failed — emails will NOT send", {
          smtpError  : error.message,
          smtpCode   : error.code,       // e.g. EAUTH, ECONNECTION
          smtpCommand: error.command,    // e.g. AUTH
          emailUser  : env.emailUser,
          hint       : "Make sure EMAIL_PASS is a Gmail App Password (not your account password). Generate one at: https://myaccount.google.com/apppasswords",
        });
      } else {
        logger.info("EmailService: SMTP connection verified ✓", { emailUser: env.emailUser });
      }
    });
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"ProConnect" <${env.emailUser}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info("Email sent", { to, subject, messageId: info.messageId });
    } catch (error) {
      logger.error("EmailService: Failed to send email", {
        to,
        subject,
        smtpError  : error.message,
        smtpCode   : error.code,       // e.g. EAUTH = bad credentials
        smtpCommand: error.command,
        responseCode: error.responseCode,
        response   : error.response,   // Full SMTP server response
      });
      const friendly = new Error("Email sending failed");
      friendly.status = 503;
      friendly.cause  = error; // Preserve original for deeper debugging
      throw friendly;
    }
  }

  async sendOtpEmail(to, otp) {
    await this.sendEmail({
      to,
      subject: "Your ProConnect Verification OTP",
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4f46e5">ProConnect — Verify your email</h2>
          <p>Use the code below to complete your registration:</p>
          <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:16px 0">
            ${otp}
          </div>
          <p style="color:#666;font-size:0.875rem">This code expires in <strong>10 minutes</strong>. Do not share it.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to, resetUrl) {
    await this.sendEmail({
      to,
      subject: "ProConnect — Password Reset Request",
      text: `Reset your password here: ${resetUrl}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4f46e5">ProConnect — Reset your password</h2>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:8px">
            Reset Password
          </a>
          <p style="color:#666;font-size:0.875rem;margin-top:16px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }
}

export default new EmailService();
