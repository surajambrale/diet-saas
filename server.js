// ===== Diet SaaS Backend =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const bcrypt = require("bcryptjs");

// ===== Models =====
const User = require("./models/User");
const Subscription = require("./models/subscription");
const Food = require("./models/Food");
const Diet = require("./models/Diet");

// ===== App Init =====
const app = express();
app.use(express.json());
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

// ===== Razorpay Config =====
const razorpay = new Razorpay({
  key_id: "rzp_test_RDOq87kgys57h2", // 🔹 Replace with LIVE key in production
  key_secret: "m36sZB7IqA2HeD2B51YybL7P",
});

/* ---------------- AUTH ---------------- */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await new User({ name, email, password: hashed }).save();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Error registering user" });
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

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: "Invalid password" });

    // ✅ Latest subscription check
    const sub = await Subscription.findOne({ email }).sort({ createdAt: -1 });
    let active = false;
    let expiry = null;
    if (sub && sub.expiryDate && new Date() <= sub.expiryDate) {
      active = true;
      expiry = sub.expiryDate;
    }

    res.json({
      success: true,
      message: "Login successful",
      email: user.email,
      name: user.name,
      planActive: active,
      plan: sub?.plan || null,
      expiry,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
});

/* ---------------- PAYMENT ---------------- */
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount)
      return res
        .status(400)
        .json({ success: false, message: "Amount required" });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });
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
    expiryDate.setDate(startDate.getDate() + 30); // Default 30 days

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

// ✅ GET & POST both for check-subscription
app.all("/check-subscription", async (req, res) => {
  try {
    const email = req.body.email || req.query.email;
    if (!email)
      return res.status(400).json({ active: false, message: "Email required" });

    const sub = await Subscription.findOne({ email }).sort({ createdAt: -1 });
    if (!sub) return res.json({ active: false, message: "No subscription" });

    if (new Date() <= sub.expiryDate)
      return res.json({ active: true, expiry: sub.expiryDate, plan: sub.plan });

    res.json({ active: false, message: "Subscription expired" });
  } catch (err) {
    console.error("Check Subscription Error:", err);
    res.status(500).json({ active: false, error: err.message });
  }
});

/* ---------------- FOOD ---------------- */
app.post("/admin/food", async (req, res) => {
  try {
    const { name, category, portion, calories, protein, carbs, fat, type } =
      req.body;
    if (!name || !category || calories == null)
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
      type,
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

    // ✅ Remove duplicate "rice"
    const seen = new Set();
    const unique = [];
    for (let f of foods) {
      if (f.name.toLowerCase().includes("rice")) {
        if (seen.has("rice")) continue;
        seen.add("rice");
      }
      unique.push(f);
    }

    res.json({ success: true, foods: unique });
  } catch (err) {
    console.error("Get Foods Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------- DIET GENERATOR ---------------- */
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
      dietType = "nonveg",
    } = req.body;

    if (!plan || !age || !weightKg || !heightCm) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // --- BMR + TDEE ---
    const bmr =
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
    const tdee = Math.round(bmr * (activityMap[activityLevel] || 1.55));

    // --- Calories & Macros ---
    let targetCalories = tdee;
    if (/fat|loss/i.test(plan)) targetCalories -= 500;
    else if (/muscle|gain/i.test(plan)) targetCalories += 350;
    if (targetCalories < 1200) targetCalories = 1200;

    const protein_g = Math.round(
      weightKg *
        (/muscle|gain/i.test(plan)
          ? 2.2
          : /fat|loss/i.test(plan)
          ? 2.0
          : 1.6)
    );
    const caloriesFromProtein = protein_g * 4;
    const fatsCalories = Math.round(targetCalories * 0.15);
    const fats_g = Math.round(fatsCalories / 9);
    const carbsCalories = Math.max(
      0,
      targetCalories - (caloriesFromProtein + fatsCalories)
    );
    const carbs_g = Math.round(carbsCalories / 4);

    const macrosTarget = { protein_g, carbs_g, fats_g };

    res.json({
      success: true,
      plan: { goal: plan, targetCalories, macrosTarget },
    });
  } catch (err) {
    console.error("Generate Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------- SAVE / GET DIET ---------------- */
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
        meals: plan.meals || [],
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

/* ---------------- DB + START ---------------- */
const MONGO =
  "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp";

mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
