const CustomerProfile = require("../models/customer/customerProfile");

async function resolveCustomerProfile(userId) {
  let profile = await CustomerProfile.findOne({ userId });
  if (!profile) {
    profile = await CustomerProfile.create({ userId });
  }
  return profile;
}

module.exports = { resolveCustomerProfile };