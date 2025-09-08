// scripts/seedFoods.js
const mongoose = require('mongoose');
const Food = require('../models/Food');

const MONGO_URI = "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp"; 
// <-- replace with your URI if needed

const seed = [
  { name: "Chicken Breast (100g)", category: "protein", portion:"100g", calories:165, protein:31, carbs:0, fat:3.6 },
  { name: "Egg (1 large)", category:"protein", portion:"1 egg", calories:78, protein:6.3, carbs:0.6, fat:5 },
  { name: "Paneer (100g)", category:"protein", portion:"100g", calories:265, protein:18, carbs:6, fat:20 },

  { name: "Oats (40g)", category:"carb", portion:"40g", calories:150, protein:5, carbs:27, fat:3 },
  { name: "Brown Rice (100g)", category:"carb", portion:"100g", calories:110, protein:2.6, carbs:23, fat:0.9 },
  { name: "Whole Wheat Roti (1)", category:"carb", portion:"1 roti", calories:80, protein:3, carbs:15, fat:1 },

  { name: "Spinach (1 cup)", category:"veg", portion:"1 cup", calories:7, protein:0.9, carbs:1.1, fat:0.1 },
  { name: "Mixed Salad (100g)", category:"veg", portion:"100g", calories:25, protein:1.2, carbs:4, fat:0.3 },
  { name: "Apple (1 medium)", category:"fruit", portion:"1 medium", calories:95, protein:0.5, carbs:25, fat:0.3 },

  { name: "Almonds (10 pcs)", category:"fat", portion:"10 pcs", calories:70, protein:2.5, carbs:2.5, fat:6 },
  { name: "Peanut Butter (1 tbsp)", category:"fat", portion:"1 tbsp", calories:94, protein:3.5, carbs:3, fat:8 },
  { name: "Milk (200ml)", category:"dairy", portion:"200ml", calories:100, protein:6.8, carbs:12, fat:2.5 },

  { name: "Protein Bar (1)", category:"snack", portion:"1 bar", calories:200, protein:20, carbs:20, fat:6 }
];

async function run() {
  await mongoose.connect(MONGO_URI, {});
  console.log("Connected to Mongo");

  await Food.deleteMany({});
  await Food.insertMany(seed);
  console.log("Seeded foods:", seed.length);
  await mongoose.disconnect();
  console.log("Done");
}

run().catch(err => { console.error(err); mongoose.disconnect(); });
