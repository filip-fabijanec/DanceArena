const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Competition = require("../models/Competition");
const User = require("../models/User");
const Invite = require("../models/Invite");
const sendInviteEmail = require("../utils/SendInviteEmail");


// =======================
// GET /competitions/upcoming
// =======================
router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $gte: today }
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const upcomingCompetitions = competitions. filter(comp => {
      return comp.autoStatus === 'upcoming' || comp.autoStatus === 'ongoing';
    });

    res.status(200).json(upcomingCompetitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET /competitions/upcoming/after-2-days
// =======================
router.get("/upcoming/after-2-days", async (req, res) => {
  try {
    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);
    dateFrom.setDate(dateFrom.getDate() + 2);

    const competitions = await Competition.find({
      date: { $gt: dateFrom }
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const filtered = competitions.filter(comp => comp.autoStatus === 'upcoming');

    res.status(200).json(filtered);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET /competitions/judge/: judgeId
// =======================
router.get("/judge/:judgeId", async (req, res) => {
  try {
    const competitions = await Competition.find({
      referees: req.params.judgeId
    })
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });

    if (!competitions || competitions.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(competitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET /competitions/:id (pojedinačno natjecanje)
// =======================
router.get("/:id", async (req, res) => {
  try {
    const competition = await Competition.findById(req. params.id)
      .populate("organizer", "name surname email")
      .populate("referees", "name surname email");

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    res.status(200).json(competition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// GET /competitions (sa query params)
// NAPOMENA: OVO MORA BITI ZADNJE GET PRIJE POST! 
// =======================
router.get("/", async (req, res) => {
  try {
    const query = req.query. organizerId
      ? { organizer: req. query.organizerId }
      :  {};

    const competitions = await Competition.find(query)
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });

    if (!competitions || competitions.length === 0) {
      return res. status(200).json([]);
    }

    const competitionsWithStatus = competitions.map(comp => {
      const obj = comp.toObject();
      obj.status = comp.autoStatus;
      return obj;
    });

    res.status(200).json(competitionsWithStatus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// POST /competitions (KREIRANJE)
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

    // Osnovna validacija
    if (!name || !date || !location || ! organizer) {
      return res. status(400).json({ error: "Nedostaju obavezna polja" });
    }

    // 1. Dohvati korisnika iz baze
    const user = await User.findById(organizer);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    // 2. PROVJERA:  Je li korisnik uopće organizator?
    if (user. role !== 'organizator') {
      return res. status(403).json({ error: "Samo organizatori mogu kreirati natjecanja." });
    }

    // 3. PROVJERA PLAĆANJA (Ključni dio)
    const isSubscriptionActive = user.subscriptionStatus === 'active';
    const isDateValid = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

    if (!isSubscriptionActive || !isDateValid) {
      return res.status(403).json({
        error: "Vaša članarina je istekla.  Molimo platite članarinu kako biste kreirali novo natjecanje."
      });
    }

    // 4. Kreiraj natjecanje
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
          competition: competition._id,
          status: "pending",
        });

        if (existingInvite) continue;

        // Kreiraj token
        const token = crypto.randomBytes(32).toString("hex");

        const invite = new Invite({
          email,
          role: "sudac",
          competition: competition._id,
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
    res.status(400).json({ error: error.message });
  }
});


// =======================
// PUT /competitions/: id (ažuriraj natjecanje)
// =======================
router.put("/: id", async (req, res) => {
  try {
    const updatedCompetition = await Competition. findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCompetition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    res.status(200).json(updatedCompetition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================
// PUT /competitions/:id/lock
// =======================
router.put("/:id/lock", async (req, res) => {
  try {
    const competition = await Competition.findById(req.params. id);

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    if (competition.isLocked) {
      return res.status(400).json({ error: "Prijave su već zaključane" });
    }

    competition.isLocked = true;
    await competition.save();

    res.status(200).json(competition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri zaključavanju" });
  }
});


// =======================
// DELETE /competitions/: id (obriši natjecanje)
// =======================
router.delete("/: id", async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;