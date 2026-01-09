const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: "Competition", required: true },

  choreographyName: { type: String, required: true },

  performanceDuration: { type: Number, required: true },

  choreographer: { type: String },

  musicFilePath: { type: String, required: true },

  ageCategory: { type: String, required: true },

  danceStyle: { type: String, required: true },

  groupSize: { type: String, required: true },

  // PLAĆANJE
  paid: { type: Boolean, default: false },

  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid"], 
    default: "pending" 
  },

  // ODOBRENJE ORGANIZATORA 
  approved: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Performance", performanceSchema);