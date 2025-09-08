const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const bcrypt = require("bcryptjs");

// ================== MODELS ==================
const User = require("./models/User");
const Subscription = require("./models/subscription");

// ================== APP SETUP ==================
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5500",    // local frontend
    "http://localhost:4200",    // Angular local dev
    "https://diet-saas-eta.vercel.app" // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());

// ================== RAZORPAY CONFIG ==================
const razorpay = new Razorpay({
  key_id: "rzp_test_RDOq87kgys57h2",   // apna key dalna
  key_secret: "m36sZB7IqA2HeD2B51YybL7P"
});

// ================== AUTH ROUTES ==================

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    let existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, error: "Error registering user" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid password" });

    return res.json({ success: true, message: "Login successful", email: user.email });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
});

// ================== PAYMENT ROUTES ==================

// CREATE RAZORPAY ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // INR paise
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// VERIFY PAYMENT & SAVE SUBSCRIPTION
app.post("/verify-payment", async (req, res) => {
  try {
    const { name, email, plan, paymentId } = req.body;

    if (!name || !email || !plan || !paymentId) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30); // 30 days validity

    const newSub = new Subscription({
      name,
      email,
      plan,
      paymentId,
      startDate,
      expiryDate,
    });

    await newSub.save();
    res.json({ success: true, message: "Subscription Activated!", subscription: newSub });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CHECK SUBSCRIPTION
app.post("/check-subscription", async (req, res) => {
  try {
    const { email, plan } = req.body;

    if (!email || !plan) {
      return res.status(400).json({ active: false, message: "Email and plan required" });
    }

    const sub = await Subscription.findOne({ email, plan });
    if (!sub) return res.json({ active: false, message: "No subscription found" });

    const today = new Date();
    if (today <= sub.expiryDate) {
      return res.json({ active: true, expiry: sub.expiryDate });
    } else {
      return res.json({ active: false, message: "Subscription expired" });
    }
  } catch (error) {
    console.error("Check Subscription Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save diet plan
app.post("/save-diet", async (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.json({ success: false });

  await db.collection("users").updateOne(
    { email },
    { $set: { savedPlan: plan } },
    { upsert: true }
  );

  res.json({ success: true, message: "Diet plan saved!" });
});

// Get saved diet plan
app.post("/get-diet", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false });

  const user = await db.collection("users").findOne({ email });
  res.json({ success: true, plan: user?.savedPlan || null });
});


// ================== DATABASE CONNECTION ==================
mongoose.connect(
  "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/dietApp",
  {}
)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// ================== START SERVER ==================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
