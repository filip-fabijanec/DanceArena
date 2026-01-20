const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");

module.exports = async function generatePdfForCompetition(competition, res) {
  const performances = await Performance.find({
    competitionId: competition._id,
    approved: true
  })
    .populate("clubId", "clubName")
    .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="startna_lista_${competition._id}.pdf"`
  );

  doc.pipe(res);

  doc.fontSize(18).text("STARTNA LISTA", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Natjecanje: ${competition.name}`);
  doc.text(`Lokacija: ${competition.location}`);
  doc.moveDown();

  performances.forEach((p, i) => {
    doc.text(`${i + 1}. ${p.choreographyName} – ${p.clubId?.clubName || "N/A"}`);
  });

  doc.end();
};
