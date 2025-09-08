const mongoose = require("mongoose");
const AssessmentSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: String,
  plan: String,
  age: Number,
  gender: { type: String, enum: ["male","female","other"], default: "male" },
  weightKg: Number,
  heightCm: Number,
  activityLevel: String,
  bmr: Number,
  tdee: Number,
  targetCalories: Number,
  macros: {
    protein_g: Number,
    carbs_g: Number,
    fats_g: Number
  },
  meals: [String],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Assessment", AssessmentSchema);
