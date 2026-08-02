const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return true;

  // Dynamically allow Vercel deployment subdomains (e.g. https://quick-cart-flax-eta.vercel.app)
  if (/\.vercel\.app$/.test(origin)) return true;

  return allowedOrigins.some((allowed) => {
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
};

module.exports = { isOriginAllowed, corsOptions };
