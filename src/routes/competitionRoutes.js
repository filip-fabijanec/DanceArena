const express = require("express");
const router = express.Router();
const Competition = require("../models/Competition");

router.post("/", async (req, res) => {
  try {
    const newCompetition = new Competition(req.body);
    await newCompetition.save({
      runValidators: true,
      validateBeforeSave: true,
    }); // spremanje u bazu podataka
    res.status(201).json(newCompetition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const Competitions = await Competition.find();
    if(!Competitions){
      return res.status(404).json({ error: "No competitions found" });
    }
    res.status(200).json(Competitions);
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