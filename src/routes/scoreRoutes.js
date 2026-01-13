const express = require("express");
const router = express.Router();
const Score = require("../models/Score");
const Performance = require("../models/Performance");
const Competition = require("../models/Competition");

router.post("/", async (req, res) => {
  try {
    const { performanceId, judgeId } = req.body;

    // Provjeri postoji li izvedba
    const perf = await Performance.findById(performanceId).populate('competitionId', 'date');
    if (!perf) {
      return res.status(404).json({ error: "Performance not found" });
    }

    // Provjeri status natjecanja (je li već prošlo)
    const today = new Date();
    today.setHours(0,0,0,0);
    const compDate = new Date(perf.competitionId.date);
    compDate.setHours(0,0,0,0);

    if (compDate.getTime() < today.getTime()) {
      return res.status(400).json({ error: "Ocjenjivanje nije dozvoljeno za završena natjecanja." });
    }

    // Opcionalno: spriječi da isti sudac više puta ocijeni istu izvedbu
    const existing = await Score.findOne({ performanceId, judgeId });
    if (existing) {
      return res.status(409).json({ error: "Već ste ocijenili ovu izvedbu." });
    }

    const newScore = new Score(req.body);
    await newScore.save({
      runValidators: true,
      validateBeforeSave: true,
    }); // spremanje u bazu podataka
    res.status(201).json(newScore);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /scores - sve ocjene (opcionalno filtrirano)
router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.judgeId) query.judgeId = req.query.judgeId;
    if (req.query.performanceId) query.performanceId = req.query.performanceId;

    const scores = await Score.find(query)
      .populate({ path: 'performanceId', populate: { path: 'competitionId', select: 'name date' } });

    if(!scores){
      return res.status(404).json({ error: "No scores found" });
    }
    res.status(200).json(scores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /scores/judge/:judgeId - sve ocjene jednog suca
router.get('/judge/:judgeId', async (req, res) => {
  try {
    const { judgeId } = req.params;
    const scores = await Score.find({ judgeId })
      .populate({ path: 'performanceId', populate: { path: 'competitionId', select: 'name date' } });
    res.status(200).json(scores);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedScore = await Score.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      { runValidators: true, validateBeforeSave: true },
      { context: "query" }
    );
    if (!updatedScore) {
      return res.status(404).json({ error: "Score not found" });
    }
    res.status(200).json(updatedScore);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Score.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
