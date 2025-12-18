const express = require("express");
const router = express.Router();
const { createCheckoutSession } = require("../controllers/stripeController");

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", createCheckoutSession);

router.post('/create-subscription-checkout-session', createSubscriptionCheckoutSession);

// Webhook je registriran direktno u server.js jer mora biti prije express.json()

module.exports = router;