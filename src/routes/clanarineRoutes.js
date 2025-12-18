const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware za provjeru tokena
const authenticateToken = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) return res.status(401).json({ error: "Nema tokena" });

    const token = tokenHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token greška:", error);
    return res.status(401).json({ error: "Nevaljan token" });
  }
};

// Middleware za provjeru da li je korisnik admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Pristup zabranjen - potrebna admin uloga" });
  }
  next();
};

// ============================================================
// 1. DOHVAT SVIH ORGANIZATORA (samo za admina)
// ============================================================
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Dohvati samo organizatore
    const organizatori = await User.find({ role: "organizator" })
      .select('name surname email subscriptionStatus subscriptionExpiry lastPaymentDate')
      .sort({ subscriptionStatus: -1, subscriptionExpiry: -1 });

    res.status(200).json(organizatori);
  } catch (error) {
    console.error("Greška pri dohvatu organizatora:", error);
    res.status(500).json({ error: "Greška na serveru" });
  }
});

// ============================================================
// 2. AŽURIRANJE ČLANARINE (samo za admina)
// ============================================================
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionStatus, subscriptionExpiry } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen" });
    }

    if (user.role !== 'organizator') {
      return res.status(400).json({ error: "Ova operacija je dostupna samo za organizatore" });
    }

    user.subscriptionStatus = subscriptionStatus;
    user.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Greška pri ažuriranju članarine:", error);
    res.status(500).json({ error: "Greška na serveru" });
  }
});

// ============================================================
// 3. PONIŠTAVANJE ČLANARINE (postavlja status na inactive)
// ============================================================
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen" });
    }

    if (user.role !== 'organizator') {
      return res.status(400).json({ error: "Ova operacija je dostupna samo za organizatore" });
    }

    user.subscriptionStatus = 'inactive';
    user.subscriptionExpiry = null;

    await user.save();

    res.status(200).json({ message: "Članarina poništena", user });
  } catch (error) {
    console.error("Greška pri poništavanju članarine:", error);
    res.status(500).json({ error: "Greška na serveru" });
  }
});

module.exports = router;