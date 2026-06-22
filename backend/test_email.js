require('dotenv').config();
const nodemailer = require('nodemailer');
async function run() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  try {
    const info = await transporter.sendMail({
      from: `"NITH Placement Cell" <${process.env.SMTP_USER}>`,
      to: 'tponith@gmail.com',
      subject: 'Test Email via Brevo',
      text: 'This is a test from Brevo.'
    });
    console.log('Sent:', info.messageId);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
