const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: {
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

// Virtual property za autoStatus
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

// Statička metoda za automatsko zaključavanje ongoing natjecanja
competitionSchema.statics.autoLockOngoingCompetitions = async function() {
  try {
    // Pronađi sva ongoing natjecanja koja nisu zaključana
    const result = await this.updateMany(
      { 
        // Koristimo virtual property logiku u upitu
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(24, 0, 0, 0))
        },
        isLocked: false 
      },
      { $set: { isLocked: true } }
    );
    
    console.log(`🔧 autoLockOngoingCompetitions - Zaključano ${result.modifiedCount} natjecanja`);
    return result;
  } catch (error) {
    console.error('❌ Greška pri automatskom zaključavanju:', error);
    throw error;
  }
};

// Pre-save middleware za automatsko zaključavanje kada se natjecanje postavi na ongoing
competitionSchema.pre('save', async function(next) {
  // Ažuriraj status polje na temelju autoStatus virtual property
  this.status = this.autoStatus;
  
  // Ako je natjecanje ongoing, automatski zaključaj
  if (this.autoStatus === 'ongoing' && !this.isLocked) {
    console.log(`🔐 Automatsko zaključavanje natjecanja: ${this.name} (${this._id})`);
    this.isLocked = true;
  }
  
  next();
});

// Pre-find middleware za automatsko zaključavanje prije svakog find upita
competitionSchema.pre('find', async function(next) {
  // Pozovi automatsko zaključavanje prije svakog find upita
  await this.model.autoLockOngoingCompetitions();
  next();
});

competitionSchema.pre('findOne', async function(next) {
  await this.model.autoLockOngoingCompetitions();
  next();
});

competitionSchema.pre('findById', async function(next) {
  await this.model.autoLockOngoingCompetitions();
  next();
});

competitionSchema.set('toJSON', { virtuals: true });
competitionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Competition", competitionSchema);