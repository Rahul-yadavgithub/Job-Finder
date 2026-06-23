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
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_USER;

    if (!apiKey || !senderEmail) {
      console.warn('Brevo credentials not configured. Email would have been:', textBody);
      return;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: "NITH TPR Portal", email: senderEmail },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlBody,
        textContent: textBody
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo API Error: ${errorData}`);
    }
  } catch (error: any) {
    console.error('Failed to send recovery email:', error.message);
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
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_USER;

    if (!apiKey || !senderEmail) {
      console.warn('Brevo credentials not configured. Email would have been sent to:', toEmail);
      return;
    }

    const payload: any = {
      sender: { name: "NITH Placement Cell", email: senderEmail },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: bodyHtml.replace(/\n/g, '<br>'),
      textContent: bodyHtml
    };

    if (attachmentUrl && attachmentFilename) {
      payload.attachment = [
        {
          name: attachmentFilename,
          url: attachmentUrl
        }
      ];
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo API Error: ${errorData}`);
    }
  } catch (error: any) {
    console.error('Failed to send placement email:', error.message);
    throw error;
  }
}
