const axios = require("axios");

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = "login@hallofmirth.us";
const FROM_NAME = "Blind Tasting App";

exports.sendLoginCodeEmail = async (email, code) => {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
      <h2 style="color: #444;">Your Blind Tasting App Login Code</h2>
      <p style="font-size: 18px; color: #666;">
        Use the code below to log in:
      </p>
      <div style="
        font-size: 36px;
        font-weight: bold;
        margin: 20px 0;
        color: #222;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #888;">
        This code expires in 10 minutes.
      </p>
      <p style="
        font-size: 14px;
        color: #bbb;
        margin-top: 40px;">
        Sent by Blind Tasting App • hallofmirth.us
      </p>
    </div>
  `;

  try {
    const res = await axios.post(
      "https://api.mailersend.com/v1/email",
      {
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        to: [{ email }],
        subject: "Your Blind Tasting App Login Code",
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "MailerSend error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send email");
  }
};
