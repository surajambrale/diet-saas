const mongoose = require("mongoose");

const DietSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  goal: String,
  calories: Number,
  macros: {
    protein_g: Number,
    carbs_g: Number,
    fats_g: Number
  },
  meals: [
    {
      slot: String,
      items: [
        {
          name: String,
          portion: String,
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number
        }
      ],
      kcal: Number
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Diet", DietSchema);
