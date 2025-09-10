// scripts/seedFoods.js
const mongoose = require("mongoose");
const Food = require("../models/Food");

const MONGO_URI =
  "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp";

const seed = [
  // 🔹 Proteins
  { name: "Chicken Breast (100g)", category: "protein", type: "non-veg", portion: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Egg (1 large)", category: "protein", type: "non-veg", portion: "1 egg", calories: 78, protein: 6.3, carbs: 0.6, fat: 5 },
  { name: "Paneer (100g)", category: "protein", type: "veg", portion: "100g", calories: 265, protein: 18, carbs: 6, fat: 20 },
  { name: "Tofu (100g)", category: "protein", type: "veg", portion: "100g", calories: 144, protein: 15, carbs: 4, fat: 8 },
  { name: "Fish (Rohu - 100g)", category: "protein", type: "non-veg", portion: "100g", calories: 97, protein: 20, carbs: 0, fat: 1.5 },
  { name: "Dal (1 cup cooked)", category: "protein", type: "veg", portion: "1 cup", calories: 198, protein: 12, carbs: 28, fat: 7 },

  // 🔹 Carbs
  { name: "Oats (40g)", category: "carb", type: "veg", portion: "40g", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Brown Rice (100g cooked)", category: "carb", type: "veg", portion: "100g", calories: 110, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: "White Rice (100g cooked)", category: "carb", type: "veg", portion: "100g", calories: 130, protein: 2.4, carbs: 28, fat: 0.3 },
  { name: "Whole Wheat Roti (1)", category: "carb", type: "veg", portion: "1 roti", calories: 80, protein: 3, carbs: 15, fat: 1 },
  { name: "Poha (1 cup)", category: "carb", type: "veg", portion: "1 cup", calories: 180, protein: 4, carbs: 35, fat: 5 },
  { name: "Upma (1 cup)", category: "carb", type: "veg", portion: "1 cup", calories: 200, protein: 5, carbs: 35, fat: 6 },
  { name: "Idli (2 pcs)", category: "carb", type: "veg", portion: "2 idli", calories: 154, protein: 6, carbs: 30, fat: 1 },

  // 🔹 Veggies & Salads
  { name: "Spinach (1 cup)", category: "veg", type: "veg", portion: "1 cup", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },
  { name: "Mixed Salad (100g)", category: "veg", type: "veg", portion: "100g", calories: 25, protein: 1.2, carbs: 4, fat: 0.3 },
  { name: "Broccoli (100g)", category: "veg", type: "veg", portion: "100g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Cauliflower (100g)", category: "veg", type: "veg", portion: "100g", calories: 25, protein: 2, carbs: 5, fat: 0.3 },
  { name: "Bhindi (Okra 100g)", category: "veg", type: "veg", portion: "100g", calories: 33, protein: 2, carbs: 7, fat: 0.2 },

  // 🔹 Fruits
  { name: "Apple (1 medium)", category: "fruit", type: "veg", portion: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Banana (1 medium)", category: "fruit", type: "veg", portion: "1 banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { name: "Papaya (1 cup)", category: "fruit", type: "veg", portion: "1 cup", calories: 59, protein: 0.6, carbs: 15, fat: 0.1 },
  { name: "Orange (1 medium)", category: "fruit", type: "veg", portion: "1 medium", calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { name: "Watermelon (1 cup)", category: "fruit", type: "veg", portion: "1 cup", calories: 46, protein: 0.9, carbs: 12, fat: 0.2 },

  // 🔹 Healthy Fats
  { name: "Almonds (10 pcs)", category: "fat", type: "veg", portion: "10 pcs", calories: 70, protein: 2.5, carbs: 2.5, fat: 6 },
  { name: "Walnuts (5 pcs)", category: "fat", type: "veg", portion: "5 pcs", calories: 130, protein: 3, carbs: 3, fat: 13 },
  { name: "Peanut Butter (1 tbsp)", category: "fat", type: "veg", portion: "1 tbsp", calories: 94, protein: 3.5, carbs: 3, fat: 8 },
  { name: "Ghee (1 tsp)", category: "fat", type: "veg", portion: "1 tsp", calories: 45, protein: 0, carbs: 0, fat: 5 },

  // 🔹 Dairy
  { name: "Milk (200ml)", category: "dairy", type: "veg", portion: "200ml", calories: 100, protein: 6.8, carbs: 12, fat: 2.5 },
  { name: "Curd (1 cup)", category: "dairy", type: "veg", portion: "1 cup", calories: 98, protein: 11, carbs: 3.6, fat: 4.3 },
  { name: "Buttermilk (1 glass)", category: "dairy", type: "veg", portion: "1 glass", calories: 40, protein: 3, carbs: 4, fat: 1 },

  // 🔹 Snacks
  { name: "Protein Bar (1)", category: "snack", type: "veg", portion: "1 bar", calories: 200, protein: 20, carbs: 20, fat: 6 },
  { name: "Sprouts Salad (1 cup)", category: "snack", type: "veg", portion: "1 cup", calories: 150, protein: 9, carbs: 28, fat: 2 },
  { name: "Dry Bhel (1 cup)", category: "snack", type: "veg", portion: "1 cup", calories: 180, protein: 5, carbs: 35, fat: 4 },
  { name: "Chana (Boiled 100g)", category: "snack", type: "veg", portion: "100g", calories: 164, protein: 9, carbs: 27, fat: 2.6 }
];

async function run() {
  await mongoose.connect(MONGO_URI, {});
  console.log("✅ Connected to Mongo");

  await Food.deleteMany({});
  await Food.insertMany(seed);
  console.log("🌱 Seeded foods:", seed.length);
  await mongoose.disconnect();
  console.log("✅ Done");
}

run().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
