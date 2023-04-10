const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema(
  {
    errCode: { type: Number },
    endpoint: { type: String },
  },
  { collection: "errors" }
);

module.exports = errorSchema;
