const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Modeli
const Competition = require("../models/Competition");
const User = require("../models/User");
const Invite = require("../models/Invite");

// Utility za slanje maila
const sendInviteEmail = require("../utils/sendInviteEmail");


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

    const upcomingCompetitions = competitions.filter(comp => {
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
// GET /competitions/judge/:judgeId
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
    const competition = await Competition.findById(req.params.id)
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
// =======================
router.get("/", async (req, res) => {
  try {
    const query = req.query.organizerId
      ? { organizer: req.query.organizerId }
      : {};

    const competitions = await Competition.find(query)
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });

    if (!competitions || competitions.length === 0) {
      return res.status(200).json([]);
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
    if (!name || !date || !location || !organizer) {
      return res.status(400).json({ error: "Nedostaju obavezna polja" });
    }

    // 1. Dohvati korisnika iz baze
    const user = await User.findById(organizer);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    // 2. PROVJERA: Je li korisnik uopće organizator?
    if (user.role !== 'organizator') {
      return res.status(403).json({ error: "Samo organizatori mogu kreirati natjecanja." });
    }

    // 3. PROVJERA PLAĆANJA
    const isSubscriptionActive = user.subscriptionStatus === 'active';
    const isDateValid = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

    if (!isSubscriptionActive || !isDateValid) {
      return res.status(403).json({
        error: "Vaša članarina je istekla. Molimo platite članarinu kako biste kreirali novo natjecanje."
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
      referees: referees || [],
    });

    await competition.save();

    // =======================
    // INVITE REFEREE EMAILS
    // =======================
    if (Array.isArray(invitedRefereeEmails) && invitedRefereeEmails.length > 0) {
      
      for (const rawEmail of invitedRefereeEmails) {
        const email = rawEmail.toLowerCase().trim();
        if (!email) continue;

        // A) Ako user već postoji kao sudac -> samo ga dodaj u natjecanje
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.role === "sudac") {
          if (!competition.referees.includes(existingUser._id)) {
            competition.referees.push(existingUser._id);
          }
          continue; 
        }

        // B) Ako user ne postoji ili nije sudac -> šaljemo INVITE
        
        // Provjeri postoji li već aktivni invite
        const existingInvite = await Invite.findOne({
          email,
          competition: competition._id,
          status: "pending",
        });

        if (existingInvite) continue; // Već je pozvan

        // Kreiraj token (32 bajta hex)
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
            token, // Ovo šaljemo u e-mailu kao ?invite=token
            competitionName: name,
          });
        } catch (emailError) {
          console.error(`Greška pri slanju emaila za ${email}:`, emailError);
          // Ne prekidamo petlju, samo logiramo grešku
        }
      }

      // Spremi promjene na natjecanju (ako smo dodali postojeće suce)
      await competition.save();
    }

    res.status(201).json(competition);

  } catch (error) {
    console.error("Create competition error:", error);
    res.status(400).json({ error: error.message });
  }
});

// =======================
// PUT /competitions/:id (ažuriraj natjecanje)
// =======================
router.put("/:id", async (req, res) => {
  try {
    const updatedCompetition = await Competition.findByIdAndUpdate(
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
    const competition = await Competition.findById(req.params.id);

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
// DELETE /competitions/:id (obriši natjecanje)
// =======================
router.delete("/:id", async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const authMiddleware = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");

router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition || !competition.isLocked) {
      return res.status(403).json({ error: "Natjecanje nije zaključano" });
    }

    const user = req.user;

    // ❌ ADMIN NEMA PRAVO
    if (user.role === "administrator") {
      return res.status(403).json({ error: "Administrator nema pristup PDF-u" });
    }

    // ✅ ORGANIZATOR
    const isOrganizer =
      competition.organizer.toString() === user._id.toString();

    // ✅ SUDAC
    const isReferee =
      competition.referees.some(
        ref => ref.toString() === user._id.toString()
      );

    // ✅ VODITELJ S PRIJAVOM
    const hasPerformance =
      user.role === "voditelj" &&
      await Performance.exists({
        competitionId: competition._id,
        clubId: user._id
      });

    if (!isOrganizer && !isReferee && !hasPerformance) {
      return res.status(403).json({ error: "Nemaš pravo na PDF" });
    }

    const performances = await Performance.find({
      competitionId: competition._id,
      approved: true
    })
      .populate("clubId", "clubName")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).text("STARTNA LISTA", { align: "center" });
    doc.moveDown();

    doc.text(`Natjecanje: ${competition.name}`);
    doc.text(`Datum: ${competition.date.toLocaleDateString("hr-HR")}`);
    doc.text(`Lokacija: ${competition.location}`);
    doc.moveDown(2);

    const grouped = {};

    performances.forEach(p => {
      const key = `${p.ageCategory} | ${p.danceStyle} | ${p.groupSize}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    for (const category in grouped) {
      doc.fontSize(14).text(category, { underline: true });
      doc.moveDown(0.5);

      grouped[category].forEach((p, i) => {
        const mins = Math.floor(p.performanceDuration / 60);
        const secs = p.performanceDuration % 60;
        doc.fontSize(11).text(
          `${i + 1}. ${p.choreographyName} – ${p.clubId.clubName} (${mins}:${secs
            .toString()
            .padStart(2, "0")})`
        );
      });

      doc.moveDown(1.5);
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Greška pri generiranju PDF-a");
  }
});

module.exports = router;