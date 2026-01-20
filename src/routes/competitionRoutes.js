const express = require("express");
const router = express.Router();

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Modeli
const Competition = require("../models/Competition");
const User = require("../models/User");
const Invite = require("../models/Invite");
const Performance = require("../models/Performance");

// Utility
const sendInviteEmail = require("../utils/sendInviteEmail");
const authMiddleware = require("../backend/middleware/authMiddleware");

const PDFDocument = require("pdfkit");

// =======================
// GET /competitions/finished
// =======================
router.get("/finished", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $lt: today },
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
      date: { $gte: today },
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const upcomingCompetitions = competitions.filter(
      (comp) =>
        comp.autoStatus === "upcoming" || comp.autoStatus === "ongoing"
    );

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
      date: { $gt: dateFrom },
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    const filtered = competitions.filter(
      (comp) => comp.autoStatus === "upcoming"
    );

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
      referees: judgeId,
    })
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });

    const competitionsWithStatus = competitions.map((comp) => {
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
// PDF mora biti prije /:id
// =======================
router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({ error: "Natjecanje nije pronađeno" });
    }

    if (!competition.isLocked) {
      return res
        .status(403)
        .json({ error: "Natjecanje nije zaključano" });
    }

    const user = req.user;

    if (user.role === "admin") {
      return res
        .status(403)
        .json({ error: "Administrator nema pristup PDF-u" });
    }

    const isOrganizer =
      competition.organizer.toString() === user._id.toString();

    const isReferee = competition.referees.some(
      (ref) => ref.toString() === user._id.toString()
    );

    let hasPerformance = false;
    if (user.role === "voditeljKluba") {
      const perf = await Performance.findOne({
        competitionId: competition._id,
        clubId: user._id,
        approved: true,
      });
      hasPerformance = !!perf;
    }

    if (!isOrganizer && !isReferee && !hasPerformance) {
      return res
        .status(403)
        .json({ error: "Nemate pravo pristupa PDF-u" });
    }

    const performances = await Performance.find({
      competitionId: competition._id,
      approved: true,
    })
      .populate("clubId", "clubName")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    const fontPath = path.join(
      __dirname,
      "../backend/fonts/DejaVuSans.ttf"
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );

    doc.pipe(res);

    doc.registerFont("dejavu", fontPath);
    doc.font("dejavu");

    doc.text(`Datum: ${competition.date.toLocaleDateString("hr-HR")}`);
    doc.text(`Lokacija: ${competition.location}`);
    doc.moveDown(2);

    const grouped = {};
    performances.forEach((p) => {
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
          `${i + 1}. ${p.choreographyName} – ${
            p.clubId.clubName
          } (${mins}:${secs.toString().padStart(2, "0")})`
        );
      });

      doc.moveDown(1.5);
    }

    doc.end();
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ error: "Greška pri generiranju PDF-a" });
  }
});

// =======================
// GET /competitions/:id/results
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
    ]);

    res.status(200).json(performances);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =======================
// GET /competitions/:id
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
// GET /competitions
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

    const competitionsWithStatus = competitions.map((comp) => {
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
// POST /competitions
// =======================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      organizer,
      referees,
      invitedRefereeEmails,
    } = req.body;

    if (!name || !date || !location || !organizer) {
      return res.status(400).json({ error: "Nedostaju obavezna polja" });
    }

    const competition = new Competition({
      name,
      date,
      location,
      organizer,
      referees: referees || [],
    });

    await competition.save();
    res.status(201).json(competition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =======================
// PUT /competitions/:id
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
// DELETE /competitions/:id
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
