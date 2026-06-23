require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: smtpUser, pass: smtpPass },
  tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
});

console.log('=== Sending Password Reset Test Email ===');
console.log('FROM:', fromEmail);
console.log('TO:', fromEmail);

transporter.sendMail({
  from: '"NITH Placement Cell" <' + fromEmail + '>',
  to: fromEmail,
  subject: 'Password Reset Test - NITH TPR Portal',
  html: [
    '<div style="font-family:Arial;padding:20px;max-width:600px">',
    '<h2 style="color:#1b4376">NITH TPR Portal - Password Reset Test</h2>',
    '<p>If you receive this email, the reset email delivery is working correctly!</p>',
    '<a href="http://localhost:3000/reset-password?id=test&token=abc123" style="background:#2e5e9b;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block">',
    'Test Reset Link',
    '</a>',
    '</div>'
  ].join('')
}).then(function(info) {
  console.log('');
  console.log('SUCCESS - SMTP accepted the email!');
  console.log('MessageId:', info.messageId);
  console.log('Response:', info.response);
  console.log('');
  console.log('>>> Check inbox AND spam/junk folder for:', fromEmail);
}).catch(function(err) {
  console.error('');
  console.error('FAILED - SMTP rejected:', err.message);
  if (err.responseCode) console.error('Response Code:', err.responseCode);
  if (err.response) console.error('Server Response:', err.response);
  if (err.code) console.error('Error Code:', err.code);
});
