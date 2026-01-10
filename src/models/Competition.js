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

  isLocked: {
  type: Boolean,
  default: false,
  },


  referees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

competitionSchema.virtual('autoStatus').get(function() {
  const today = new Date();
  const competitionDate = new Date(this.date);

  today.setHours(0, 0, 0, 0);
  competitionDate.setHours(0, 0, 0, 0);
  
  if (competitionDate > today) {
    return 'upcoming';
  } else if (competitionDate.getTime() === today.getTime()) {
    return 'ongoing';
  } else {
    return 'completed';
  }
});

competitionSchema.set('toJSON', { virtuals: true });
competitionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Competition", competitionSchema);
