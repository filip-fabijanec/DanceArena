// competitionRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Modeli
const Competition = require("../models/Competition");
const User = require("../models/User");
const Invite = require("../models/Invite");

// Utility za slanje maila
const sendInviteEmail = require("../utils/sendInviteEmail");

const authMiddleware = require("../backend/middleware/authMiddleware");
const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");

// =======================
// GET /competitions/finished (završena natjecanja)
// =======================
router.get("/finished", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $lt: today }
    })
      .populate("organizer", "name surname")
      .sort({ date: -1 });

    res.status(200).json(competitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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
      return comp.autoStatus === "upcoming" || comp.autoStatus === "ongoing";
    });

    res.status(200).json(upcomingCompetitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/upcominglp", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $gte: today }
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const upcomingCompetitions = competitions.filter(comp => {
      return comp.autoStatus === "upcoming";
    });

    res.status(200).json(upcomingCompetitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/ongoinglp", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $gte: today }
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const upcomingCompetitions = competitions.filter(comp => {
      return comp.autoStatus === "ongoing";
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

    const filtered = competitions.filter(comp => comp.autoStatus === "upcoming");

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
    const { judgeId } = req.params;

    const competitions = await Competition.find({
      referees: judgeId
    })
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });

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
// 🔥 KRITIČNO: PDF ROUTE MORA BITI PRIJE /:id ROUTE-A! 🔥
// =======================
router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    console.log("📄 PDF zahtjev - User ID:", req.user._id);
    console.log("📄 PDF zahtjev - User Role:", req.user.role);
    console.log("📄 Competition ID:", req.params.id);

    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({ error: "Natjecanje nije pronađeno" });
    }

    if (!competition.isLocked) {
      return res.status(403).json({ error: "Natjecanje nije zaključano" });
    }

    const user = req.user;

    // ❌ ADMIN NEMA PRAVO
    if (user.role === "admin") {
      return res.status(403).json({ error: "Administrator nema pristup PDF-u" });
    }

    // ✅ ORGANIZATOR
    const isOrganizer = competition.organizer.toString() === user._id.toString();

    // ✅ SUDAC
    const isReferee = competition.referees.some(
      ref => ref.toString() === user._id.toString()
    );

    // ✅ VODITELJ KLUBA koji ima nastup
    let hasPerformance = false;
    if (user.role === "voditeljKluba") {
      const perf = await Performance.findOne({
        competitionId: competition._id,
        clubId: user._id,
        approved: true
      });
      hasPerformance = !!perf;
    }

    console.log("🔐 Auth Check:", { isOrganizer, isReferee, hasPerformance });

    if (!isOrganizer && !isReferee && !hasPerformance) {
      return res.status(403).json({ error: "Nemate pravo pristupa PDF-u" });
    }

    // Dohvati nastupe
    const performances = await Performance.find({
      competitionId: competition._id,
      approved: true
    })
      .populate("clubId", "clubName")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    // Generiraj PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).text("STARTNA LISTA", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Natjecanje: ${competition.name}`);
    doc.text(`Datum: ${competition.date.toLocaleDateString("hr-HR")}`);
    doc.text(`Lokacija: ${competition.location}`);
    doc.moveDown(2);

    // Grupiraj po kategorijama
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
    console.error("❌ PDF Error:", err);
    res.status(500).json({ error: "Greška pri generiranju PDF-a" });
  }
});

