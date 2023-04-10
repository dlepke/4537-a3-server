const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String },
    username: { type: String },
    password: { type: String },
    isAdmin: { type: Boolean },
  },
  { collection: "users" }
);

module.exports = userSchema;
