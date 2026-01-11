const express = require("express");
const PDFDocument = require("pdfkit");
const router = express.Router();
const Performance = require("../models/Performance");
const Competition = require("../models/Competition"); // Dodaj na vrh



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
      .populate("competitionId", "name date location")           // ← DODAJ POPULATE
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
    const competition = await Competition.findById(req.body.competitionId);

    if (!competition) {
      return res.status(404).json({ error: "Natjecanje ne postoji" });
    }

    if (competition.isLocked) {
      return res.status(403).json({
        error: "Natjecanje je zaključano – prijave nisu moguće"
      });
    }

    const newPerformance = new Performance(req.body);
    await newPerformance.save({
      runValidators: true,
      validateBeforeSave: true,
    });
    
    // ← DODAJ POPULATE prije slanja odgovora
    await newPerformance.populate("clubId", "name surname clubName clubLocation");
    await newPerformance.populate("competitionId", "name date location isLocked");
    
    res.status(201).json(newPerformance);
  } catch (error) {
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
      .populate("competitionId", "name date location");
    
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


module.exports = router;
