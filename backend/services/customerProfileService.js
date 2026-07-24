const CustomerProfile = require("../models/customer/customerProfile");

// Resolves the customer profile for a user ID, lazy-creating it if not present
async function resolveCustomerProfile(userId) {
  let profile = await CustomerProfile.findOne({ userId });
  if (!profile) {
    profile = await CustomerProfile.create({ userId });
  }
  return profile;
}

module.exports = { resolveCustomerProfile };