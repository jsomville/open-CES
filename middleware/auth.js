// middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Expect "Bearer <token>"

  if (!token)
    return res.status(401).json({ error: 'No token provided' });

  try {
    jwt.decode(res.body.accessToken);
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user; // Attach user data to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
