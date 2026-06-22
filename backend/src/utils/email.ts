import axios from 'axios';

export const sendResetEmail = async (to: string, resetLink: string) => {
// ... same code ...

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: "NITH Placement Cell",
          email: senderEmail
        },
        to: [{ email: to }],
        subject: "Password Reset Request",
        htmlContent: htmlContent,
        textContent: textContent
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      }
    );

    console.log(`Password reset email successfully sent to ${to} via Brevo HTTP API`);
  } catch (error: any) {
    console.error('Error sending reset email:', error.response?.data || error.message);
    throw new Error('Failed to send reset email');
  }
};
