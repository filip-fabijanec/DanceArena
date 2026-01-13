const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  // 🔍 DEBUG: Provjeri jesu li env varijable učitane
  console.log("🔍 DEBUG MAIL_USER:", process.env. MAIL_USER ?  "✅ POSTOJI" : "❌ NEDOSTAJE");
  console.log("🔍 DEBUG MAIL_PASS:", process.env. MAIL_PASS ? "✅ POSTOJI" : "❌ NEDOSTAJE");
  
  if (!process.env.MAIL_USER || !process.env. MAIL_PASS) {
    console.error("❌ FATALNA GREŠKA:  MAIL_USER ili MAIL_PASS nisu definirani!");
    return; // Ne nastavljaj ako nema credentials
  }

  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user:  process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false 
    },
    connectionTimeout: 20000, 
    socketTimeout: 20000,
  });

  try {
    console.log(`⏳ Pokušavam spojiti na Gmail za:  ${to}... `);
    
    await transporter.verify();
    console.log("✅ SMTP Konekcija uspješna!");

    await transporter.sendMail({
      from: `"Dance Arena" <${process.env. MAIL_USER}>`,
      to,
      subject: `Poziv za suđenje:  ${competitionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">Pozvani ste kao sudac! </h2>
          <p>Organizator vas je pozvao da sudite na natjecanju:  <strong>${competitionName}</strong></p>
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
    console.error("❌ Full error:", error); // Dodaj puni error za više detalja
  }
};

module.exports = sendInviteEmail;