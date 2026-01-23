const PDFDocument = require("pdfkit");
const Performance = require("../models/Performance");
const path = require("path");
const fs = require("fs");

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

    res.setHeader("Content-Type", "application/pdf; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );

    doc.pipe(res);

    // Putanja do Roboto fonta
    const fontPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
    
    console.log('📂 Font path:', fontPath);
    console.log('📂 __dirname:', __dirname);
    console.log('✅ Font postoji:', fs.existsSync(fontPath));

    if (!fs.existsSync(fontPath)) {
      console.error('❌ Roboto font nije pronađen!');
      console.error('💡 Moraš downloadati Roboto-Regular.ttf u fonts/ folder');
      throw new Error('Font file not found');
    }

    // Registriraj font
    doc.registerFont('Roboto', fontPath);
    console.log('✅ Font uspješno registriran: Roboto');

    // Testiraj font
    const testStr = "Test: šđčćžŠĐČĆŽ";
    console.log('🧪 Test string:', testStr);

    // Naslov
    doc.fontSize(18).font('Roboto').text("STARTNA LISTA", { align: "center" });
    doc.moveDown();
    
    // Test hrvatski znakovi
    doc.fontSize(10).font('Roboto').text(testStr, { align: "center" });
    doc.moveDown();
    
    // Info o natjecanju
    doc.fontSize(12).font('Roboto')
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
        doc.fontSize(14).font('Roboto').fillColor('#333').text(category, { underline: true });
        doc.moveDown(0.5);
        currentCategory = category;
        counter = 1;
      }

      const line = `${counter}. ${p.danceStyle} – ${p.choreographyName} – ${p.clubId?.clubName || "N/A"} (${formatDuration(p.duration)})`;
      console.log(`📝 Line ${counter}:`, line);
      
      doc.fontSize(11).font('Roboto').fillColor('#000')
         .text(line, { indent: 10 });
      
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