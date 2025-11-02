const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // id voditelja kluba

  choreographyName: { type: String, required: true },

  performanceDuration: { type: Number, required: true }, // trajanje u sekundama

  choreographer: { type: String },

  musicFilePath: { type: String, required: true },

  ageCategory: [{ type: String, required: true }],

  danceStyle: [{ type: String, required: true }],

  groupSize: [{ type: String, required: true }],
});

module.exports = mongoose.model("Performance", performanceSchema);
