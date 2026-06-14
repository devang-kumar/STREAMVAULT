import 'dotenv/config';
import { sendOtpEmail } from './server/utils/email.js';

async function testEmail() {
  try {
    console.log("Testing email sending...");
    await sendOtpEmail("devangkumar12112005@gmail.com", "123456");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

testEmail();
