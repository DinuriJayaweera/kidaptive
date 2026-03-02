import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// ── OTP Generation ───────────────────────────────────────────────────────────
export function generateOtp(): string {
    return crypto.randomInt(100_000, 999_999).toString();
}

export async function hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
}

export async function compareOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
}

// ── Nodemailer Transport ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ── Send Email Verification OTP ──────────────────────────────────────────────
export async function sendVerificationEmail(
    to: string,
    otp: string,
    name: string,
): Promise<void> {
    const html = `
    <div style="font-family:'Poppins',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <h2 style="color:#1a1a2e;text-align:center;font-family:'Baloo 2',sans-serif;">
        Welcome to Kidaptive! 🎓
      </h2>
      <p style="color:#555;text-align:center;">
        Hi <strong>${name}</strong>, please verify your email with the code below:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#3ab5e6;background:#e8f4fd;padding:16px 32px;border-radius:12px;">
          ${otp}
        </span>
      </div>
      <p style="color:#888;text-align:center;font-size:13px;">
        This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
      </p>
    </div>
  `;

    await transporter.sendMail({
        from: `"Kidaptive" <${process.env.SMTP_USER ?? "no-reply@kidaptive.com"}>`,
        to,
        subject: "Verify your Kidaptive account",
        html,
    });
}

// ── Send Password Reset OTP ──────────────────────────────────────────────────
export async function sendResetEmail(
    to: string,
    otp: string,
    name: string,
): Promise<void> {
    const html = `
    <div style="font-family:'Poppins',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <h2 style="color:#1a1a2e;text-align:center;font-family:'Baloo 2',sans-serif;">
        Password Reset 🔒
      </h2>
      <p style="color:#555;text-align:center;">
        Hi <strong>${name}</strong>, use the code below to reset your password:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#e74c3c;background:#fdf0f0;padding:16px 32px;border-radius:12px;">
          ${otp}
        </span>
      </div>
      <p style="color:#888;text-align:center;font-size:13px;">
        This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.
      </p>
    </div>
  `;

    await transporter.sendMail({
        from: `"Kidaptive" <${process.env.SMTP_USER ?? "no-reply@kidaptive.com"}>`,
        to,
        subject: "Reset your Kidaptive password",
        html,
    });
}
