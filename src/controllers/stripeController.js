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

    console.log(`💳 [STRIPE] Kreiram session za voditelja: User ${userId}, Natjecanje ${competitionId}`);

    // Provjera postoji li natjecanje
    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ error: 'Natjecanje nije pronađeno' });

    // Frontend URL
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
      // Popravljen URL (bez razmaka)
      success_url: `${clientUrl}/voditelj/prijavi-nastup/${competitionId}?payment_success=true`,
      cancel_url: `${clientUrl}/voditelj/prijavi-nastup/${competitionId}?payment_cancelled=true`,
      metadata: { 
        role: 'club_leader',
        userId, 
        competitionId, 
        performanceId: performanceId || '' 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ [STRIPE ERROR - VODITELJ]:', err);
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

    console.log(`💳 [STRIPE] Kreiram session za organizatora: User ${userId}, Cijena ${price}`);

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
      // Popravljen URL (bez razmaka)
      success_url: `${clientUrl}/organizator/natjecanja?payment_success=true`,
      cancel_url: `${clientUrl}/organizator/placanje-clanarine?payment_cancelled=true`,
      metadata: { 
        type: 'subscription', 
        userId: userId 
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ [STRIPE ERROR - ORGANIZATOR]:', err);
    res.status(500).json({ error: 'Greška prilikom kreiranja naplate članarine' });
  }
};

// =====================================================================
// 3. WEBHOOK (Zajednički prijemni sandučić - S DETALJNIM LOGOVIMA)
// =====================================================================
exports.stripeWebhook = async (req, res) => {
  console.log("🔔 [WEBHOOK] Pozvan! (Start processing)"); // Znak da Stripe pogađa server

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];

  // 1. Provjera postojanja tajnog ključa
  if (!endpointSecret) {
      console.error("❌ [WEBHOOK FATAL] Nedostaje STRIPE_WEBHOOK_SECRET u .env fileu!");
      return res.status(400).send("Server Error: Missing Webhook Secret");
  }

  let event;

  // 2. Provjera potpisa (Signature Verification)
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ [WEBHOOK] Potpis verificiran."); 
  } catch (err) {
    console.error(`❌ [WEBHOOK ERROR] Verifikacija potpisa neuspješna: ${err.message}`);
    console.error("SAVJET: Provjeri je li 'STRIPE_WEBHOOK_SECRET' točan (počinje s whsec_...)");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Obrada događaja
  console.log(`ℹ️ [WEBHOOK EVENT] Primljen tip: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log("📦 [WEBHOOK DATA] Session Metadata:", session.metadata);
    
    // --- SLUČAJ 1: ČLANARINA ZA ORGANIZATORA ---
    if (session.metadata?.type === 'subscription') {
        const { userId } = session.metadata;
        console.log(`👤 [WEBHOOK LOGIC] Obrada članarine za User ID: ${userId}`);
        
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // Dodaj 30 dana

            // Ažuriranje u bazi
            const updatedUser = await User.findByIdAndUpdate(userId, { 
                subscriptionStatus: 'active',
                subscriptionExpiry: expiryDate
            }, { new: true }); // {new: true} vraća ažurirani dokument

            if (updatedUser) {
                console.log(`✅ [DB SUCCESS] Korisnik ažuriran!`);
                console.log(`   -> Status: ${updatedUser.subscriptionStatus}`);
                console.log(`   -> Istječe: ${updatedUser.subscriptionExpiry}`);
            } else {
                console.error(`❌ [DB ERROR] Korisnik s ID-em ${userId} nije pronađen u bazi!`);
            }
            
        } catch (error) {
            console.error('❌ [DB EXCEPTION] Greška pri aktivaciji članarine:', error);
        }
    } 
    
    // --- SLUČAJ 2: VODITELJ KLUBA (Kotizacije) ---
    else if (session.metadata?.role === 'club_leader') {
        const { userId, competitionId, performanceId } = session.metadata;
        console.log(`💃 [WEBHOOK LOGIC] Obrada kotizacije za natjecanje ID: ${competitionId}`);

        try {
            if (userId && competitionId) {
                await Registration.findOneAndUpdate(
                  { user: userId, competition: competitionId },
                  { paymentStatus: 'paid', stripeSessionId: session.id },
                  { upsert: true, new: true }
                );
                console.log(`✅ [DB SUCCESS] Registracija ažurirana na 'paid'.`);

                if (performanceId) {
                  await Performance.findByIdAndUpdate(
                    performanceId,
                    { paid: true, paymentStatus: 'paid' }
                  );
                  console.log(`✅ [DB SUCCESS] Nastup (Performance) označen kao plaćen.`);
                }
            } else {
                console.warn("⚠️ [WEBHOOK WARNING] Nedostaju userId ili competitionId u metadati.");
            }
        } catch (error) {
            console.error('❌ [DB EXCEPTION] Greška pri obradi kotizacije:', error);
        }
    } else {
        console.log("ℹ️ [WEBHOOK] Session nema poznatu 'type' ili 'role' metadatu.");
    }
  } else {
      console.log(`ℹ️ [WEBHOOK] Ignoriram event koji nije checkout.session.completed`);
  }

  res.json({ received: true });
};

module.exports = exports;