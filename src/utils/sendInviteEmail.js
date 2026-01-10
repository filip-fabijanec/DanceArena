const nodemailer = require("nodemailer");

const sendInviteEmail = async ({ to, token, competitionName }) => {
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,              // Port 587 je standard za Render
    secure: false,          // Mora biti false za 587
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS, // Tvoja App Password
    },
    tls: {
      // OVO JE PROMJENA: Maknuli smo "SSLv3" jer to Gmail blokira!
      rejectUnauthorized: false, 
    },
    // Timeout postavke (bitno da se ne vrti beskonačno)
    connectionTimeout: 10000, // 10 sekundi
    greetingTimeout: 10000,
    socketTimeout: 10000,
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