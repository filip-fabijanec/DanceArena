const express = require("express");
const router = express.Router();
const User = require("../models/User");

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

module.exports = router;
