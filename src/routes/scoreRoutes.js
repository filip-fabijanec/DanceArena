const express = require("express");
const router = express.Router();
const Score = require("../models/Performance");

router.post("/", async (req, res) => {
  try {
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

router.get("/", async (req, res) => {
  try {
    const scores = await Score.find();
    if(!scores){
      return res.status(404).json({ error: "No scores found" });
    }
    res.status(200).json(scores);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
