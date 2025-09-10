const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: String,
  category: String, // e.g. "veg", "nonveg", "dairy"
  portion: String,  // "100g", "1 cup"
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number
});

module.exports = mongoose.model("Food", foodSchema);
