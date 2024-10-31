const nodemailer = require('nodemailer');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: "apikey",
    pass: "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",
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

module.exports = transporter;
