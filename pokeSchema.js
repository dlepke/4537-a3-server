const mongoose = require("mongoose");

const pokeSchema = new mongoose.Schema(
  {
    _id: { type: String },
    base: {
      HP: { type: Number, min: 0 },
      Attack: { type: Number, min: 0 },
      Defense: { type: Number, min: 0 },
      Speed: { type: Number, min: 0 },
      "Sp. Attack": { type: Number, min: 0 },
      "Sp. Defense": { type: Number, min: 0 },
    },
    id: {
      type: Number,
      min: 1,
      max: 1000,
      unique: true,
      index: true,
    },
    name: {
      english: { type: String, maxLength: 20 },
      japanese: { type: String },
      chinese: { type: String },
      french: { type: String },
    },
    type: [
      {
        type: String,
      },
    ],
    __v: { type: Number },
  },
  { collection: "pokemons" }
);

module.exports = pokeSchema;
