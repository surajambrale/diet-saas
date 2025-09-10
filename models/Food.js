const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: String,
  category: String,   // protein, carb, veg, fruit, fat, snack, dairy
  portion: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  type: {             // ✅ new field
    type: String,
    enum: ["veg", "non-veg", "both"], 
    default: "both"
  }
});

module.exports = mongoose.model("Food", foodSchema);
