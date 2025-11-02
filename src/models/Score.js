const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({ 
  performanceId: { // id izvedbe
    type: mongoose.Schema.Types.ObjectId,
    ref: "Performance",
    required: true,
  },

  judgeId: { // id suca
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  score: { type: Number, min: 0, max: 30, required: true }, // score between 0 and 30
});

module.exports = mongoose.model("Score", scoreSchema);
