const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Performance = require('../models/Performance');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { competitionId, userId, performanceId } = req.body;

    // 1️⃣ Dohvati natjecanje
    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ error: 'Natjecanje nije pronađeno' });

    // 2️⃣ Kreiraj Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Prijava: ${competition.name}` },
            unit_amount: competition.registrationFee * 100, // EUR → centi
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.REACT_APP_API_URL}/payment-success?competitionId=${competitionId}&performanceId=${performanceId}`,
      cancel_url: `${process.env.REACT_APP_API_URL}/payment-cancelled?competitionId=${competitionId}`,
      metadata: { userId, competitionId, performanceId: performanceId || '' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja Stripe sessiona' });
  }
};

// ---------------- WEBHOOK FUNKCIJA ----------------
exports.stripeWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, competitionId, performanceId } = session.metadata;

    // Ažuriraj registraciju
    await Registration.findOneAndUpdate(
      { user: userId, competition: competitionId },
      { paymentStatus: 'paid', stripeSessionId: session.id },
      { upsert: true, new: true }
    );

    // Ako postoji performanceId, označi ga kao plaćen
    if (performanceId) {
      await Performance.findByIdAndUpdate(
        performanceId,
        { paid: true, paymentStatus: 'paid' }
      );
      console.log(`Nastup ${performanceId} označen kao plaćen.`);
    }

    console.log(`Registracija za korisnika ${userId} i natjecanje ${competitionId} je sada plaćena.`);
  }

  res.json({ received: true });
};