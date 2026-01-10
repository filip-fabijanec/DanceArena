const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["sudac"],
      default: "sudac",
    },

    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },

    used: {
      type:  Boolean,
      default: false,
    },

    invitedBy: {
      type: mongoose. Schema.Types.ObjectId,
      ref: "User", // organizator
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedBy: {
      type: mongoose. Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default:  null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);