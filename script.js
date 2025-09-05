// Apne backend ka URL (Render deploy hone ke baad yaha paste karna)
const BASE_URL = "http://localhost:5000";  

// ---------------- REGISTER ----------------
async function register(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Registration successful! Please log in.");
      window.location.href = "login.html";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (err) {
    console.error("Frontend Error:", err);
    alert("Something went wrong during registration.");
  }
}

// ---------------- LOGIN ----------------
async function login(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Frontend Error:", err);
    alert("Something went wrong during login.");
  }
}

// ---------------- FETCH DIET PLANS ----------------
async function loadPlans() {
  try {
    const res = await fetch(`${BASE_URL}/dietplans`);
    const plans = await res.json();

    const container = document.getElementById("plans");
    container.innerHTML = "";

    plans.forEach((plan) => {
      const div = document.createElement("div");
      div.classList.add("plan-card");
      div.innerHTML = `
        <h3>${plan.name}</h3>
        <p>${plan.details}</p>
        <p><strong>₹${plan.price}</strong></p>
        <button onclick="selectPlan(${plan.id}, ${plan.price})">Choose Plan</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading plans:", err);
  }
}

// ---------------- PAYMENT ----------------
async function selectPlan(planId, price) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price }),
    });

    const order = await res.json();

    var options = {
      key: "YOUR_RAZORPAY_KEY", // Razorpay Dashboard se
      amount: order.amount,
      currency: order.currency,
      name: "Diet Plans",
      description: "Purchase Diet Plan",
      order_id: order.id,
      handler: function (response) {
        alert("Payment Successful! Your diet plan is unlocked.");
        window.location.href = "dashboard.html";
      },
      prefill: {
        name: user.name,
        email: user.email,
      },
      theme: { color: "#3399cc" },
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();
  } catch (err) {
    console.error("Payment error:", err);
    alert("Payment failed. Try again.");
  }
}

// ---------------- DASHBOARD ----------------
function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("welcome").innerText = `Welcome, ${user.name}! 🎉`;
}

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
