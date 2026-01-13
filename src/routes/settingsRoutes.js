const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const jwt = require("jsonwebtoken");

// Middleware (isti kao prije)
const authenticateToken = (req, res, next) => {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) return res.status(401).json({ error: "Nema tokena" });
  try {
    const token = tokenHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    next();
  } catch (err) { res.status(401).json({ error: "Nevaljan token" }); }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Samo admin" });
  next();
};

// 1. DOHVATI CIJENU (ako ne postoji, kreiraj defaultnu)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ membershipPrice: 50 }); // Default 50
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 2. AŽURIRAJ CIJENU (Samo admin)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { membershipPrice } = req.body;
    
    // Ažuriraj prvi dokument koji nađeš, ili kreiraj novi ako nema
    const settings = await Settings.findOneAndUpdate(
      {}, 
      { membershipPrice, updatedAt: Date.now() },
      { new: true, upsert: true } // upsert: true znači "kreiraj ako ne postoji"
    );
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;