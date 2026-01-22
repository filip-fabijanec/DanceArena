const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");
const path = require("path");

module.exports = async function generatePdfForCompetition(competition, res) {
  const performances = await Performance.find({
    competitionId: competition._id,
    approved: true
  })
    .populate("clubId", "clubName")
    .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

  const doc = new PDFDocument({ 
    margin: 40,
    bufferPages: true
  });

  res.setHeader("Content-Type", "application/pdf; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="startna_lista_${competition._id}.pdf"`
  );

  doc.pipe(res);

  // Registriraj font koji podržava Unicode (preuzmi Roboto ili DejaVu)
  // Stavi font u /fonts direktorij u projektu
  doc.registerFont('Regular', path.join(__dirname, '../fonts/Roboto-Regular.ttf'));
  doc.font('Regular');

  // Naslov
  doc.fontSize(18).text("STARTNA LISTA", { align: "center" });
  doc.moveDown();
  
  // Info o natjecanju
  doc.fontSize(12)
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
      doc.fontSize(14).fillColor('#333').text(category, { underline: true });
      doc.moveDown(0.5);
      currentCategory = category;
      counter = 1;
    }

    doc.fontSize(11)
       .fillColor('#000')
       .text(
         `${counter}. ${p.danceStyle} – ${p.choreographyName} – ${p.clubId?.clubName || "N/A"} (${formatDuration(p.duration)})`,
         { indent: 10 }
       );
    
    counter++;
  });

  doc.end();
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}