const express = require("express");
const router = express.Router();
const Competition = require("../models/Competition");
const User = require("../models/User"); // <--- OBAVEZNO: Treba nam za provjeru članarine

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

// GET /competitions/upcoming/after-2-days
router.get("/upcoming/after-2-days", async (req, res) => {
  try {
    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);
    dateFrom.setDate(dateFrom.getDate() + 2);

    const competitions = await Competition.find({
      date: { $gt: dateFrom }
    })
      .populate("organizer", "name surname")
      .sort({ date: 1 });

    // dodatna sigurnost – filtriraj samo upcoming
    const filtered = competitions.filter(comp => comp.autoStatus === 'upcoming');

    res.status(200).json(filtered);
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
      // Vraćamo prazan array umjesto 404 da frontend ne pukne ako nema natjecanja
      return res.status(200).json([]); 
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

// GET /judge/:judgeId
router.get("/judge/:judgeId", async (req, res) => {
  try {
    const competitions = await Competition.find({
      referees: req.params.judgeId // Pronađi natjecanja gdje je sudac u referees polju
    })
      .populate("organizer", "name surname")
      .populate("referees", "name surname")
      .sort({ date: -1 });
    
    if (!competitions || competitions.length === 0) {
      return res.status(200).json([]); // Vrati prazno polje umjesto error
    }
    
    res.status(200).json(competitions);
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

// ---------------------------------------------------------------------
// POST /competitions (KREIRANJE - S PROVJEROM ČLANARINE)
// ---------------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    // Dohvaćamo ID organizatora iz tijela zahtjeva
    // Pazi: Frontend mora poslati polje "organizer" s ID-om korisnika
    const organizerId = req.body.organizer;

    if (!organizerId) {
        return res.status(400).json({ error: "Nedostaje ID organizatora (organizer field)." });
    }

    // 1. Dohvati korisnika iz baze
    const user = await User.findById(organizerId);
    if (!user) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    // 2. PROVJERA: Je li korisnik uopće organizator?
    if (user.role !== 'organizator') {
        return res.status(403).json({ error: "Samo organizatori mogu kreirati natjecanja." });
    }

    // 3. PROVJERA PLAĆANJA (Ključni dio)
    // Provjeravamo je li status 'active' I je li datum u budućnosti
    const isSubscriptionActive = user.subscriptionStatus === 'active';
    const isDateValid = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

    if (!isSubscriptionActive || !isDateValid) {
        return res.status(403).json({ 
            error: "Vaša članarina je istekla. Molimo platite članarinu kako biste kreirali novo natjecanje." 
        });
    }

    // 4. Ako je sve OK, kreiraj natjecanje
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

// PUT /competitions/:id/lock
router.put("/:id/lock", async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    if (competition.isLocked) {
      return res.status(400).json({ error: "Prijave su već zaključane" });
    }

    competition.isLocked = true;
    await competition.save();

    res.status(200).json(competition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri zaključavanju" });
  }
});


module.exports = router;