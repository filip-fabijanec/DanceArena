const express = require("express");
const router = express.Router();
const {createCheckoutSession} = require("../controllers/stripeController");

router.post("/create-checkout-session", createCheckoutSession);
router.post("/webhook", express.raw({type: 'application/json'}),stripeWebhook);

module.exports = router;