// const mongoose = require("mongoose");

// const mealSchema = new mongoose.Schema({
//   category: { type: String, required: true }, // breakfast, lunch, snack, dinner
//   goal: { type: String, required: true },     // fatloss, muscle, fitness
//   vegetarian: { type: Boolean, default: false }, // true = veg, false = non-veg
//   name: { type: String, required: true },     // e.g. Oats with Milk
//   calories: Number,
//   protein: Number,
//   carbs: Number,
//   fats: Number
// });

// module.exports = mongoose.model("Meal", mealSchema);

// models/Meal.js
const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  slot: { type: String, required: true },       // breakfast, lunch, snack, dinner
  dietType: { type: String, required: true },   // veg / nonveg
  name: { type: String, required: true },
  portion: { type: String, default: "" },
  calories: { type: Number, default: 0 },
  protein_g: { type: Number, default: 0 },
  carbs_g: { type: Number, default: 0 },
  fats_g: { type: Number, default: 0 },
  goal: { type: String, default: "general" }    // optional: fatloss, muscle, general
}, { timestamps: true });

module.exports = mongoose.model("Meal", mealSchema);
