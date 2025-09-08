// server.js (clean + updated)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/User");
const Subscription = require("./models/subscription");
const Food = require("./models/Food");
const Diet = require("./models/Diet");
const Meal = require("./models/Meal"); // ✅ agar tumne Meal model banaya hai

// Express app
const app = express();
app.use(bodyParser.json());

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "https://diet-saas-eta.vercel.app",
      "https://diet-saas.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
const mealsRoutes = require("./routes/meals");
app.use("/api/meals", mealsRoutes);

// Razorpay setup
const razorpay = new Razorpay({
  key_id: "rzp_test_RDOq87kgys57h2", // replace with live key when ready
  key_secret: "m36sZB7IqA2HeD2B51YybL7P",
});

//
// ---------------- AUTH ----------------
//
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    let existing = await User.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
});

//
// ---------------- PAYMENT ----------------
//
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount)
      return res
        .status(400)
        .json({ success: false, message: "amount required" });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { name, email, plan, paymentId } = req.body;
    if (!name || !email || !plan || !paymentId)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30);

    const newSub = new Subscription({
      name,
      email,
      plan,
      paymentId,
      startDate,
      expiryDate,
    });
    await newSub.save();

    res.json({
      success: true,
      message: "Subscription Activated!",
      subscription: newSub,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/check-subscription", async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan)
      return res
        .status(400)
        .json({ active: false, message: "Email & plan required" });

    const sub = await Subscription.findOne({ email, plan }).sort({
      createdAt: -1,
    });
    if (!sub) return res.json({ active: false, message: "No subscription found" });

    const today = new Date();
    if (today <= sub.expiryDate)
      return res.json({ active: true, expiry: sub.expiryDate });
    return res.json({ active: false, message: "Subscription expired" });
  } catch (err) {
    console.error("Check Subscription Error:", err);
    res.status(500).json({ active: false, error: err.message });
  }
});

//
// ---------------- FOOD API ----------------
//
app.post("/admin/food", async (req, res) => {
  try {
    const { name, category, portion, calories, protein, carbs, fat } = req.body;
    if (!name || !category || !calories)
      return res
        .status(400)
        .json({ success: false, message: "name/category/calories required" });
    const food = new Food({
      name,
      category,
      portion,
      calories,
      protein,
      carbs,
      fat,
    });
    await food.save();
    res.json({ success: true, food });
  } catch (err) {
    console.error("Admin Add Food Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find().lean();
    res.json({ success: true, foods });
  } catch (err) {
    console.error("Get Foods Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ---------------- DIET GENERATOR ----------------
//
app.post("/generate-diet", async (req, res) => {
  try {
    const {
      email,
      plan,
      age,
      gender,
      weightKg,
      heightCm,
      activityLevel = "moderate",
      save = false,
    } = req.body;
    if (!plan || !age || !weightKg || !heightCm || !activityLevel) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // 1) BMR + TDEE
    let bmr =
      gender === "female"
        ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
        : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    const activityMap = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const factor = activityMap[activityLevel] || 1.55;
    const tdee = Math.round(bmr * factor);

    // 2) Calories by goal
    let targetCalories = tdee;
    if (/fat|loss/i.test(plan)) targetCalories = tdee - 500;
    else if (/muscle|gain/i.test(plan)) targetCalories = tdee + 350;
    if (targetCalories < 1200) targetCalories = 1200;

    // 3) Macros
    const proteinPerKg =
      /muscle|gain/i.test(plan) ? 2.2 : /fat|loss/i.test(plan) ? 2.0 : 1.6;
    const protein_g = Math.round(weightKg * proteinPerKg);
    const caloriesFromProtein = protein_g * 4;
    const fatsCalories = Math.round(targetCalories * 0.25);
    const fats_g = Math.round(fatsCalories / 9);
    const carbsCalories = Math.max(
      0,
      targetCalories - (caloriesFromProtein + fatsCalories)
    );
    const carbs_g = Math.round(carbsCalories / 4);

    // 4) Fetch meals dynamically
    const slots = ["breakfast", "lunch", "snack", "dinner"];
    const meals = [];

    for (const slot of slots) {
      let candidates = await Meal.find({ slot }).lean();
      if (!candidates.length) continue;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      meals.push({
        slot,
        items: [pick],
        kcal: pick.calories,
        protein: pick.protein_g,
        carbs: pick.carbs_g,
        fats: pick.fats_g,
      });
    }

    // 5) Totals
    const total = meals.reduce(
      (acc, m) => {
        acc.calories += m.kcal || 0;
        acc.protein += m.protein || 0;
        acc.carbs += m.carbs || 0;
        acc.fats += m.fats || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const planResult = {
      goal: plan,
      targetCalories,
      macrosTarget: { protein_g, carbs_g, fats_g },
      generated: { meals, total },
    };

    if (save && email) {
      const doc = await Diet.findOneAndUpdate(
        { email },
        {
          email,
          goal: plan,
          calories: targetCalories,
          macros: { protein_g, carbs_g, fats_g },
          meals: meals.map((m) => ({
            slot: m.slot,
            items: m.items,
            kcal: m.kcal,
          })),
        },
        { upsert: true, new: true }
      );
      planResult.saved = true;
      planResult.savedDoc = doc;
    }

    res.json({ success: true, plan: planResult });
  } catch (err) {
    console.error("Generate Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ---------------- SAVE / GET DIET ----------------
//
app.post("/save-diet", async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan)
      return res
        .status(400)
        .json({ success: false, message: "email & plan required" });

    const doc = await Diet.findOneAndUpdate(
      { email },
      {
        email,
        goal: plan.goal,
        calories: plan.calories || plan.targetCalories || 0,
        macros: plan.macros || plan.macrosTarget || {},
        meals: plan.meals || plan.generated?.meals || [],
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, doc });
  } catch (err) {
    console.error("Save Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/get-diet", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "email required" });
    const doc = await Diet.findOne({ email }).lean();
    res.json({ success: true, plan: doc || null });
  } catch (err) {
    console.error("Get Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ---------------- MongoDB + Start ----------------
//
const MONGO =
  "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp";

mongoose
  .connect(MONGO, {})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
