const router = require('express').Router();
const ContactCtrl = require('../controller/ContactCtrl');

// Route for creating a new contact
router.post('/add-contact', ContactCtrl.createContact);
router.get('/get-contact', ContactCtrl.getContacts);

module.exports = router;