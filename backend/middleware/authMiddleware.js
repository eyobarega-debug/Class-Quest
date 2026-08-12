// ------------------------------------------------------------------
// requireAuth: checks that a valid JWT was sent, and attaches the
// decoded token payload to req.user so later code (controllers,
// requireAdmin) can read it.
//
// How the token gets here: the frontend stores the JWT it got at
// login and sends it on every request as:
//   Authorization: Bearer <token>
// ------------------------------------------------------------------
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload looks like: { id, role, username, iat, exp }
    req.user = payload;
    return next();
  } catch (err) {
    // Covers both "signature invalid" and "token expired".
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// ------------------------------------------------------------------
// requireAdmin: run AFTER requireAuth. Blocks anyone whose token
// role isn't 'admin'. This is the "students must NOT access admin
// functionality" rule from the brief, enforced on the server -
// hiding an admin button in the UI is not real security by itself.
// ------------------------------------------------------------------
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
