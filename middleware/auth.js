// middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET_KEY || 'your-very-secret-key';

export function authenticateToken(req, res, next) {

  const authh = req.headers.authorization
  if (!authh){
    return res.status(401).json({error : "Authorization Header is missing"})
  }

  const token = authh?.split(' '); // Expect "Bearer <token>"

  if (!token[0])
    return res.status(401).json({ error: 'Invalid token provided' });

  if (token[0] != "Bearer")
    return res.status(401).json({ error: 'Invalid token provided'});

  if (!token[1])
    return res.status(401).json({ error: 'Invalid token provided' });

  console.log(token)

  try {
    const user = jwt.verify(token[1], JWT_SECRET);
    
    req.user = user; // Attach user data to request

    next();
  }
  catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
