const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  // Pazi da ovaj link odgovara tvom frontendu
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,              // <--- PROMJENA: Koristimo 587 umjesto 465
    secure: false,          // <--- PROMJENA: Mora biti false za port 587
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Pomaže kod problema s certifikatima na Renderu
      ciphers: "SSLv3"
    },
    // Dodajemo timeout da se server ne smrzne ako Gmail ne odgovara
    connectionTimeout: 10000, // 10 sekundi
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    // Provjera konekcije prije slanja (opcionalno, ali korisno za debug)
    await transporter.verify();

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
    console.log(`✅ Email uspješno poslan na: ${to}`);
  } catch (error) {
    console.error(`❌ Greška pri slanju na ${to}:`, error.message);
    // Ovdje NE bacamo error (throw error) kako se kreiranje natjecanja ne bi prekinulo
    // ako jedan mail ne prođe.
  }
};

module.exports = sendInviteEmail;