const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Invite = require("../models/Invite");
const Competition = require("../models/Competition");
const jwt = require("jsonwebtoken");


// =======================
// CREATE USER (REGISTRACIJA)
// =======================
router.post("/", async (req, res) => {
  try {
    const { inviteToken, email, role } = req.body;

    let invite = null;

    // Ako postoji invite → validacija
    if (inviteToken) {
      invite = await Invite.findOne({ token: inviteToken });

      if (!invite)
        return res.status(400).json({ error: "Neispravan invite token" });

      if (invite.used)
        return res.status(400).json({ error: "Invite je već iskorišten" });

      if (invite.status !== "pending")
        return res.status(400).json({ error: "Invite više nije validan" });

      if (new Date() > invite.expiresAt)
        return res.status(400).json({ error: "Invite je istekao" });

      if (invite.email !== email || invite.role !== role)
        return res.status(403).json({ error: "Invite podaci se ne podudaraju" });
    }

    const newUser = new User(req.body);
    await newUser.save({
      runValidators: true,
      validateBeforeSave: true,
    });

    // Ako je invite → poveži suca s natjecanjem
    if (invite) {
      await Competition.findByIdAndUpdate(
        invite.competition,
        { $addToSet: { referees: newUser._id } }
      );

      invite.used = true;
      invite.status = "accepted";
      invite.acceptedBy = newUser._id;
      invite.acceptedAt = new Date();
      await invite.save();
    }

    res.status(201).json(newUser);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET ALL USERS
// =======================
router.get("/", async (req, res) => {
  try {
    const users = await User. find();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET REFEREES
// =======================
router.get("/referees", async (req, res) => {
  try {
    const referees = await User.find({ role: "sudac" });
    res.status(200).json(referees);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// UPDATE USER
// =======================
router. put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req. params.id,
      req. body,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    if (!updatedUser)
      return res.status(404).json({ error: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// DELETE USER
// =======================
router.delete("/: id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// SECRET LOGIN (DEBUG)
// =======================
router. post("/secret-login", async (req, res) => {
  try {
    const { secret } = req.body;

    const secretMap = {
      admin123: "martin.tomisic@gmail.com",
      sudac123: "vitocindori@gmail.com",
      org123: "fico241@gmail.com",
      vodklub123: "clashofdubravica@gmail.com",
    };

    const email = secretMap[secret];
    if (!email)
      return res.status(401).json({ error: "Neispravna tajna riječ" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "Korisnik nije pronađen" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.status(200).json({ user, token });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


// =======================
// GOOGLE LOGIN
// =======================
router. post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ error: "Credential missing" });

    const base64Url = credential.split(". ")[1];
    const jsonPayload = Buffer.from(base64Url, "base64").toString("utf8");
    const payload = JSON. parse(jsonPayload);

    const user = await User.findOne({ email: payload.email });

    // 🔴 AKO USER NE POSTOJI → FRONTEND REDIRECTA NA REGISTRACIJU
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const token = jwt. sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.status(200).json({ user, token });

  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

module.exports = router;