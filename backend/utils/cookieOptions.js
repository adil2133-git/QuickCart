const IS_PROD = process.env.NODE_ENV === "production";

// Frontend (Vercel) and backend (AWS) live on different domains in production,
// so cookies must be sameSite:"none" to be sent on cross-site requests.
// "none" is only valid when paired with secure:true (HTTPS), which is why
// this is tied to IS_PROD rather than always-on — localhost dev uses plain
// HTTP, where secure:true would silently block the cookie entirely.
const CROSS_SITE_COOKIE_BASE = {
  sameSite: IS_PROD ? "none" : "lax",
  secure: IS_PROD,
};

// Access token cookie — short-lived, matches JWT expiry.
// 2 minutes gives enough buffer for the 1-minute JWT + interceptor retry.
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  ...CROSS_SITE_COOKIE_BASE,
  maxAge: 2 * 60 * 1000, // 2 minutes in ms
};

// Refresh token cookie — long-lived, survives browser restarts.
// Must outlive the access token significantly so silent refresh works.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  ...CROSS_SITE_COOKIE_BASE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms — matches JWT expiresIn: "7d"
};

module.exports = { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS };