const express = require('express');
const router = express.Router();

router.get('/', (req,res) => {
   let userType = null;
   if (req.session.user) {
      console.log('User :', req.session.user);
      userType = req.session.user.type;
   } 
   res.render('home', { userType });
});

module.exports = router;