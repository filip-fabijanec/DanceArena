const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  competition: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Competition", 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid"], 
    default: "pending" 
  },
  stripeSessionId: { type: String }, // opcionalno, možeš čuvati Stripe session ID
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Registration", registrationSchema);