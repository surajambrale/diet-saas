// scripts/seedMeals.js
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Meal = require("../models/Meal");

// --- IMPORTANT: paste your Mongo URI here (same as in server.js) ---
const MONGO_URI = "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp";
// replace above if needed

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log("Connected to MongoDB");

    const filePath = path.join(__dirname, "../data/meals.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const items = JSON.parse(raw);

    await Meal.deleteMany({});
    console.log("Cleared Meal collection");

    await Meal.insertMany(items);
    console.log("Inserted", items.length, "meals");

    await mongoose.disconnect();
    console.log("Done. Disconnected.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

run();
