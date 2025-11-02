const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },

  date: { type: Date, required: true },

  location: { type: String, required: true },

  organizer: { // id organizatora
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  description: { type: String },

  ageCategories: [{ type: String, required: true }],

  danceStyles: [{ type: String, required: true }],

  groupSizes: [{ type: String, required: true }],

  registrationFee: { type: Number, required: true },

  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed"],
    default: "upcoming",
  },

  referees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Competition", competitionSchema);
