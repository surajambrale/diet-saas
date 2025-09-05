const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
