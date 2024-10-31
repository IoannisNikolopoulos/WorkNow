// otpStore.js

// This is a simple in-memory OTP store. In production, consider using a persistent database.
const otpStore = {};

// Function to store an OTP with email and timestamp
function storeOtp(email, otp) {
  otpStore[email] = { otp, timestamp: Date.now() };
}

// Function to retrieve the OTP entry by email
function getOtpEntry(email) {
  return otpStore[email];
}

// Function to delete an OTP entry after successful password reset or OTP expiration
function deleteOtp(email) {
  delete otpStore[email];
}

module.exports = {
  storeOtp,
  getOtpEntry,
  deleteOtp,
};
