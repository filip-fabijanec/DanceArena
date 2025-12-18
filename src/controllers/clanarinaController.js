const User = require('../models/User');

// @desc    Dohvati sve organizatore i njihove statuse pretplate
// @route   GET /api/clanarine
// @access  Private/Admin
const getClanarine = async (req, res) => {
  try {
    // Dohvaćamo samo organizatore jer samo oni plaćaju članarinu
    // Selectamo polja koja nas zanimaju da ne šaljemo passworde i ostalo smeće
    const organizatori = await User.find({ role: 'organizator' })
      .select('name surname email subscriptionStatus subscriptionExpiry role')
      .sort({ subscriptionExpiry: 1 }); // Sortiraj po isteku (oni kojima ističe prije su na vrhu)

    res.status(200).json(organizatori);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ažuriraj pretplatu korisnika (Admin ručno produžuje ili mijenja status)
// @route   PUT /api/clanarine/:id
// @access  Private/Admin
const updateClanarina = async (req, res) => {
  try {
    const { subscriptionStatus, subscriptionExpiry } = req.body;
    
    // Ovdje ID koji primamo je zapravo User ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    // Ažuriramo samo polja vezana uz članarinu
    if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiry) user.subscriptionExpiry = subscriptionExpiry;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Brisanje "članarine" zapravo znači micanje statusa ili brisanje usera?
// Ovdje ćemo pretpostaviti da resetiramo status na 'inactive'
const deleteClanarina = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

    user.subscriptionStatus = 'inactive';
    user.subscriptionExpiry = null; // Ili neki stari datum
    await user.save();

    res.status(200).json({ message: 'Pretplata poništena' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClanarine,
  updateClanarina,
  deleteClanarina
};