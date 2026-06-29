const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

// Same shape today, but kept separate in case refresh-token cookies ever
// need different maxAge/path settings later.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

module.exports = { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS };