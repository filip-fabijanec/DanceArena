const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");

// =======================
// VALIDACIJA INVITE TOKENA (za registraciju)
// =======================
router.get("/validate/:token", async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });

    if (!invite) {
      return res.status(404).json({ error: "Invite ne postoji" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invite više nije važeći" });
    }

    // Provjeri je li isteklo
    if (new Date() > invite.expiresAt) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ error: "Invite je istekao" });
    }

    res.json({
      email: invite.email,
      role: invite.role,
      competition: invite.competition,
      token: req.params.token,
    });
  } catch (err) {
    console.error("Validate invite error:", err);
    res.status(500).json({ error: "Greška na serveru" });
  }
});

module.exports = router;