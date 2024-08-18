const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
  websiteLink: { type: String, required: true },
  website: Object,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Summary", summarySchema);
