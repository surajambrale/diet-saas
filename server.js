const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const Subscription = require("./models/subscription");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: "rzp_test_RDOq87kgys57h2", // ⚡️ Apna Razorpay key id
  key_secret: "m36sZB7IqA2HeD2B51YybL7P" // ⚡️ Apna Razorpay secret
});

// ---------------- VERIFY PAYMENT ----------------
app.post("/verify-payment", async (req, res) => {
  try {
    const { name, email, plan, paymentId } = req.body;
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
    res.json({ success: true, message: "Subscription Activated!", subscription: newSub });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- CREATE ORDER ----------------
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
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

// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: "User registered successfully", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({ success: false, error: "Error registering user" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid password" });

    res.json({ success: true, message: "Login successful", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Error logging in", error: err.message });
  }
});

// ---------------- CHECK SUBSCRIPTION ----------------
app.post("/check-subscription", async (req, res) => {
  try {
    const { email, plan } = req.body;
    const sub = await Subscription.findOne({ email, plan });

    if (!sub) {
      return res.json({ active: false, message: "No subscription found" });
    }

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

// ---------------- MONGODB CONNECTION ----------------
mongoose.connect(
  "mongodb+srv://sambrale9003_db_user:JGu5OVBFdZ1h8f3u@diet-subs.yjxt7v8.mongodb.net/?retryWrites=true&w=majority&appName=diet-subs"
)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("MongoDB Error:", err));

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;  // ⚡️ Render apna port deta hai
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
