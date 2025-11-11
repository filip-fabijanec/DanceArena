const nodeMailer = require("nodemailer");

async function sendInviteEmail(email){
    const transporter = nodeMailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: '"DanceArena" <no-reply@dancearena.com>',
        to: email,
        subject: 'Pozivnica za registraciju na DanceArena!',
        html:  `
        <p>Pozvani ste kao sudac na DanceArena platformu!</p>
        <p>Kliknite na <a href="https://dancearena.com/register?email=${email}">link za registraciju</a> da biste završili proces registracije.</p>
        `
    });
}

module.exports = sendInviteEmail;