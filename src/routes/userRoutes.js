const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save({
      runValidators: true,
      validateBeforeSave: true,
    }); // spremanje u bazu podataka
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ error: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /users/referees - samo suci
router.get("/referees", async (req, res) => {
  try {
    const referees = await User.find({ role: "sudac" });
    if (!referees || referees.length === 0) {
      return res.status(404).json({ error: "No referees found" });
    }
    res.status(200).json(referees);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      { runValidators: true, validateBeforeSave: true },
      { context: "query" }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email je obavezan" });
    }

    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ error: "Korisnik s tim emailom ne postoji" });
    }

    // Vrati korisnika (bez osjetljivih podataka ako ih budeš imao)
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dodaj nakon postojećih ruta
router.post("/secret-login", async (req, res) => {
  try {
    const { secret } = req.body;

    // Provjera tajne riječi
    const SECRET_PASSWORD = "admin241"; // možeš staviti svoju
    if (secret !== SECRET_PASSWORD) {
      return res.status(401).json({ error: "Neispravna tajna riječ" });
    }

    // Nađi korisnika kojeg želiš automatski ulogirati
    const user = await User.findOne({ email: "martin.tomisic@gmail.com" });
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen" });
    }

    // Generiraj JWT token (ako koristiš token-based auth)
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.status(200).json({ user, token });

  } catch (error) {
    console.error("Secret login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Google credential je obavezan" });
    }

    // Dekodiranje JWT tokena od Google-a
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Ako korisnik ne postoji, kreiraj ga
      user = new User({
        email: payload.email,
        provider: 'google',
        providerId: payload.sub,
        name: payload.given_name || '',
        surname: payload.family_name || '',
        role: 'voditeljKluba', // default rola
      });
      await user.save();
    }

    // Generiraj JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.status(200).json({ user, token });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

module.exports = router;
