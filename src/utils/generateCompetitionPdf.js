const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");
const path = require("path");

module.exports = async function generatePdfForCompetition(competition, res) {
  try {
    const performances = await Performance.find({
      competitionId: competition._id,
      approved: true
    })
      .populate("clubId", "clubName")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    const doc = new PDFDocument({ 
      margin: 40,
      bufferPages: true,
      autoFirstPage: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );

    doc.pipe(res);

    // Font iz node_modules (KLJUČNA PROMJENA)
    const fontPath = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
    
    console.log('📂 Font path:', fontPath);

    // Registriraj font
    doc.registerFont('DejaVu', fontPath);
    console.log('✅ Font registriran: DejaVu');

    // Naslov
    doc.fontSize(18).font('DejaVu').text("STARTNA LISTA", { align: "center" });
    doc.moveDown();
    
    // Info o natjecanju
    doc.fontSize(12).font('DejaVu')
       .text(`Natjecanje: ${competition.name}`)
       .text(`Datum: ${new Date(competition.date).toLocaleDateString('hr-HR')}`)
       .text(`Lokacija: ${competition.location}`);
    doc.moveDown();

    // Grupiraj po kategorijama
    let currentCategory = null;
    let counter = 1;

    performances.forEach((p) => {
      const category = `${p.ageCategory} | ${p.groupSize}`;
      
      if (category !== currentCategory) {
        doc.moveDown();
        doc.fontSize(14).font('DejaVu').fillColor('#333').text(category, { underline: true });
        doc.moveDown(0.5);
        currentCategory = category;
        counter = 1;
      }

      doc.fontSize(11).font('DejaVu').fillColor('#000')
         .text(
           `${counter}. ${p.danceStyle} – ${p.choreographyName} – ${p.clubId?.clubName || "N/A"} (${formatDuration(p.duration)})`,
           { indent: 10 }
         );
      
      counter++;
    });

    doc.end();
    console.log('✅ PDF generiran uspješno');
    
  } catch (error) {
    console.error('❌ Greška pri generiranju PDF-a:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Greška pri generiranju PDF-a' });
    }
  }
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}