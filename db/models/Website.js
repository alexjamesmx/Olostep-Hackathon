const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  websiteLink: { type: String, required: true },
  website: { type: mongoose.Schema.Types.Mixed, required: true }, // Allows storing any type of data
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Summary", summarySchema);
