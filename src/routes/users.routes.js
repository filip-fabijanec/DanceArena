const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', async (req,res) => {
   const [rows] = await db.execute('SELECT * FROM korisnici');
   console.log(rows);
   res.render('users', { users: rows });
});

router.post('/main', (req,res) => {
   res.redirect('/');
});

router.post('/delete', async (req,res) => {
   const { email } = req.body;
   await db.execute('DELETE FROM korisnici WHERE email = ?', [email]);
   res.redirect('/users');
});

router.post('/approve', async (req,res) => {
   const { email } = req.body;
   await db.execute('UPDATE korisnici SET odobren = 1 WHERE email = ?', [email]);
   res.redirect('/users');
});

router.post('/unapprove', async (req,res) => {
   const { email } = req.body;
   await db.execute('UPDATE korisnici SET odobren = 0 WHERE email = ?', [email]);
   res.redirect('/users');
});

module.exports = router;