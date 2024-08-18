const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
  websiteLink: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  headings: { type: [String], required: true },
  paragraphs: { type: [String], required: true },
  summary: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Summary", summarySchema);
