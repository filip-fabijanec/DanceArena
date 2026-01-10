const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/', (req,res) => {
   res.render('login', {errorlogin: null, errorregister: null});
});

router.get('/', (req,res) => {
   res.render('login', {errorlogin: null, errorregister: null});
});

// ruta za prijavu korisnika
router.post('/register', async (req, res) => {
    try {
        const { ime, prezime, email, lozinka, type } = req.body;

        // Provjeri postoji li već email
        const [rows] = await db.execute('SELECT * FROM korisnici WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.render('login', {errorlogin: null, errorregister: 'Korisnik s tim emailom već postoji.' });
        }

        // Hash lozinke
        const hashedPassword = await bcrypt.hash(lozinka, 10);

        // Ubaci u bazu
        await db.execute(
            'INSERT INTO korisnici (ime, prezime, email, lozinka, tip, odobren) VALUES (?, ?, ?, ?, ?, ?)',
            [ime, prezime, email, hashedPassword, type, 0]
        );

        console.log('Korisnik uspješno prijavljen i spremljen u bazu!');
        res.render('login', {errorlogin: null, errorregister: 'Vaš račun je kreiran, sada administrator mora aktivirati vaš račun.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Greška pri spremanju u bazu.');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, lozinka } = req.body;

        // Provjeri postoji li korisnik
        const [rows] = await db.execute('SELECT * FROM korisnici WHERE email = ?', [email]);
        if (rows.length == 0) {
            return res.render('login', {errorlogin: 'Korisnik s tim emailom ne postoji.', errorregister: null });
        }

        const user = rows[0];

        // Provjeri lozinku
        const isMatch = await bcrypt.compare(lozinka, user.lozinka);
        if (!isMatch) {
            return res.render('login', {errorlogin: 'Pogrešna lozinka.', errorregister: null });
        }

        const isActive = user.odobren;
        if(!isActive) {
            return res.render('login', {errorlogin: 'Vaš račun nije aktiviran od strane administratora.', errorregister: null });
        }

        // Spremaj podatke u session
        req.session.user = {
            id: user.id,
            ime: user.ime,
            prezime: user.prezime,
            email: user.email,
            type: user.tip
        };

        console.log('Korisnik uspješno ulogiran:', user.email);

        req.session.save(err => {
        if (err) console.error(err);
        //console.log('Saved session:', req.session.user);
        res.redirect('/');
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Greška pri ulogiravanju.');
    }
});

router.post('/back', (req,res) => {
   res.redirect('/');
});

module.exports = router;