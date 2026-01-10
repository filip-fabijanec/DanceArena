const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  // Pazi da link odgovara tvojoj Frontend ruti
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,              // <--- PROMJENA: SSL port je stabilniji na Renderu
    secure: true,           // <--- PROMJENA: Mora biti true za port 465
    auth: {
      user: process.env.MAIL_USER, // Provjeri zove li se varijabla ovako u .env
      pass: process.env.MAIL_PASS, // Ovo mora biti Google App Password
    },
  });

  try {
    await transporter.sendMail({
      from: `"Dance Arena" <${process.env.MAIL_USER}>`,
      to,
      subject: `Poziv za suđenje: ${competitionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">Pozvani ste kao sudac!</h2>
          <p>Organizator vas je pozvao da sudite na natjecanju: <strong>${competitionName}</strong></p>
          <br/>
          <a href="${inviteLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Prihvati poziv i registriraj se
          </a>
          <br/><br/>
          <p style="font-size: 12px; color: #888;">Ako gumb ne radi, kopirajte link: ${inviteLink}</p>
        </div>
      `,
    });
    console.log(`Email poslan na: ${to}`);
  } catch (error) {
    console.error(`Greška pri slanju na ${to}:`, error);
    // Ne bacamo error ovdje da ne srušimo cijeli request ako jedan mail ne prođe
  }
};

module.exports = sendInviteEmail;