const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log("🔐 Auth Header primljen"); // Debug

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Auth Header nedostaje ili nije Bearer");
      return res.status(401).json({ error: "Nema tokena" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    );
    
    console.log("📦 Decoded token:", { id: decoded.id, role: decoded.role }); // Debug

    // ⚠️ KRITIČNO: Token koristi 'id', ne 'userId'!
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log("❌ Korisnik ne postoji za ID:", decoded.id);
      return res.status(401).json({ error: "Korisnik ne postoji" });
    }

    console.log("✅ User autentificiran:", user.email, user.role);

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth middleware greška:", err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token je istekao. Molimo prijavite se ponovno." });
    }
    
    return res.status(401).json({ error: "Nevažeći token" });
  }
};