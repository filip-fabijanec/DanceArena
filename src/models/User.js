const mongoose = require("mongoose");

// mongoDB svakom objektu dodeljuje jedinstveni _id, stoga nije potrebno posebno definirati ID polje

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["organizator", "sudac", "voditeljKluba", "admin"],
    required: true,
  },

  name: { type: String, required: true },

  surname: { type: String, required: true },

  provider: { type: String, required: true }, //google

  providerId: { type: String, required: true }, //google id

  email: { type: String, required: true, unique: true },

  clubName: { type: String, default: null },

  clubLocation: { type: String, default: null },

  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'expired'], default: 'inactive' },

  subscriptionExpiry: { type: Date, default: null },

  lastPaymentDate: { type: Date, default: null}
});

module.exports = mongoose.model("User", userSchema);
