const express = require("express");
const PDFDocument = require("pdfkit");
const router = express.Router();
const Performance = require("../models/Performance");

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
    const newPerformance = new Performance(req.body);
    await newPerformance.save({
      runValidators: true,
      validateBeforeSave: true,
    });
    
    // ← DODAJ POPULATE prije slanja odgovora
    await newPerformance.populate("clubId", "name surname clubName clubLocation");
    await newPerformance.populate("competitionId", "name date location");
    
    res.status(201).json(newPerformance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ← DODAJ NOVI ENDPOINT za odobravanje
router.put("/:id/approve", async (req, res) => {
  try {
    const performance = await Performance.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true, runValidators: true }
    )
      .populate("clubId", "name surname clubName clubLocation")
      .populate("competitionId", "name date location");
    
    if (!performance) {
      return res.status(404).json({ error: "Performance not found" });
    }
    
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

router.get("/competition/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Dohvati sve nastupe za zadani competitionId
    const performances = await Performance.find({ competitionId })
      .populate("clubId", "name surname") // Opcionalno: podaci o klubu
      .populate("competitionId", "name date location"); // Opcionalno: podaci o natjecanju

    if (!performances || performances.length === 0) {
      return res.status(404).json({ message: "Nema nastupa za ovo natjecanje." });
    }

    res.status(200).json(performances);
  } catch (error) {
    console.error("Greška pri dohvaćanju nastupa:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});

router.get('/export-pdf/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const competition = await Competition.findById(competitionId);
    const performances = await Performance.find({ competitionId });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="natjecanje_${competitionId}.pdf"`);

    doc.fontSize(16).text(`Natjecanje: ${competition?.name || ''}`);
    doc.fontSize(14).text(`Natjecanje: ${competition?.organizer || ''}`);
    doc.fontSize(12).text(`Datum: ${competition?.date || ''}`);
    doc.moveDown();

    performances.forEach((perf, idx) => {
      doc.text(`${idx + 1}. ${perf.choreographyName} (${perf.clubId?.clubName || 'N/A'})`);
    });

    doc.end();
    doc.pipe(res);
  } catch (err) {
    res.status(500).send('Greška pri generiranju PDF-a');
  }
});


module.exports = router;
