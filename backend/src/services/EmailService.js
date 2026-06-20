import nodemailer from "nodemailer";
import { env } from "../config/env.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.emailUser,
        pass: env.emailPass,
      },
    });
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      await this.transporter.sendMail({
        from: env.emailUser,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error.message);
      throw new Error("Email sending failed");
    }
  }

  async sendOtpEmail(to, otp) {
    await this.sendEmail({
      to,
      subject: "Your UniConnect Verification OTP",
      text: `Your verification code is: ${otp}`,
      html: `<b>Your verification code is: ${otp}</b>`,
    });
  }

  async sendPasswordResetEmail(to, resetUrl) {
    await this.sendEmail({
      to,
      subject: "UniConnect Password Reset Request",
      text: `Reset link: ${resetUrl}`,
      html: `<a href="${resetUrl}">Reset Password</a>`,
    });
  }
}

export default new EmailService();
