const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:  {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS, // app password
    },
  });

  await transporter.sendMail({
    from: `"Dance Arena" <${process.env. MAIL_USER}>`,
    to,
    subject: "Poziv za suđenje na plesnom natjecanju",
    html: `
      <h2>Pozvani ste kao sudac</h2>
      <p>Pozvani ste kao sudac za natjecanje <strong>${competitionName || "Dance Arena"}</strong></p>
      <p>Kliknite na link ispod kako biste dovršili registraciju:</p>
      <a href="${inviteLink}" style="display:  inline-block; padding: 10px 20px; background-color: #007bff; color:  white; text-decoration: none; border-radius: 5px;">
        Prihvati poziv
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Ili kopirajte ovaj link: ${inviteLink}
      </p>
      <p style="font-size: 12px; color: #999;">Link vrijedi 7 dana. </p>
    `,
  });
};

module.exports = sendInviteEmail;