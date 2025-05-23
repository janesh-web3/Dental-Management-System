const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: process.env.EMAIL_USER , // Use environment variable or replace with actual email
    pass: process.env.EMAIL_PASSWORD // Use environment variable or replace with actual password
  }
});

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

module.exports = {
  sendPatientCredentials,
  generateStrongPassword
};
