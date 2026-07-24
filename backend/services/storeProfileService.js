const StoreProfile = require("../models/store/storeProfile");

// Resolves the store profile for a given user ID, throwing if not found
async function resolveStoreProfile(userId) {
  const storeProfile = await StoreProfile.findOne({ userId });
  if (!storeProfile) {
    throw new Error("Store profile not found");
  }
  return storeProfile;
}

module.exports = { resolveStoreProfile };