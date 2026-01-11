const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,              // VRAĆAMO SE NA 465
    secure: true,           // ZA PORT 465 OVO MORA BITI TRUE
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    // Ovi dodaci su ključni za Render:
    tls: {
      rejectUnauthorized: false 
    },
    // Povećavamo timeout na 20 sekundi
    connectionTimeout: 20000, 
    socketTimeout: 20000,
  });

  try {
    console.log(`⏳ Pokušavam spojiti na Gmail za: ${to}...`);
    
    // Provjera konekcije prije slanja
    await transporter.verify();
    console.log("✅ SMTP Konekcija uspješna!");

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
    console.error(`❌ GREŠKA pri slanju na ${to}:`, error.message);
    // Ne bacamo error da se kreiranje natjecanja nastavi
  }
};

module.exports = sendInviteEmail;