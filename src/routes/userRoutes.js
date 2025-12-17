const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// 1. KREIRANJE KORISNIKA
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

// 2. DOHVAT SVIH KORISNIKA (Admin koristi ovo, ili za debug)
router.get("/", async (req, res) => {
  try {
    // Možemo dodati query parametar ?role=organizator ako želimo filtrirati
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter);
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

// AŽURIRANJE KORISNIKA (Općenito)
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

// BRISANJE KORISNIKA
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OBIČAN LOGIN (Provjeri trebaš li ovdje generirati token kao u secret-login?)
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

    // Vrati korisnika
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SECRET LOGIN (Za brzi pristup tijekom razvoja)
router.post("/secret-login", async (req, res) => {
  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({ error: "Tajna riječ je obavezna" });
    }

    // Mapiranje tajnih riječi na emailove
    const secretMap = {
      "admin123": "martin.tomisic@gmail.com",
      "sudac123": "vitocindori@gmail.com",
      "org123": "fico241@gmail.com",
      "vodklub123": "clashofdubravica@gmail.com"
    };

    const email = secretMap[secret];

    if (!email) {
      return res.status(401).json({ error: "Neispravna tajna riječ" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen" });
    }

    // Generiraj JWT token
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

// GOOGLE LOGIN
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

// ---------------------------------------------------------
// NOVE RUTE ZA ČLANARINE (ORGANIZATORI)
// ---------------------------------------------------------

// 1. ORGANIZATOR PLAĆA ČLANARINU (Simulacija)
router.post('/pay-subscription', async (req, res) => {
    const { userId, months } = req.body; // months = 1 (za 30 dana)
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Korisnik nije pronađen' });
      }
  
      // Izračunaj novi datum
      let newExpiryDate = new Date();
      
      // Ako je korisnik već aktivan i datum je u budućnosti, dodajemo vrijeme na postojeći datum isteka
      // Ako je istekao ili neaktivan, dodajemo vrijeme na današnji datum (resetiramo)
      if (user.subscriptionStatus === 'active' && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()) {
          newExpiryDate = new Date(user.subscriptionExpiry);
      }
  
      // Dodajemo 30 dana (ili koliko mjeseci je poslano)
      newExpiryDate.setDate(newExpiryDate.getDate() + (30 * (months || 1)));
  
      // Ažuriraj korisnika
      user.subscriptionStatus = 'active';
      user.subscriptionExpiry = newExpiryDate;
      user.lastPaymentDate = new Date();
  
      await user.save();
  
      res.json({ 
        message: 'Članarina uspješno plaćena', 
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStatus: user.subscriptionStatus
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Greška na serveru prilikom plaćanja' });
    }
  });
  
  // 2. ADMIN RUČNO MIJENJA STATUS (Update)
  router.put('/:id/subscription', async (req, res) => {
    const { id } = req.params;
    const { subscriptionExpiry, subscriptionStatus } = req.body;
  
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { 
          subscriptionExpiry: new Date(subscriptionExpiry),
          subscriptionStatus: subscriptionStatus 
        },
        { new: true } // Vraća ažurirani objekt
      );
  
      if (!user) {
          return res.status(404).json({ error: 'Korisnik nije pronađen' });
      }
  
      res.json(user);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Greška prilikom ažuriranja članarine' });
    }
  });

module.exports = router;