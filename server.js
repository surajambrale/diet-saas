// server.js (final cleaned & updated)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/User");
const Subscription = require("./models/subscription");
const Food = require("./models/Food");
const Diet = require("./models/Diet");

// Express app
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

// Razorpay config
const razorpay = new Razorpay({
  key_id: "rzp_test_RDOq87kgys57h2",
  key_secret: "m36sZB7IqA2HeD2B51YybL7P",
});

/* ---------------- AUTH ---------------- */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
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
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: "Invalid password" });

    res.json({ success: true, message: "Login successful", email: user.email, name: user.name });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
});

/* ---------------- PAYMENT ---------------- */
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: "amount required" });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
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
      return res.status(400).json({ success: false, message: "Missing fields" });

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30);

    const newSub = new Subscription({ name, email, plan, paymentId, startDate, expiryDate });
    await newSub.save();

    res.json({ success: true, message: "Subscription Activated!", subscription: newSub });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/check-subscription", async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) return res.status(400).json({ active: false, message: "Email & plan required" });

    const sub = await Subscription.findOne({ email, plan }).sort({ createdAt: -1 });
    if (!sub) return res.json({ active: false, message: "No subscription found" });

    const today = new Date();
    if (today <= sub.expiryDate) return res.json({ active: true, expiry: sub.expiryDate });
    return res.json({ active: false, message: "Subscription expired" });
  } catch (err) {
    console.error("Check Subscription Error:", err);
    res.status(500).json({ active: false, error: err.message });
  }
});

/* ---------------- FOOD ---------------- */
app.post("/admin/food", async (req, res) => {
  try {
    const { name, category, portion, calories, protein, carbs, fat, type } = req.body;
    if (!name || !category || calories == null)
      return res.status(400).json({ success: false, message: "name/category/calories required" });

    const food = new Food({ name, category, portion, calories, protein, carbs, fat, type });
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
      save = false,
    } = req.body;

    if (!plan || !age || !weightKg || !heightCm) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // --- BMR + TDEE ---
    const bmr = gender === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    const activityMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(bmr * (activityMap[activityLevel] || 1.55));

    // --- Calories & Macros ---
    let targetCalories = tdee;
    if (/fat|loss/i.test(plan)) targetCalories -= 500;
    else if (/muscle|gain/i.test(plan)) targetCalories += 350;
    if (targetCalories < 1200) targetCalories = 1200;

    const protein_g = Math.round(weightKg * (/muscle|gain/i.test(plan) ? 2.2 : /fat|loss/i.test(plan) ? 2.0 : 1.6));
    const caloriesFromProtein = protein_g * 4;
    const fatsCalories = Math.round(targetCalories * 0.15);
    const fats_g = Math.round(fatsCalories / 9);
    const carbsCalories = Math.max(0, targetCalories - (caloriesFromProtein + fatsCalories));
    const carbs_g = Math.round(carbsCalories / 4);

    const isVegetarian = (dietType === "veg" || dietType === "vegetarian");

    // --- Generate Meals ---
    const getCandidates = async (categories) => {
      const q = { category: { $in: categories } };
      if (isVegetarian) q.$or = [{ type: "veg" }, { type: "both" }];
      return await Food.find(q).lean();
    };

    const ratios = { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 };
    const slots = Object.keys(ratios);
    const generatedMeals = [];
    const usedRice = new Set();

    for (const slot of slots) {
      const slotTarget = Math.round(targetCalories * ratios[slot]);
      let categoriesForSlot = [];

      if (slot === "breakfast") categoriesForSlot = ["protein", "carb", "dairy", "fruit"];
      else if (slot === "lunch" || slot === "dinner") categoriesForSlot = ["protein", "carb", "veg", "fat"];
      else if (slot === "snack") categoriesForSlot = ["snack", "fruit", "fat", "dairy"];

      const candidates = await getCandidates(categoriesForSlot);
      let pool = candidates.length ? candidates.slice() : await getCandidates(["protein","carb","veg","fruit","dairy","fat","snack"]);

      if (!pool.length) {
        generatedMeals.push({ slot, items: [], kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });
        continue;
      }

      // shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const items = [];
      let running = 0, idx = 0;

      while ((running < slotTarget * 0.85 || items.length < 2) && idx < pool.length && items.length < 5) {
        const f = pool[idx++];

        if (f.name.toLowerCase().includes("rice")) {
          if (usedRice.size > 0) continue;
          usedRice.add("rice");
        }

        items.push({
          id: f._id,
          name: f.name,
          portion: f.portion,
          calories: f.calories || 0,
          protein: f.protein || 0,
          carbs: f.carbs || 0,
          fat: f.fat || 0,
          category: f.category,
          type: f.type || "both"
        });
        running += f.calories || 0;
      }

      while (running > slotTarget * 1.5 && items.length > 1) {
        const removed = items.pop();
        running -= removed.calories || 0;
      }

      const slotTotals = items.reduce((acc, it) => {
        acc.calories += it.calories || 0;
        acc.protein += it.protein || 0;
        acc.carbs += it.carbs || 0;
        acc.fats += it.fat || 0;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

      generatedMeals.push({
        slot,
        items,
        kcal: slotTotals.calories,
        protein_g: Math.round(slotTotals.protein * 10) / 10,
        carbs_g: Math.round(slotTotals.carbs * 10) / 10,
        fats_g: Math.round(slotTotals.fats * 10) / 10,
      });
    }

    // --- Scale Meals ---
    const currentTotalCalories = generatedMeals.reduce((s, m) => s + (m.kcal || 0), 0) || 0;
    if (currentTotalCalories > 0) {
      const scale = targetCalories / currentTotalCalories;
      generatedMeals.forEach(m => {
        m.kcal = Math.round(m.kcal * scale);
        m.protein_g = Math.round((m.protein_g || 0) * scale * 10) / 10;
        m.carbs_g = Math.round((m.carbs_g || 0) * scale * 10) / 10;
        m.fats_g = Math.round((m.fats_g || 0) * scale * 10) / 10;
      });
    }

    const finalTotal = generatedMeals.reduce((acc, m) => {
      acc.calories += m.kcal || 0;
      acc.protein += m.protein_g || 0;
      acc.carbs += m.carbs_g || 0;
      acc.fats += m.fats_g || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const planResult = {
      goal: plan,
      targetCalories,
      macrosTarget: { protein_g, carbs_g, fats_g },
      generated: { meals: generatedMeals, total: finalTotal },
    };

    if (save && email) {
      const doc = await Diet.findOneAndUpdate(
        { email },
        {
          email,
          goal: plan,
          calories: targetCalories,
          macros: { protein_g, carbs_g, fats_g },
          meals: generatedMeals
        },
        { upsert: true, new: true }
      );
      planResult.saved = true;
      planResult.savedDoc = doc;
    }

    return res.json({ success: true, plan: planResult });
  } catch (err) {
    console.error("Generate Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------- SAVE / GET DIET ---------------- */
app.post("/save-diet", async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) return res.status(400).json({ success: false, message: "email & plan required" });

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
    if (!email) return res.status(400).json({ success: false, message: "email required" });
    const doc = await Diet.findOne({ email }).lean();
    res.json({ success: true, plan: doc || null });
  } catch (err) {
    console.error("Get Diet Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------- MongoDB + Start ---------------- */
const MONGO = "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp";
mongoose.connect(MONGO, {})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
