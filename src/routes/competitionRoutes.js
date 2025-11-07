const express = require("express");
const router = express.Router();
const Competition = require("../models/Competition");

router.get("/public", async (req, res) => {
  try {
    const competitions = await Competition.find({
      status: { $in: ["upcoming", "ongoing"] },
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });
    
    // Ažuriraj status prije slanja
    const competitionsWithStatus = competitions.map(comp => {
      const obj = comp.toObject();
      obj.status = comp.autoStatus; // Koristi virtual field
      return obj;
    });
    
    res.status(200).json(competitionsWithStatus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

router.put("/:id", async (req, res) => {
  try {
    const updatedCompetition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      { runValidators: true, validateBeforeSave: true },
      { context: "query" }
    );
    if (!updatedCompetition) {
      return res.status(404).json({ error: "Competition not found" });
    }
    res.status(200).json(updatedCompetition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;