const express = require("express");
const PDFDocument = require("pdfkit");
const router = express.Router();
const Performance = require("../models/Performance");
const Competition = require("../models/Competition"); // Dodaj na vrh
const authMiddleware = require("../backend/middleware/authMiddleware");
const Score = require("../models/Score");
const User = require("../models/User");




// GET - Dohvati sve prijave (s opcionalnim filterom)
router.get("/", async (req, res) => {
  try {
  

    const { competitionId, clubId } = req.query;
    
    // ← DODAJ FILTER ZA QUERY PARAMETRE
    let query = {};
    if (competitionId) query.competitionId = competitionId;
    if (clubId) query.clubId = clubId;
    
    const performances = await Performance.find(query)
      .populate("clubId", "name surname clubName clubLocation")  // ← DODAJ POPULATE
      .populate("competitionId", "name date location isLocked")           // ← DODAJ POPULATE
      .sort({ createdAt: -1 });
    
    if(!performances || performances.length === 0){
      return res.status(404).json({ error: "No performances found" });
    }
    res.status(200).json(performances);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST - Kreiraj novu prijavu
router.post("/", async (req, res) => {
  try {
    console.log('📝 [PERFORMANCE] Kreiram novu prijavu:', req.body);

    const competition = await Competition.findById(req.body.competitionId);

    if (!competition) {
      console.log('❌ [PERFORMANCE] Natjecanje ne postoji:', req.body.competitionId);
      return res.status(404).json({ error: "Natjecanje ne postoji" });
    }

    if (competition.isLocked) {
      console.log('🔒 [PERFORMANCE] Natjecanje je zaključano');
      return res.status(403).json({
        error: "Natjecanje je zaključano – prijave nisu moguće"
      });
    }

    const newPerformance = new Performance(req.body);
    console.log('💾 [PERFORMANCE] Spremam performance...');
    await newPerformance.save({
      runValidators: true,
      validateBeforeSave: true,
    });

    console.log('✅ [PERFORMANCE] Performance spremljen:', newPerformance._id);
    
    // ← DODAJ POPULATE prije slanja odgovora
    await newPerformance.populate("clubId", "name surname clubName clubLocation");
    await newPerformance.populate("competitionId", "name date location isLocked");
    
    res.status(201).json(newPerformance);
  } catch (error) {
    console.error('❌ [PERFORMANCE ERROR]:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ← DODAJ NOVI ENDPOINT za odobravanje
router.put("/:id/approve", async (req, res) => {
  try {
    const performance = await Performance.findById(req.params.id)
      .populate("clubId", "name surname clubName")
      .populate("competitionId", "name date location isLocked");

    if (!performance) {
      return res.status(404).json({ error: "Performance not found" });
    }

    if (!performance.paid) {
      return res.status(403).json({
        error: "Prijava nije plaćena i ne može se prihvatiti"
      });
    }

    performance.approved = true;
    await performance.save();

    res.status(200).json(performance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// PUT - Ažuriraj performance (opcionalno)
router.put("/:id", async (req, res) => {
  try {
    const updatedPerformance = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("clubId", "name surname clubName clubLocation")
      .populate("competitionId", "name date location isLocked");
    
    if (!updatedPerformance) {
      return res.status(404).json({ error: "Performance not found" });
    }
    res.status(200).json(updatedPerformance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - Obriši prijavu
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Performance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Performance not found" });
    }
    res.status(200).json({ message: "Performance deleted successfully" }); // ← Vraćaj message umjesto 204
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/competition/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Dohvati sve nastupe za zadani competitionId
    const performances = await Performance.find({ competitionId })
    

      .populate("clubId", "name surname") // Opcionalno: podaci o klubu
      .populate("competitionId", "name date location isLocked"); // Opcionalno: podaci o natjecanju
    


    if (!performances || performances.length === 0) {
      return res.status(404).json({ message: "Nema nastupa za ovo natjecanje." });
    }

    const performaUpcoming= performances.filter(comp => {
      return comp.approved === true;
    });

    res.status(200).json(performaUpcoming);
  } catch (error) {
    console.error("Greška pri dohvaćanju nastupa:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});

// ✅ GET /performances/:id/scores
// Voditelj vidi ocjene za svoj nastup nakon zaključavanja
router.get("/:id/scores", authMiddleware, async (req, res) => {
  try {
    const performanceId = req.params.id;
    const user = req.user;

    const performance = await Performance.findById(performanceId)
      .populate("competitionId", "isLocked organizer referees date name")
      .populate("clubId", "clubName name surname");

    if (!performance) {
      return res.status(404).json({ error: "Performance not found" });
    }

    const competition = performance.competitionId;

    // mora biti zaključano
    if (!competition.isLocked) {
      return res.status(403).json({ error: "Natjecanje nije zaključano" });
    }

    // prava pristupa
    const isOrganizer =
      competition.organizer?.toString() === user._id.toString();

    const isReferee =
      Array.isArray(competition.referees) &&
      competition.referees.some(r => r.toString() === user._id.toString());

    const isOwnerVoditelj =
      user.role === "voditeljKluba" &&
      performance.clubId?._id.toString() === user._id.toString();

    // admin nema pravo (kao kod PDF-a)
    if (user.role === "admin") {
      return res.status(403).json({ error: "Administrator nema pristup ocjenama" });
    }

    if (!isOrganizer && !isReferee && !isOwnerVoditelj) {
      return res.status(403).json({ error: "Nemate pravo pristupa ocjenama" });
    }

    // dohvati ocjene
    const scores = await Score.find({ performanceId })
      .populate("judgeId", "name surname email")
      .sort({ createdAt: 1 });

    const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
    const judgesCount = scores.length;
    const avgScore = judgesCount > 0 ? totalScore / judgesCount : 0;

    return res.status(200).json({
      performance: {
        _id: performance._id,
        choreographyName: performance.choreographyName,
        ageCategory: performance.ageCategory,
        danceStyle: performance.danceStyle,
        groupSize: performance.groupSize,
        clubName: performance.clubId?.clubName,
        competitionName: competition.name
      },
      scores: scores.map(s => ({
        _id: s._id,
        score: s.score,
        judge: s.judgeId
          ? { _id: s.judgeId._id, name: s.judgeId.name, surname: s.judgeId.surname }
          : null
      })),
      summary: {
        totalScore,
        judgesCount,
        avgScore
      }
    });
  } catch (err) {
    console.error("❌ GET performance scores error:", err);
    return res.status(500).json({ error: "Greška pri dohvaćanju ocjena" });
  }
});


module.exports = router;
