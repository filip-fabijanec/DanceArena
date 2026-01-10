const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', async (req,res) => {
   const [rows] = await db.execute('SELECT * FROM natjecanja');
   console.log(rows);
   res.render('events', { events: rows, user: req.session.user});
});

router.post('/back', (req,res) => {
   res.redirect('/');
});

router.post('/add', async (req,res) => {
   const { naziv, datum, lokacija, opis, kotizacija, organizator_email } = req.body;
   await db.execute('INSERT INTO natjecanja (naziv, datum, lokacija, opis, kotizacija, organizator_email) VALUES (?, ?, ?, ?, ?, ?)', [naziv, datum, lokacija, opis, kotizacija, organizator_email]);
   res.redirect('/events');
});

router.post('/delete', async (req,res) => {
   const { id } = req.body;
   await db.execute('DELETE FROM natjecanja WHERE id = ?', [id]);
   res.redirect('/events');
}  );

router.post('/edit', async (req,res) => {  
}  );
module.exports = router;