// =======================
// GET /competitions/:id/results
// MORA biti prije generičkog /:id!
// =======================
router.get("/:id/results", async (req, res) => {
  try {
    const compId = req.params.id;
    const competition = await Competition.findById(compId);
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    const performances = await Performance.aggregate([
      { $match: { competitionId: competition._id, approved: true } },
      {
        $lookup: {
          from: "scores",
          let: { perfId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$performanceId", "$$perfId"] } } },
            { $group: { _id: null, totalScore: { $sum: "$score" }, judgesCount: { $sum: 1 } } }
          ],
          as: "scores"
        }
      },
      {
        $addFields: {
          totalScore: { $ifNull: [{ $arrayElemAt: ["$scores.totalScore", 0] }, 0] },
          judgesCount: { $ifNull: [{ $arrayElemAt: ["$scores.judgesCount", 0] }, 0] }
        }
      },
      { $lookup: { from: "users", localField: "clubId", foreignField: "_id", as: "club" } },
      { $unwind: { path: "$club", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          choreographyName: 1,
          ageCategory: 1,
          danceStyle: 1,
          groupSize: 1,
          totalScore: 1,
          judgesCount: 1,
          clubName: "$club.clubName",
          _id: 1
        }
      }
    ]);

    // Grupiranje po PLESNI STIL -> DOB -> VELIČINA
    const grouped = {};
    performances.forEach(p => {
      const style = p.danceStyle || "Nepoznat stil";
      const age = p.ageCategory || "Nepoznata kategorija";
      const sizeLabel = p.groupSize || "Nepoznata veličina";
      
      if (!grouped[style]) grouped[style] = {};
      if (!grouped[style][age]) grouped[style][age] = {};
      
      const num = (() => {
        const m = (sizeLabel || "").match(/\d+/);
        return m ? parseInt(m[0], 10) : 999;
      })();
      
      if (!grouped[style][age][sizeLabel]) {
        grouped[style][age][sizeLabel] = { sizeOrder: num, items: [] };
      }
      grouped[style][age][sizeLabel].items.push(p);
    });

    // Sortiranje stilova
    const styleKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    const result = styleKeys.map(style => {
      // Sortiranje dobnih kategorija
      const ageKeys = Object.keys(grouped[style]).sort((a, b) => {
        const na = Number(a), nb = Number(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });

      const ageCategories = ageKeys.map(age => {
        const sizes = Object.keys(grouped[style][age])
          .map(sizeLabel => {
            const bucket = grouped[style][age][sizeLabel];
            bucket.items.sort((a, b) => b.totalScore - a.totalScore);
            const items = bucket.items.map((it, idx) => ({
              rank: idx + 1,
              performanceId: it._id,
              choreographyName: it.choreographyName,
              clubName: it.clubName,
              groupSize: it.groupSize,
              totalScore: it.totalScore,
              judgesCount: it.judgesCount
            }));
            return { sizeLabel, sizeOrder: bucket.sizeOrder, items };
          })
          .sort((a, b) => a.sizeOrder - b.sizeOrder);

        return { ageCategory: age, sizes };
      });

      return { danceStyle: style, ageCategories };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =======================
// GET /competitions/:id (pojedinačno natjecanje)
// ⚠️ MORA biti POSLJEDNJI GET route sa :id parametrom!
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
    const query = req.query.organizerId ? { organizer: req.query.organizerId } : {};

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
      invitedRefereeEmails
    } = req.body;

    if (!name || !date || !location || !organizer) {
      return res.status(400).json({ error: "Nedostaju obavezna polja" });
    }

    const user = await User.findById(organizer);
    if (!user) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    if (user.role !== "organizator") {
      return res.status(403).json({ error: "Samo organizatori mogu kreirati natjecanja." });
    }

    const isSubscriptionActive = user.subscriptionStatus === "active";
    const isDateValid = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

    if (!isSubscriptionActive || !isDateValid) {
      return res.status(403).json({
        error:
          "Vaša članarina je istekla. Molimo platite članarinu kako biste kreirali novo natjecanje."
      });
    }

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
      referees: referees || []
    });

    await competition.save();

    // U competitionRoutes.js, u POST "/" route, zamijenite dio sa invitedRefereeEmails:

if (Array.isArray(invitedRefereeEmails) && invitedRefereeEmails.length > 0) {
  // NOVA VALIDACIJA - Provjeri duplikate
  const allRefereesEmails = new Set();
  
  // 1. Dodaj emailove već odabranih sudaca iz baze
  if (referees && referees.length > 0) {
    const selectedReferees = await User.find({ _id: { $in: referees } });
    selectedReferees.forEach(ref => {
      allRefereesEmails.add(ref.email.toLowerCase());
    });
  }

  // 2. Provjeri pozivnice - je li email duplikat?
  for (const rawEmail of invitedRefereeEmails) {
    const email = rawEmail.toLowerCase().trim();
    if (!email) continue;

    // Provjera duplikata
    if (allRefereesEmails.has(email)) {
      return res.status(400).json({ 
        error: `Email ${email} je već dodan kao sudac!` 
      });
    }
    allRefereesEmails.add(email);

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.role === "sudac") {
      if (!competition.referees.includes(existingUser._id)) {
        competition.referees.push(existingUser._id);
      }
      continue;
    }

    const existingInvite = await Invite.findOne({
      email,
      competition: competition._id,
      status: "pending"
    });

    if (existingInvite) continue;

    const token = crypto.randomBytes(32).toString("hex");

    const invite = new Invite({
      email,
      role: "sudac",
      competition: competition._id,
      invitedBy: organizer,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await invite.save();

    try {
      await sendInviteEmail({
        to: email,
        token,
        competitionName: name
      });
    } catch (emailError) {
      console.error(`Greška pri slanju emaila za ${email}:`, emailError);
    }
  }

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
    const updatedCompetition = await Competition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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

module.exports = router;
