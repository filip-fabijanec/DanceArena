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

    // Roboto font paths
    let fontRegistered = false;
    
    try {
      // Pokušaj pronaći Roboto Regular .ttf
      const robotoPath = path.join(
        require.resolve('roboto-fontface/package.json').replace('package.json', ''),
        'fonts/roboto/Roboto-Regular.ttf'
      );
      
      console.log('📂 Roboto path:', robotoPath);
      
      if (fs.existsSync(robotoPath)) {
        doc.registerFont('Roboto', robotoPath);
        doc.font('Roboto');
        fontRegistered = true;
        console.log('✅ Font registriran: Roboto-Regular.ttf');
      } else {
        console.warn('⚠️ Roboto TTF ne postoji, pokušavam alternative...');
        
        // Fallback na Roboto Latin Extended
        const robotoLatinPath = path.join(
          require.resolve('roboto-fontface/package.json').replace('package.json', ''),
          'fonts/roboto/Roboto-Regular.woff'
        );
        
        if (fs.existsSync(robotoLatinPath)) {
          console.log('ℹ️ Roboto WOFF nije podržan za PDFKit, koristim Helvetica');
        }
      }
    } catch (err) {
      console.error('❌ Roboto font greška:', err.message);
    }

    // Fallback na Helvetica ako Roboto nije učitan
    if (!fontRegistered) {
      console.warn('⚠️ Roboto font nije dostupan, koristim Helvetica (ograničena podrška za đ, ć, č)');
      doc.font('Helvetica');
    }

    const currentFont = fontRegistered ? 'Roboto' : 'Helvetica';

    // Testiraj font sa svim znakovima
    const testStr = "Test: šđčćžŠĐČĆŽ";
    console.log('🧪 Test string:', testStr);

    // Naslov
    doc.fontSize(18).font(currentFont).text("STARTNA LISTA", { align: "center" });
    doc.moveDown();
    
    // Test hrvatski znakovi
    doc.fontSize(10).font(currentFont).text(testStr, { align: "center" });
    doc.moveDown();
    
    // Info o natjecanju
    doc.fontSize(12).font(currentFont)
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
        doc.fontSize(14).font(currentFont).fillColor('#333').text(category, { underline: true });
        doc.moveDown(0.5);
        currentCategory = category;
        counter = 1;
      }

      const line = `${counter}. ${p.danceStyle} – ${p.choreographyName} – ${p.clubId?.clubName || "N/A"} (${formatDuration(p.duration)})`;
      console.log(`📝 Line ${counter}:`, line); // Debug output
      
      doc.fontSize(11).font(currentFont).fillColor('#000')
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