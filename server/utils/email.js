import nodemailer from 'nodemailer';

/**
 * Send a password-reset email.
 *
 * In development (no SMTP env vars), the reset URL is simply logged to the
 * console so you can click it manually.  In production set the following
 * env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const createTransporter = () => {
  // If SMTP is configured, use a real transport
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 5000,
      socketTimeout: 5000
    });
  }

  // Development fallback – log the email to the console
  return null;
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#D4A017;margin-bottom:8px;">Password Reset Request</h2>
      <p style="color:#333;font-size:14px;">
        We received a request to reset the password for your StreamVault account
        (<strong>${email}</strong>).
      </p>
      <p style="color:#333;font-size:14px;">
        Click the button below to choose a new password. This link expires in
        <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#D4A017;color:#fff;font-weight:bold;
                padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Reset My Password
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  if (transporter) {
    // Production – send real email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'StreamVault <no-reply@streamvault.com>',
      to: email,
      subject: 'StreamVault – Reset Your Password',
      html
    });
  } else {
    // Development – log to console
    console.log('\n════════════════════════════════════════════');
    console.log('  PASSWORD RESET EMAIL (dev mode)');
    console.log('  To:', email);
    console.log('  Reset URL:', resetUrl);
    console.log('════════════════════════════════════════════\n');
  }
};

export const sendOtpEmail = async (email, otp) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#D4A017;margin-bottom:8px;">Your OTP Code</h2>
      <p style="color:#333;font-size:14px;">
        Use the code below to complete your sign-in to <strong>StreamVault</strong>.
      </p>
      <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#D4A017;">${otp}</span>
      </div>
      <p style="color:#999;font-size:12px;">
        This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'StreamVault <no-reply@streamvault.com>',
      to: email,
      subject: 'StreamVault – Your OTP Code',
      html
    });
  } else {
    console.log('\n════════════════════════════════════════════');
    console.log('  OTP EMAIL (dev mode)');
    console.log('  To:', email);
    console.log('  OTP Code:', otp);
    console.log('════════════════════════════════════════════\n');
  }
};