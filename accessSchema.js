const mongoose = require("mongoose");

const accessSchema = new mongoose.Schema(
  {
    username: { type: String },
    endpoint: { type: String },
    timestamp: { type: Number },
  },
  { collection: "accesses" }
);

module.exports = accessSchema;
