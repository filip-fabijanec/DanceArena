const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/', (req,res) => {
   res.render('settings', {user: req.session.user, error: null});
});

router.get('/', (req,res) => {
   res.render('settings', {user: req.session.user, error: null});
});

router.post('/back', (req,res) => {
   res.redirect('/');
});



router.post('/logout', (req,res) => {
   req.session.user = null;
   req.session.save(err => {
        if (err) console.error(err);
        console.log('Saved session:', req.session.user);
        res.redirect('/');
    });
});

router.post('/changePassword', async (req,res) => {
   const { email, oldPassword, newPassword } = req.body;
   const [rows] = await db.execute('SELECT * FROM korisnici WHERE email = ?', [email]);

   const user = rows[0];

   // Provjeri lozinku
   const isMatch = await bcrypt.compare(oldPassword, user.lozinka);
   if (!isMatch) {
      return res.render('settings', { user: req.session.user, error: 'Pogrešna trenutna lozinka.' });
   }

   // Hash lozinke
   const hashedPassword = await bcrypt.hash(newPassword, 10);
   await db.execute('UPDATE korisnici SET lozinka = ? WHERE email = ?', [hashedPassword, email]);
   return res.render('settings', { user: req.session.user, error: 'Uspješno ste promijenili lozinku.' });
});
    

module.exports = router;