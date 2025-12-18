const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Performance = require('../models/Performance');
const User = require('../models/User'); 

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

exports.createSubscriptionCheckoutSession = async (req, res) => {
  try {
    const { userId, price } = req.body;

    // Ovdje uzimamo URL tvoje aplikacije s Rendera
    // Ako nije postavljen u .env, bacit će grešku ili koristiti fallback (pazi da postaviš ENV varijablu!)
    const clientUrl = process.env.CLIENT_URL; 

    if (!clientUrl) {
        console.error("CLIENT_URL nije postavljen u .env datoteci!");
        return res.status(500).json({ error: 'Server konfiguracija greška' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
                name: 'Mjesečna članarina za organizatore',
                description: 'Aktivacija pristupa (30 dana)'
            },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Vraća na produkcijski URL
      success_url: `${clientUrl}/organizator/natjecanja?payment_refresh=true`,
      cancel_url: `${clientUrl}/organizator/placanje-clanarine`,
      metadata: { 
        type: 'subscription', 
        userId: userId 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate članarine' });
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
    
    // --- SLUČAJ 1: ČLANARINA ---
    if (session.metadata.type === 'subscription') {
        const { userId } = session.metadata;
        try {
            await User.findByIdAndUpdate(userId, { 
                subscriptionStatus: 'active',
                subscriptionExpiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
            });
            console.log(`Članarina aktivirana za korisnika ${userId}`);
        } catch (error) {
            console.error('Greška pri aktivaciji članarine:', error);
        }
    } 
    // --- SLUČAJ 2: NATJECANJA (STARO) ---
    else {
        const { userId, competitionId, performanceId } = session.metadata;

        // Provjera da ne pukne ako je slučajno stari tip metadata
        if (userId && competitionId) {
            await Registration.findOneAndUpdate(
              { user: userId, competition: competitionId },
              { paymentStatus: 'paid', stripeSessionId: session.id },
              { upsert: true, new: true }
            );

            if (performanceId) {
              await Performance.findByIdAndUpdate(
                performanceId,
                { paid: true, paymentStatus: 'paid' }
              );
            }
            console.log(`Registracija plaćena za natjecanje ID: ${competitionId}`);
        }
    }
  }

  res.json({ received: true });
};
