const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Performance = require('../models/Performance');
const User = require('../models/User'); 

// =====================================================================
// 1. FUNKCIJA ZA VODITELJA KLUBA (Plaćanje natjecanja)
// =====================================================================
exports.createCheckoutSession = async (req, res) => {
  try {
    const { competitionId, userId, performanceId } = req.body;

    // Provjera postoji li natjecanje
    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ error: 'Natjecanje nije pronađeno' });

    // Frontend URL za voditelja kluba
    const clientUrl = 'https://dancearena.onrender.com';

    // Kreiranje naplate za Voditelja kluba
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
      // ✅ Success vraća na istu stranicu PrijaviNastup
      success_url: `${clientUrl}/voditelj/prijavi-nastup/${competitionId}? payment_success=true`,
      cancel_url: `${clientUrl}/voditelj/prijavi-nastup/${competitionId}?payment_cancelled=true`,
      metadata: { 
        role: 'club_leader',
        userId, 
        competitionId, 
        performanceId:  performanceId || '' 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error (Voditelj kluba):', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate za natjecanje' });
  }
};

// =====================================================================
// 2. FUNKCIJA ZA ORGANIZATORA (Plaćanje članarine)
// =====================================================================
exports.createSubscriptionCheckoutSession = async (req, res) => {
  try {
    const { userId, price } = req.body;

    const clientUrl = 'https://dancearena.onrender.com';

    console.log("Organizator plaća članarinu, povratak na:", clientUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
                name: 'Mjesečna članarina za organizatore',
                description: 'Aktivacija pristupa organizaciji natjecanja (30 dana)'
            },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // ✅ ORGANIZATOR SE VRAĆA NA SVOJ DASHBOARD
      success_url: `${clientUrl}/organizator/natjecanja? payment_success=true`,
      cancel_url: `${clientUrl}/organizator/placanje-clanarine?payment_cancelled=true`,
      metadata: { 
        type: 'subscription', 
        userId:  userId 
      },
    });

    res.json({ url: session. url });
  } catch (err) {
    console.error('Stripe error (Organizator):', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate članarine' });
  }
};

// =====================================================================
// 3. WEBHOOK (Zajednički prijemni sandučić)
// =====================================================================
exports.stripeWebhook = async (req, res) => {
  const endpointSecret = process.env. STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err. message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event. type === 'checkout.session. completed') {
    const session = event.data.object;
    
    // --- SLUČAJ 1: ČLANARINA ZA ORGANIZATORA ---
    if (session. metadata. type === 'subscription') {
        const { userId } = session.metadata;
        
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            console.log(`Aktiviram organizatora ${userId} do datuma:  ${expiryDate}`);

            await User.findByIdAndUpdate(userId, { 
                subscriptionStatus: 'active',
                subscriptionExpiry: expiryDate
            });
            
            console.log(`--> Uspješno ažurirano! `);
        } catch (error) {
            console.error('Greška pri aktivaciji članarine:', error);
        }
    } 
    // --- SLUČAJ 2: VODITELJ KLUBA (Kotizacije) ---
    else {
        const { userId, competitionId, performanceId } = session.metadata;
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
            console.log(`Plaćeno natjecanje ${competitionId}`);
        }
    }
  }

  res.json({ received: true });
};

module.exports = exports;