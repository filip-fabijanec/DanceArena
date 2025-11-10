const express = require("express");
const router = express.Router();
const Competition = require("../models/Competition");


// GET /competitions/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const competitions = await Competition.find({
      date: { $gte: today } // Datum u budućnosti ili danas
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });
    
    // Filtriranje samo upcoming natjecanja
    const upcomingCompetitions = competitions.filter(comp => {
      return comp.autoStatus === 'upcoming' || comp.autoStatus === 'ongoing';
    });
    
    res.status(200).json(upcomingCompetitions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /competitions (sa query params)
router.get("/", async (req, res) => {
  try {
    const query = req.query.organizerId 
      ? { organizer: req.query.organizerId }
      : {};
    
    const competitions = await Competition.find(query)
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });
    
    if(!competitions || competitions.length === 0){
      return res.status(404).json({ error: "No competitions found" });
    }
    
    // Ažuriraj status prije slanja
    const competitionsWithStatus = competitions.map(comp => {
      const obj = comp.toObject();
      obj.status = comp.autoStatus; // Koristi virtual field za automatski status
      return obj;
    });
    
    res.status(200).json(competitionsWithStatus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /competitions/:id (pojedinačno natjecanje)
router.get("/:id", async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate("organizer", "name surname")
      .populate("referees", "name surname");
    
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    res.status(200).json(competition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /competitions (kreiraj novo natjecanje)
router.post("/", async (req, res) => {
  try {
    const newCompetition = new Competition(req.body);
    await newCompetition.save({
      runValidators: true,
      validateBeforeSave: true,
    });
    res.status(201).json(newCompetition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /competitions/:id (ažuriraj natjecanje)
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

// DELETE /competitions/:id (obriši natjecanje)
router.delete("/:id", async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;