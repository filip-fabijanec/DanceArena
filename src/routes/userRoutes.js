const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ============================================================
// 1. DOHVAT TRENUTNOG KORISNIKA (ME) + PROVJERA ISTEKA
// ⚠️ OVO MORA BITI NA VRHU (prije svih ruta s /:id) ⚠️
// ============================================================
router.get("/me", async (req, res) => {
  try {
    // 1. Provjera tokena
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) return res.status(401).json({ error: "Nema tokena" });

    const token = tokenHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123"); 

    // 2. Nađi korisnika
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen" });
    }

    // -----------------------------------------------------------
    // ⏰ PROVJERA ISTEKA ČLANARINE
    // -----------------------------------------------------------
    if (user.role === 'organizator' && user.subscriptionStatus === 'active') {
        const now = new Date();
        const expiryDate = new Date(user.subscriptionExpiry);

        // Ako nema datuma ili je "danas" veće od "datuma isteka"
        if (!user.subscriptionExpiry || now > expiryDate) {
            console.log(`⏳ ISTEKLA ČLANARINA za ${user.email}. Mijenjam u inactive.`);
            
            user.subscriptionStatus = 'inactive';
            // user.subscriptionExpiry = null; // (Opcionalno brisanje datuma)
            
            await user.save(); // Spremi u bazu ODMAH
            console.log("✅ Spremljeno u bazu.");
        }
    }
    // -----------------------------------------------------------

    res.status(200).json(user);

  } catch (error) {
    console.error("Greška u /me ruti:", error);
    res.status(401).json({ error: "Nevaljan token" });
  }
});

// ============================================================
// OSTALE RUTE
// ============================================================

// 2. KREIRANJE KORISNIKA
router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save({
      runValidators: true,
      validateBeforeSave: true,
    }); 
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. DOHVAT SVIH KORISNIKA
router.get("/", async (req, res) => {
  try {
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

// RUTA ZA POPRAVAK BAZE
router.get("/fix-database", async (req, res) => {
  try {
    const updateResult = await User.updateMany(
      { subscriptionStatus: { $exists: false } }, 
      { 
        $set: { 
          subscriptionStatus: 'inactive',
          subscriptionExpiry: null,
          jeAktivan: true, 
          adresa: "" 
        } 
      }
    );
    res.json({ message: "Baza ažurirana!", updatedCount: updateResult.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AŽURIRANJE KORISNIKA (Općenito)
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      { runValidators: true, validateBeforeSave: true, context: "query" }
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
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

// OBIČAN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email je obavezan" });

    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ error: "Korisnik ne postoji" });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SECRET LOGIN
router.post("/secret-login", async (req, res) => {
  try {
    const { secret } = req.body;
    if (!secret) return res.status(400).json({ error: "Tajna riječ je obavezna" });

    const secretMap = {
      "admin123": "martin.tomisic@gmail.com",
      "sudac123": "vitocindori@gmail.com",
      "org123": "fico241@gmail.com",
      "vodklub123": "clashofdubravica@gmail.com"
    };

    const email = secretMap[secret];
    if (!email) return res.status(401).json({ error: "Neispravna tajna riječ" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

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
    if (!credential) return res.status(400).json({ error: "Google credential obavezan" });

    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        email: payload.email,
        provider: 'google',
        providerId: payload.sub,
        name: payload.given_name || '',
        surname: payload.family_name || '',
        role: 'voditeljKluba',
      });
      await user.save();
    }

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
// RUTE ZA ČLANARINE
// ---------------------------------------------------------

// 1. ORGANIZATOR PLAĆA ČLANARINU
router.post('/pay-subscription', async (req, res) => {
   const { userId, months } = req.body; 
   try {
     const user = await User.findById(userId);
     if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });
 
     let newExpiryDate = new Date();
     if (user.subscriptionStatus === 'active' && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()) {
         newExpiryDate = new Date(user.subscriptionExpiry);
     }
 
     newExpiryDate.setDate(newExpiryDate.getDate() + (30 * (months || 1)));
 
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
     res.status(500).json({ error: 'Greška na serveru' });
   }
 });
 
 // 2. ADMIN RUČNO MIJENJA STATUS
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
       { new: true } 
     );
 
     if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });
     res.json(user);
 
   } catch (err) {
     console.error(err);
     res.status(500).json({ error: 'Greška prilikom ažuriranja' });
   }
 });

module.exports = router;