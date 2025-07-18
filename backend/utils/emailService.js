const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates in development
  }
});

// Load email templates
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, `../templates/emails/${templateName}.ejs`);
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    return ejs.render(template, data);
  } catch (error) {
    console.error('Error loading email template:', error);
    throw new Error('Failed to load email template');
  }
};

// Email template for patient credentials
const sendPatientCredentials = async (patientEmail, patientName, patientId, password) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: 'Your Dental Management System Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a90e2;">Dental Management System</h2>
            <p style="color: #666;">Your Patient Portal Access</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p>Hello ${patientName},</p>
            <p>Welcome to our Dental Management System! Your patient account has been created successfully.</p>
            <p>You can now access your patient portal using the following credentials:</p>
          </div>
          
          <div style="background-color: #eef7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Patient ID:</strong> ${patientId}</p>
            <p><strong>Email:</strong> ${patientEmail}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <div style="margin-top: 20px;">
            <p>For security reasons, we recommend changing your password after your first login.</p>
            <p>If you have any questions or need assistance, please contact our support team.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; text-align: center;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Generate a strong random password
const generateStrongPassword = (length = 10) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let password = 
    uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
    lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Send invoice email to patient
 * @param {Object} invoice - Invoice data
 * @param {Buffer} pdfBuffer - PDF buffer of the invoice
 * @param {string} [type='invoice'] - Type of email (invoice or payment_receipt)
 */
const sendInvoiceEmail = async (invoice, pdfBuffer, type = 'invoice') => {
  try {
    const subject = type === 'invoice' 
      ? `Invoice #${invoice.invoiceNumber} from ${process.env.CLINIC_NAME || 'Our Dental Clinic'}`
      : `Payment Receipt for Invoice #${invoice.invoiceNumber}`;

    // Render email template
    const emailHtml = await loadTemplate(type, { 
      invoice,
      clinicName: process.env.CLINIC_NAME || 'Our Dental Clinic',
      clinicAddress: process.env.CLINIC_ADDRESS || '123 Dental Street, City, Country',
      clinicPhone: process.env.CLINIC_PHONE || '+1 (123) 456-7890',
      clinicEmail: process.env.CLINIC_EMAIL || 'info@dentalclinic.com',
      currentYear: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Dental Clinic'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: invoice.patient.email || invoice.patientId.email,
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: type === 'invoice' 
            ? `invoice-${invoice.invoiceNumber}.pdf` 
            : `receipt-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new Error('Failed to send invoice email');
  }
};

// Generate a random string for password reset tokens
const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

module.exports = {
  sendPatientCredentials,
  generateStrongPassword,
  sendInvoiceEmail,
  generateToken,
  transporter // Export for testing
};
