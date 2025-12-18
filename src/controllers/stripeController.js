const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Performance = require('../models/Performance');
const User = require('../models/User'); // <--- DODANO: Treba nam User model

// 1. Postojeća funkcija za natjecanja (OSTAVI KAKO JE)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { competitionId, userId, performanceId } = req.body;

    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ error: 'Natjecanje nije pronađeno' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Prijava: ${competition.name}` },
            unit_amount: competition.registrationFee * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Pazi na URL-ove, moraju odgovarati tvojim frontend rutama
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/organizator/uspjesno-placanje?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/organizator/placanje-clanarine`,
      // Metadata nam služi da u webhooku znamo o čemu se radi
      metadata: { 
        type: 'competition_registration', // <--- Oznaka tipa
        userId, 
        competitionId, 
        performanceId: performanceId || '' 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja Stripe sessiona' });
  }
};

// 2. NOVA FUNKCIJA: Za plaćanje članarine (DODAJ OVO)
exports.createSubscriptionCheckoutSession = async (req, res) => {
  try {
    const { userId, email, price } = req.body;

    // Kreiramo sesiju za plaćanje članarine (jednokratno 20€ za 1 mjesec)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
                name: 'Mjesečna članarina za organizatore',
                description: 'Aktivacija pristupa za kreiranje natjecanja (30 dana)'
            },
            unit_amount: price * 100, // npr. 20 * 100 = 2000 centi
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Koristimo 'payment' za jednostavnost (bez kreiranja produkata u Stripe dashboardu)
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/organizator/uspjesno-placanje?type=subscription`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/organizator/placanje-clanarine`,
      metadata: { 
        type: 'subscription_payment', // <--- Oznaka tipa
        userId: userId 
      },
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('Stripe subscription error:', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate članarine' });
  }
};

// 3. AŽURIRANI WEBHOOK (Mora prepoznati oba slučaja)
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
    const metadata = session.metadata;

    // SLUČAJ 1: Plaćanje članarine
    if (metadata.type === 'subscription_payment') {
        const { userId } = metadata;
        
        try {
            // Ažuriraj korisnika - postavi status na active
            // Ovdje možeš dodati i logiku za "subscriptionExpiresAt" ako želiš (npr. +30 dana)
            await User.findByIdAndUpdate(userId, { 
                subscriptionStatus: 'active',
                subscriptionExpiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // +30 dana
            });
            console.log(`Članarina aktivirana za korisnika ${userId}`);
        } catch (error) {
            console.error('Greška pri aktivaciji članarine:', error);
        }
    } 
    
    // SLUČAJ 2: Plaćanje natjecanja (tvoj stari kod)
    else if (metadata.competitionId) { // Stari način provjere ili metadata.type === 'competition_registration'
        const { userId, competitionId, performanceId } = metadata;

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
        console.log(`Registracija za natjecanje plaćena: ${competitionId}`);
    }
  }

  res.json({ received: true });
};