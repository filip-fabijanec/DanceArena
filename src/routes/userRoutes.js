const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM kategorije ORDER BY id');
        res.render('home', { kategorije: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

module.exports = router;
