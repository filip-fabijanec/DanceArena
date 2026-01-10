const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Competition = require("../models/Competition");
const User = require("../models/User");
const Invite = require("../models/Invite");
const sendInviteEmail = require("../utils/sendInviteEmail");


// =======================
// CREATE COMPETITION
// =======================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      description,
      ageCategories,
      danceStyles,
      groupSizes,
      registrationFee,
      organizer,
      referees,
      invitedRefereeEmails,
    } = req.body;

    // osnovna validacija
    if (!name || !date || !location || ! organizer) {
      return res.status(400).json({ error: "Nedostaju obavezna polja" });
    }

    // kreiranje natjecanja
    const competition = new Competition({
      name,
      date,
      location,
      description,
      ageCategories,
      danceStyles,
      groupSizes,
      registrationFee,
      organizer,
      referees:  referees || [],
    });

    await competition.save();

    // =======================
    // INVITE REFEREE EMAILS
    // =======================
    if (Array.isArray(invitedRefereeEmails) && invitedRefereeEmails.length > 0) {
      for (const rawEmail of invitedRefereeEmails) {
        const email = rawEmail.toLowerCase().trim();

        if (! email) continue;

        // Ako user već postoji kao sudac → samo ga dodaj
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.role === "sudac") {
          if (!competition.referees.includes(existingUser._id)) {
            competition.referees.push(existingUser._id);
          }
          continue;
        }

        // Ako već postoji aktivni invite → preskoči
        const existingInvite = await Invite.findOne({
          email,
          competition:  competition._id,
          status: "pending",
        });

        if (existingInvite) continue;

        // Kreiraj token
        const token = crypto.randomBytes(32).toString("hex");

        const invite = new Invite({
          email,
          role:  "sudac",
          competition:  competition._id,
          invitedBy: organizer,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dana
        });

        await invite.save();

        // Pošalji mail
        try {
          await sendInviteEmail({
            to: email,
            token,
            competitionName: name,
          });
        } catch (emailError) {
          console.error(`Greška pri slanju emaila za ${email}:`, emailError);
          // Invite se sprema čak i ako mail fail-a
        }
      }

      // Spremi dodane suce
      await competition.save();
    }

    res.status(201).json(competition);

  } catch (error) {
    console.error("Create competition error:", error);
    res.status(500).json({ error: "Greška pri kreiranju natjecanja" });
  }
});


// =======================
// GET ALL COMPETITIONS
// =======================
router. get("/", async (req, res) => {
  try {
    const competitions = await Competition.find()
      .populate("organizer", "name surname email")
      .populate("referees", "name surname email");

    res.status(200).json(competitions);
  } catch (error) {
    res.status(500).json({ error: "Greška pri dohvaćanju natjecanja" });
  }
});


// =======================
// GET COMPETITION BY ID
// =======================
router.get("/:id", async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate("organizer", "name surname email")
      .populate("referees", "name surname email");

    if (!competition) {
      return res.status(404).json({ error: "Natjecanje nije pronađeno" });
    }

    res.status(200).json(competition);
  } catch (error) {
    res.status(500).json({ error: "Greška pri dohvaćanju natjecanja" });
  }
});


// =======================
// DELETE COMPETITION
// =======================
router.delete("/:id", async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Greška pri brisanju natjecanja" });
  }
});

module.exports = router;