const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendInviteEmail = async ({ to, token, competitionName }) => {
  const inviteLink = `https://dancearena.onrender.com/registracija?invite=${token}`;

  try {
    console.log(`⏳ Šaljem email na: ${to}... `);

    const { data, error } = await resend.emails.send({
      from: 'Dance Arena <onboarding@resend.dev>', // ili tvoja verificirana domena
      to:  [to],
      subject: `Poziv za suđenje:  ${competitionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">Pozvani ste kao sudac! </h2>
          <p>Organizator vas je pozvao da sudite na natjecanju:  <strong>${competitionName}</strong></p>
          <br/>
          <a href="${inviteLink}" style="background-color:  #4CAF50; color:  white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Prihvati poziv i registriraj se
          </a>
          <br/><br/>
          <p style="font-size: 12px; color: #888;">Ako gumb ne radi, kopirajte link: ${inviteLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error(`❌ GREŠKA pri slanju na ${to}:`, error);
      return;
    }

    console.log(`✅ Email uspješno poslan na: ${to}`, data);
  } catch (error) {
    console.error(`❌ GREŠKA pri slanju na ${to}:`, error. message);
  }
};

module.exports = sendInviteEmail;