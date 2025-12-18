const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Performance = require('../models/Performance');
const User = require('../models/User'); 

// =====================================================================
// 1. FUNKCIJA ZA VODITELJA KLUBA (Plaćanje natjecanja)
// =====================================================================
// Ovu funkciju poziva Voditelj kluba kada želi platiti kotizaciju za svoje plesače.
exports.createCheckoutSession = async (req, res) => {
  try {
    const { competitionId, userId, performanceId } = req.body;

    // Provjera postoji li natjecanje
    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ error: 'Natjecanje nije pronađeno' });

    // Kreiranje naplate za Voditelja kluba
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Prijava: ${competition.name}` },
            unit_amount: competition.registrationFee * 100, // Cijena natjecanja
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Vraća Voditelja kluba na stranicu s potvrdom
      success_url: `${process.env.REACT_APP_API_URL}/payment-success?competitionId=${competitionId}&performanceId=${performanceId}`,
      cancel_url: `${process.env.REACT_APP_API_URL}/payment-cancelled?competitionId=${competitionId}`,
      // U metadata spremamo podatke o natjecanju (NE o članarini)
      metadata: { 
        role: 'club_leader', // Oznaka da plaća voditelj
        userId, 
        competitionId, 
        performanceId: performanceId || '' 
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
// Ovu funkciju poziva isključivo Organizator da bi aktivirao svoj profil.
exports.createSubscriptionCheckoutSession = async (req, res) => {
  try {
    const { userId, price } = req.body;

    // Tvoj frontend link (hardkodiran da izbjegnemo greške na Renderu)
    // AKO TI SE PROMJENI LINK APLIKACIJE, OVDJE GA AŽURIRAJ:
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
      // Vraća Organizatora na njegove stranice
      success_url: `${clientUrl}/organizator/natjecanja?payment_refresh=true`,
      cancel_url: `${clientUrl}/organizator/placanje-clanarine`,
      // U metadata spremamo oznaku da je ovo SUBSCRIPTION
      metadata: { 
        type: 'subscription', 
        userId: userId 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error (Organizator):', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate članarine' });
  }
};

// =====================================================================
// 3. WEBHOOK (Zajednički prijemni sandučić)
// =====================================================================
// Stripe ovdje šalje potvrde za SVA plaćanja. Mi ih razvrstavamo.
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
    
    // --- SLUČAJ 1: ČLANARINA ZA ORGANIZATORA ---
    if (session.metadata.type === 'subscription') {
        const { userId } = session.metadata;
        
        try {
            // 1. Izračunaj datum isteka (Danas + 30 dana)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); 

            console.log(`Aktiviram organizatora ${userId} do datuma: ${expiryDate}`);

            // 2. Ažuriraj korisnika
            await User.findByIdAndUpdate(userId, { 
                subscriptionStatus: 'active',
                subscriptionExpiry: expiryDate
            });
            
            console.log(`--> Uspješno ažurirano!`);
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