const Contact = require("../model/Contact");

const ContactCtrl = {
  async createContact(req, res) {
    try {
      const { name, email, phone, subject, service, message } = req.body;
      

      // Create new contact
      const newContact = new Contact({
        name,
        email,
        phone,
        subject,
        service,
        message,
      });

      // Save contact to database
      await newContact.save();

      return res.status(201).json({
        success: true,
        message: "Contact form submitted successfully",
        contact: newContact,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error submitting contact form",
        error: error.message,
      });
    }
  },

  async getContacts(req, res) {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Contacts fetched successfully",
        data: contacts,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching contacts",
        error: error.message,
      });
    }
  },
};

module.exports = ContactCtrl;
