require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'wymw3ody5fo5um2l@ethereal.email',
    pass: 'yAs3H1yyD3eqmMCTGF'
  }
});

async function test() {
  try {
    let info = await transporter.sendMail({
      from: '"NITH Placement Cell" <wymw3ody5fo5um2l@ethereal.email>',
      to: 'rahuljnv669@gmail.com',
      subject: 'Password Reset Request',
      text: 'Here is your reset link: http://localhost:3000/reset-password?token=test',
      html: '<b>Here is your reset link:</b> <a href="http://localhost:3000/reset-password?token=test">Click here</a>'
    });
    console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
  } catch (e) {
    console.error(e);
  }
}
test();
