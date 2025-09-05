const apiUrl = "http://localhost:5000";

async function startPayment() {
  const email = localStorage.getItem("email");
  const plan = localStorage.getItem("selectedPlan");
  const amount = localStorage.getItem("planAmount");

  if (!email || !plan) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  try {
    // 1️⃣ Create order from backend
    const orderRes = await fetch(`${apiUrl}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const order = await orderRes.json();

    // 2️⃣ Razorpay options
    var options = {
      key: "rzp_test_RDOq87kgys57h2", // apna test key id
      amount: order.amount,
      currency: "INR",
      name: "Diet Subscription",
      description: `Plan: ${plan}`,
      order_id: order.id,
      handler: async function (response) {
        // 3️⃣ Payment verification save in backend
        const verifyRes = await fetch(`${apiUrl}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: email.split("@")[0],
            email,
            plan,
            paymentId: response.razorpay_payment_id,
          }),
        });
        const result = await verifyRes.json();
        alert(result.message);
        if (result.success) {
          window.location.href = "dashboard.html";
        }
      },
      prefill: {
        email: email,
      },
      theme: {
        color: "#3399cc",
      },
    };

    // 4️⃣ Open Razorpay
    var rzp1 = new Razorpay(options);
    rzp1.open();
  } catch (err) {
    console.error("Payment Error:", err);
    alert("Payment failed. Try again.");
  }
}
