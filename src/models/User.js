const mongoose = require("mongoose");

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

  clubName: { type: String },

  clubLocation: { type: String },

  approved: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
