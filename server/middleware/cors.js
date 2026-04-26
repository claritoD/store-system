function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.FRONTEND_ORIGIN;

  if (allowedOrigin && origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Requested-With'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    );
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
}

module.exports = { corsMiddleware };

