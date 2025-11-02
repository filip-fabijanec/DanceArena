const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  clubName: { type: String, ref: "User", required: true },

  choreographyName: { type: String, required: true },

  performanceDuration: { type: Number, required: true }, // duration in seconds

  choreographer: { type: String },

  musicFilePath: { type: String, required: true },

  ageCategory: [{ type: String, required: true }],

  danceStyle: [{ type: String, required: true }],

  groupSize: [{ type: String, required: true }],
});

module.exports = mongoose.model("Performance", performanceSchema);
