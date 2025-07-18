const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Load logo and other assets
const logoPath = path.join(__dirname, '../public/images/logo.png');
const fontPath = path.join(__dirname, '../public/fonts/roboto/Roboto-Regular.ttf');
const boldFontPath = path.join(__dirname, '../public/fonts/roboto/Roboto-Bold.ttf');
    
/**
 * Generate a PDF invoice
 * @param {Object} invoice - The invoice data
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Collect PDF data in chunks
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Header
      generateHeader(doc);
      
      // Customer information
      generateCustomerInformation(doc, invoice);
      
      // Invoice items
      generateInvoiceTable(doc, invoice);
      
      // Footer
      generateFooter(doc);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

// Generate header with logo and invoice info
function generateHeader(doc) {
  doc
    .image(logoPath, 50, 45, { width: 50 })
    .fillColor('#444444')
    .fontSize(20)
    .text('INVOICE', 200, 50, { align: 'right' })
    .fontSize(10)
    .text('123 Dental Clinic', 200, 75, { align: 'right' })
    .text('123 Dental Street', 200, 90, { align: 'right' })
    .text('New York, NY, 10001', 200, 105, { align: 'right' })
    .moveDown();
}

// Generate customer information section
function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font(boldFontPath)
    .text(invoice.invoiceNumber, 150, customerInformationTop)
    .font(fontPath)
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(formatDate(new Date(invoice.invoiceDate)), 150, customerInformationTop + 15)
    .text('Balance Due:', 50, customerInformationTop + 30)
    .text(formatCurrency(invoice.balance), 150, customerInformationTop + 30)

    .font(boldFontPath)
    .text(invoice.patientName, 300, customerInformationTop)
    .font(fontPath)
    .text('123 Patient Address', 300, customerInformationTop + 15)
    .text('New York, NY, 10001', 300, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 252);
}

// Generate invoice table
function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font(boldFontPath);
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Unit Cost',
    'Quantity',
    'Line Total'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font(fontPath);

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.description,
      formatCurrency(item.unitPrice),
      item.quantity,
      formatCurrency(item.total)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    'Subtotal',
    '',
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    '',
    'Paid To Date',
    '',
    formatCurrency(invoice.amountPaid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font(boldFontPath);
  generateTableRow(
    doc,
    duePosition,
    '',
    'Balance Due',
    '',
    formatCurrency(invoice.balance)
  );
  doc.font(fontPath);
}

// Generate footer
function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      'Thank you for your business. Please send payments to dental@example.com',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

// Helper function to generate table rows
function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

// Helper function to draw horizontal line
function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

// Helper function to format currency
function formatCurrency(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// Helper function to format date
function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return year + '/' + month + '/' + day;
}

module.exports = { generatePDF };
