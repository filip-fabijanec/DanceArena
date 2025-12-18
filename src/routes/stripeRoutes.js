const express = require("express");
const router = express.Router();
const { createCheckoutSession, createSubscriptionCheckoutSession } = require("../controllers/stripeController");

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", createCheckoutSession);

// POST /api/stripe/create-subscription-checkout-session
router.post('/create-subscription-checkout-session', createSubscriptionCheckoutSession);

// Webhook je registriran direktno u server.js jer mora biti prije express.json()

module.exports = router;