// backend/utils/emailService.js
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const { data, error } = await resend.emails.send({
      // IF YOU HAVE A DOMAIN: use 'support@homelykhana.com'
      // IF TESTING WITHOUT DOMAIN: you MUST use 'onboarding@resend.dev'
      from: 'HomelyKhana <no-reply@homelykhana.in>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return false;
    }

    console.log("Email sent successfully:", data);
    return true;
  } catch (err) {
    console.error("Sending failed:", err);
    return false;
  }
};

module.exports = sendEmail;