const IS_PROD = process.env.NODE_ENV === "production";

// Access token cookie — short-lived, matches JWT expiry.
// 2 minutes gives enough buffer for the 1-minute JWT + interceptor retry.
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PROD,
  maxAge: 2 * 60 * 1000, // 2 minutes in ms
};

// Refresh token cookie — long-lived, survives browser restarts.
// Must outlive the access token significantly so silent refresh works.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PROD,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms — matches JWT expiresIn: "7d"
};

module.exports = { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS };