const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process. env.SENDGRID_API_KEY);

const sendInviteEmail = async ({ to, token, competitionName }) => {
  // Link vodi na LOGIN umjesto registracije
  const inviteLink = `https://dancearena.onrender.com/login?invite=${token}`;

  try {
    console.log(`⏳ Šaljem email na: ${to}... `);

    await sgMail.send({
      to: to,
      from: 'dancearenaunderdogs@gmail.com',
      subject: `Poziv za suđenje:  ${competitionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">Pozvani ste kao sudac!</h2>
          <p>Organizator vas je pozvao da sudite na natjecanju:  <strong>${competitionName}</strong></p>
          <br/>
          <a href="${inviteLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Prihvati poziv i registriraj se
          </a>
          <br/><br/>
          <p style="font-size: 12px; color: #888;">Ako gumb ne radi, kopirajte link:  ${inviteLink}</p>
        </div>
      `,
    });

    console.log(`✅ Email uspješno poslan na: ${to}`);
  } catch (error) {
    console.error(`❌ GREŠKA pri slanju na ${to}:`, error.message);
    if (error.response) {
      console.error('❌ SendGrid error body:', error.response.body);
    }
  }
};

module.exports = sendInviteEmail;