const express = require("express");
const router = express.Router();
const {
  createCheckoutSession,
  cancelSubscription,
  handleWebhook,
  verifyPayment,
} = require("../controllers/stripeController");
const { protect } = require("../middleware/authMiddleware");

router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);
router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/cancel-subscription", protect, cancelSubscription);
router.get("/verify-payment", protect, verifyPayment);

module.exports = router;