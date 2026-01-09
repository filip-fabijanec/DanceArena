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
    const performance = await Performance.findById(req.params.id)
      .populate("clubId", "name surname clubName")
      .populate("competitionId", "name date location");

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

// GENERIRANJE PDF-A 
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

    const performances = await Performance.find({
      competitionId,
      approved: true
    })
      .populate("clubId", "clubName name surname")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="startna_lista_${competitionId}.pdf"`
    );

    doc.pipe(res);

    // ===== HEADER =====
    doc.fontSize(18).text("STARTNA LISTA", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Natjecanje: ${competition?.name || ''}`);
    doc.text(`Datum: ${competition?.date?.toLocaleDateString('hr-HR') || ''}`);
    doc.text(`Lokacija: ${competition?.location || ''}`);
    doc.moveDown(2);

    // ===== GRUPIRANJE PO KATEGORIJAMA =====
    const grouped = {};

    performances.forEach(perf => {
      const key = `${perf.ageCategory} | ${perf.danceStyle} | ${perf.groupSize}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(perf);
    });

    // ===== ISPIS U PDF =====
    Object.keys(grouped).forEach(category => {
      doc
        .fontSize(14)
        .text(`KATEGORIJA: ${category}`, { underline: true });

      doc.moveDown(0.5);

      grouped[category].forEach((perf, index) => {
        const mins = Math.floor(perf.performanceDuration / 60);
        const secs = perf.performanceDuration % 60;

        doc
          .fontSize(11)
          .text(
            `${index + 1}. ${perf.choreographyName} – ${perf.clubId?.clubName || 'N/A'} (${mins}:${secs
              .toString()
              .padStart(2, '0')})`
          );
      });

      doc.moveDown(2);
    });

    doc.end(); 

  } catch (err) {
    console.error(err);
    res.status(500).send("Greška pri generiranju PDF-a");
  }
});


module.exports = router;
