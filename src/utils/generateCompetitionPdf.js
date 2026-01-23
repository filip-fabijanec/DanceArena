const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const Performance = require("../models/Performance");
const path = require("path");
const fs = require("fs").promises;

module.exports = async function generatePdfForCompetition(competition, res) {
  try {
    const performances = await Performance.find({
      competitionId: competition._id,
      approved: true
    })
      .populate("clubId", "clubName")
      .sort({ ageCategory: 1, danceStyle: 1, groupSize: 1 });

    // Kreiraj novi PDF dokument
    const pdfDoc = await PDFDocument.create();
    
    // KLJUČNO: Registriraj fontkit PRIJE učitavanja fonta
    pdfDoc.registerFontkit(fontkit);

    // Učitaj Roboto font
    const fontPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
    console.log('📂 Font path:', fontPath);

    let customFont;
    try {
      const fontBytes = await fs.readFile(fontPath);
      // embedFont s fontkit-om pravilno obrađuje Unicode
      customFont = await pdfDoc.embedFont(fontBytes, { subset: false });
      console.log('✅ Font uspješno učitan: Roboto');
    } catch (err) {
      console.error('❌ Greška pri učitavanju fonta:', err);
      throw new Error('Font nije pronađen. Preuzmi Roboto-Regular.ttf u fonts/ folder');
    }

    // Testiranje encoding-a
    const testStr = "Test: šđčćžŠĐČĆŽ";
    console.log('🧪 Test string:', testStr);
    console.log('🧪 Font encoding test:', customFont.encodeText(testStr));

    // Dodaj prvu stranicu
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 format
    const { width, height } = page.getSize();
    
    let yPosition = height - 60;
    const leftMargin = 50;
    const lineHeight = 20;

    // Helper funkcija za dodavanje teksta
    const drawText = (text, options = {}) => {
      const {
        size = 12,
        x = leftMargin,
        y = yPosition,
        color = rgb(0, 0, 0),
        align = 'left'
      } = options;

      let xPos = x;
      if (align === 'center') {
        const textWidth = customFont.widthOfTextAtSize(text, size);
        xPos = (width - textWidth) / 2;
      }

      page.drawText(text, {
        x: xPos,
        y: y,
        size: size,
        font: customFont,
        color: color,
        lineHeight: size * 1.2
      });
    };

    // Helper za provjeru i dodavanje nove stranice
    const checkNewPage = () => {
      if (yPosition < 80) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 60;
        return true;
      }
      return false;
    };

    // NASLOV
    drawText("STARTNA LISTA", { 
      size: 20, 
      y: yPosition,
      align: 'center'
    });
    yPosition -= lineHeight * 2;

    // Test hrvatski znakovi
    drawText(testStr, { 
      size: 10, 
      y: yPosition,
      align: 'center',
      color: rgb(0.5, 0.5, 0.5)
    });
    yPosition -= lineHeight * 2;

    // Info o natjecanju
    drawText(`Natjecanje: ${competition.name}`, { 
      size: 12, 
      y: yPosition
    });
    yPosition -= lineHeight;

    drawText(`Datum: ${new Date(competition.date).toLocaleDateString('hr-HR')}`, { 
      size: 12, 
      y: yPosition
    });
    yPosition -= lineHeight;

    drawText(`Lokacija: ${competition.location}`, { 
      size: 12, 
      y: yPosition
    });
    yPosition -= lineHeight * 2;

    // Grupiraj po kategorijama
    let currentCategory = null;
    let counter = 1;

    for (const p of performances) {
      checkNewPage();

      const category = `${p.ageCategory} | ${p.groupSize}`;
      
      if (category !== currentCategory) {
        yPosition -= lineHeight * 0.5;
        checkNewPage();

        // Kategorija naslov
        drawText(category, { 
          size: 14, 
          y: yPosition,
          color: rgb(0.2, 0.2, 0.2)
        });

        // Linija ispod naslova
        page.drawLine({
          start: { x: leftMargin, y: yPosition - 5 },
          end: { x: width - leftMargin, y: yPosition - 5 },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7)
        });

        yPosition -= lineHeight * 1.5;
        currentCategory = category;
        counter = 1;
      }

      checkNewPage();

      const line = `${counter}. ${p.danceStyle} – ${p.choreographyName} – ${p.clubId?.clubName || "N/A"} (${formatDuration(p.duration)})`;
      console.log(`📝 Line ${counter}:`, line);
      
      drawText(line, { 
        size: 11, 
        y: yPosition,
        x: leftMargin + 10
      });
      
      yPosition -= lineHeight;
      counter++;
    }

    // Serijaliziraj PDF
    const pdfBytes = await pdfDoc.save();

    // Postavi headers i pošalji
    res.setHeader("Content-Type", "application/pdf; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="startna_lista_${competition._id}.pdf"`
    );
    res.send(Buffer.from(pdfBytes));

    console.log('✅ PDF generiran uspješno s pdf-lib');
    
  } catch (error) {
    console.error('❌ Greška pri generiranju PDF-a:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Greška pri generiranju PDF-a: ' + error.message });
    }
  }
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}