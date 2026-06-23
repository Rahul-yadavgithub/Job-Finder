import { sendResetEmail } from './src/utils/email';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    console.log("Sending Brevo email...");
    await sendResetEmail("rahuljnv669@gmail.com", "http://localhost:3000/reset-password?token=test");
    console.log("Done");
  } catch (e) {
    console.error("Caught error:", e);
  }
}
test();
