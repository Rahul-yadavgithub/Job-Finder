import nodemailer from 'nodemailer';

interface SendRecoveryEmailParams {
  toEmail: string;
  toName: string;
  recoveryLink: string;
  expiresInHours: number;
}

interface SendPlacementEmailParams {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  attachmentUrl?: string;
  attachmentFilename?: string;
}


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendRecoveryEmail({
  toEmail,
  toName,
  recoveryLink,
  expiresInHours
}: SendRecoveryEmailParams): Promise<void> {
  const subject = 'TPO Admin Panel — Leadership Setup Link';
  const textBody = `Hello ${toName},
You have been designated as the new Head TPO for NITH TPR Portal.
Click the link below to set up your account.
This link expires in ${expiresInHours} hours.
${recoveryLink}
If you did not expect this email, ignore it.`;

  const htmlBody = `<p>Hello <strong>${toName}</strong>,</p>
<p>You have been designated as the new Head TPO for NITH TPR Portal.</p>
<p>Click the link below to set up your account.</p>
<p>This link expires in ${expiresInHours} hours.</p>
<p><a href="${recoveryLink}">${recoveryLink}</a></p>
<p><small>If you did not expect this email, ignore it.</small></p>`;

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured. Email would have been:', textBody);
      return;
    }

    await transporter.sendMail({
      from: `"NITH TPR Portal" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Failed to send recovery email:', error);
    throw error;
  }
}

export async function sendPlacementEmail({
  toEmail,
  subject,
  bodyHtml,
  attachmentUrl,
  attachmentFilename
}: SendPlacementEmailParams): Promise<void> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured. Email would have been sent to:', toEmail);
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"NITH Placement Cell" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: bodyHtml,
      // If we want a plain text version, we can strip HTML tags using a basic regex or just leave it out. Nodemailer handles html-only fine.
    };

    if (attachmentUrl && attachmentFilename) {
      mailOptions.attachments = [
        {
          filename: attachmentFilename,
          path: attachmentUrl // Nodemailer can fetch attachments from a URL directly
        }
      ];
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send placement email:', error);
    throw error;
  }
}
