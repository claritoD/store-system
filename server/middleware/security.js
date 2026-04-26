function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // Basic CSP for API responses; HTML is served by Vercel/static.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self';");
  next();
}

function jsonOnly(req, res, next) {
  if (req.method === 'GET') return next();
  const ct = req.headers['content-type'] || '';
  // Allow multipart for image uploads
  if (ct.includes('application/json') || ct.includes('multipart/form-data')) return next();
  return res.status(415).json({ error: 'Unsupported Media Type' });
}

module.exports = { securityHeaders, jsonOnly };

