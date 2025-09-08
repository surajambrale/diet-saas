// const express = require("express");
// const Meal = require("../models/Meal");
// const router = express.Router();

// // 🔹 Add new meal (for now use POSTMAN or Compass)
// router.post("/add-meal", async (req, res) => {
//   try {
//     const meal = new Meal(req.body);
//     await meal.save();
//     res.json({ success: true, meal });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // 🔹 Get meals by goal + vegetarian
// router.post("/get-meals", async (req, res) => {
//   try {
//     const { goal, vegetarian } = req.body;
//     const meals = await Meal.find({ goal, vegetarian });
//     res.json(meals);
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;

// routes/meals.js
const express = require("express");
const router = express.Router();
const Meal = require("../models/Meal");

// Add single meal (admin)
router.post("/add-meal", async (req, res) => {
  try {
    const meal = new Meal(req.body);
    await meal.save();
    res.json({ success: true, meal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get meals by filter (dietType & slot & goal optional)
router.post("/get-meals", async (req, res) => {
  try {
    const { dietType, slot, goal } = req.body;
    const q = {};
    if (dietType) q.dietType = dietType;
    if (slot) q.slot = slot;
    if (goal) q.goal = goal;
    const meals = await Meal.find(q).lean();
    res.json({ success: true, meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all meals
router.get("/all-meals", async (req, res) => {
  try {
    const meals = await Meal.find().lean();
    res.json({ success: true, meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

