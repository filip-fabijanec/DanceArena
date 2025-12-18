const express = require('express');
const router = express.Router();
// Pazi da putanja do middlewarea bude točna
const { protect, admin } = require('../middleware/authMiddleware'); 

const { 
  getClanarine, 
  updateClanarina, 
  deleteClanarina 
} = require('../controllers/clanarinaController.js');

// === RUTE ===

// Dodali smo 'admin' - sada samo admin može vidjeti popis
router.get('/', protect, admin, getClanarine);

// Samo admin može mijenjati status (da si netko ne bi sam aktivirao pretplatu)
router.put('/:id', protect, admin, updateClanarina);

// Samo admin može brisati/poništavati
router.delete('/:id', protect, admin, deleteClanarina);

module.exports = router;