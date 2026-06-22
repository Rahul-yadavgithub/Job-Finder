import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetEmail = async (to: string, resetLink: string) => {
  const mailOptions = {
    from: `"NITH Placement Cell" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
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
            Click the button below to set a new password. This link is valid for 15 minutes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2e5e9b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NITH. All rights reserved.
        </div>
      </div>
    `,
    text: `Password Reset Request\n\nWe received a request to reset the password for your account associated with this email address. Please click the following link to set a new password. This link is valid for 15 minutes.\n\n${resetLink}\n\nIf you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.`
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n=============================================');
      console.log('⚠️ SMTP Credentials missing in .env!');
      console.log('Skipping actual email sending.');
      console.log('🔗 PASSWORD RESET LINK:', resetLink);
      console.log('=============================================\n');
      return;
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    if (info.messageId && process.env.SMTP_HOST?.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send reset email');
  }
};
