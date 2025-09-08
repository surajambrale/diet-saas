const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g. protein, carb, veg, fruit, fat, dairy, snack, grain
  portion: { type: String, default: "100g" },
  calories: { type: Number, required: true }, // kcal per portion
  protein: { type: Number, default: 0 }, // grams per portion
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Food", FoodSchema);
