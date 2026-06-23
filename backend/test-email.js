const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'aksinup93@gmail.com',
    pass: 'iquvrzqkccnwjgaj',
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"NITH Placement Cell" <aksinup93@gmail.com>',
      to: 'rahuljnv669@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();
