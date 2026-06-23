import nodemailer from 'nodemailer';

export const sendResetEmail = async (to: string, resetLink: string) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  // SMTP_FROM_EMAIL must be a verified sender in Brevo Senders list
  // Go to: https://app.brevo.com/senders → Add & verify your sender email
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

  // Always log the reset link so you can test even without email delivery
  console.log('\n=== PASSWORD RESET REQUEST ===');
  console.log('Recipient:', to);
  console.log('Reset Link:', resetLink);
  console.log('==============================\n');

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️  SMTP Credentials missing in .env! Email not sent.');
    return;
  }

  // Create transporter lazily so env vars are always read at call-time
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // STARTTLS on port 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    // fromEmail MUST be verified in Brevo: https://app.brevo.com/senders
    from: `"NITH Placement Cell" <${fromEmail}>`,
    to,
    subject: 'Password Reset Request – NITH TPR Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef1f5; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1b4376; margin: 0;">National Institute of Technology Hamirpur</h2>
          <p style="color: #64748b; margin-top: 5px;">TPR Portal</p>
        </div>
        <div style="background-color: #f5f7f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #334155; margin-top: 0;">Password Reset Request</h3>
          <p style="color: #475569; line-height: 1.5;">
            We received a request to reset the password for your account associated with this email address.
            Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2e5e9b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color: #2e5e9b; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NITH Placement Cell. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${to} — MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Error sending reset email:', error.message);
    if (error.response) console.error('SMTP Response:', error.response);
    throw new Error('Failed to send reset email');
  }
};
