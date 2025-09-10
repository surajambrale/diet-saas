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
  slot: { type: String, enum: ["breakfast", "lunch", "snack", "dinner"], required: true },
  name: { type: String, required: true }, // e.g. "Oats with Milk"
  items: [
    {
      food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      portion: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number
    }
  ],
  calories: Number,
  protein_g: Number,
  carbs_g: Number,
  fats_g: Number
});

module.exports = mongoose.model("Meal", mealSchema);
