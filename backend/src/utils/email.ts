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

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? `"Kidaptive" <${process.env.SMTP_USER ?? "no-reply@kidaptive.com"}>`;

// ── Verify SMTP connection on startup ────────────────────────────────────────
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified — emails will be delivered");
    return true;
  } catch (err) {
    console.warn(
      "⚠️  SMTP connection failed — emails will NOT be delivered.",
      (err as Error).message,
    );
    return false;
  }
}

// ── Send Email Verification OTP ──────────────────────────────────────────────
export async function sendVerificationEmail(
  to: string,
  otp: string,
  name: string,
): Promise<void> {
  const html = `
    <div style="font-family:'Segoe UI','Poppins',sans-serif;max-width:520px;margin:0 auto;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#3ab5e6 0%,#6c63ff 100%);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
          🎓 Kidaptive
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
          Welcome aboard! Let's verify your email.
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px 24px;">
        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Hi <strong>${name}</strong>,<br/>
          Thank you for signing up! Use the verification code below to complete your registration:
        </p>

        <!-- OTP Code -->
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:10px;color:#3ab5e6;background:#f0f9ff;padding:20px 36px;border-radius:12px;border:2px dashed #3ab5e6;">
            ${otp}
          </div>
        </div>

        <p style="color:#666;text-align:center;font-size:14px;margin:24px 0 0;line-height:1.6;">
          ⏰ This code expires in <strong>10 minutes</strong>.<br/>
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
        <p style="color:#999;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} Kidaptive — Learning made fun for kids
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your Kidaptive account ✉️",
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
    <div style="font-family:'Segoe UI','Poppins',sans-serif;max-width:520px;margin:0 auto;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#e74c3c 0%,#c0392b 100%);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
          🔒 Password Reset
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
          We received a request to reset your password.
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px 24px;">
        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Hi <strong>${name}</strong>,<br/>
          Use the code below to reset your password:
        </p>

        <!-- OTP Code -->
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:10px;color:#e74c3c;background:#fdf0f0;padding:20px 36px;border-radius:12px;border:2px dashed #e74c3c;">
            ${otp}
          </div>
        </div>

        <p style="color:#666;text-align:center;font-size:14px;margin:24px 0 0;line-height:1.6;">
          ⏰ This code expires in <strong>10 minutes</strong>.<br/>
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
        <p style="color:#999;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} Kidaptive — Learning made fun for kids
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Kidaptive password 🔒",
    html,
  });
}
