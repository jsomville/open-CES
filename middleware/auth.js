// middleware/auth.js
import jwt from 'jsonwebtoken';



export function authenticateToken(req, res, next) {

  const authh = req.headers.authorization
  if (!authh) {
    return res.status(401).json({ message: "Authorization Header is missing" })
  }

  //console.log(authh);
  const token = authh?.split(' '); // Expect "Bearer <token>"

  if (!token[0]) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (token[0] != "Bearer") {
    return res.status(401).json({ message: 'Invalid token' });
  }


  if (!token[1]) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {

    const JWT_SECRET = process.env.JWT_ACCESS_SECRET_KEY || 'your-very-secret-key';

    const user = jwt.verify(token[1], JWT_SECRET);

    req.user = user; // Attach user data to request

    next();
  }
  catch (error) {
    console.error(error)
    return res.status(403).json({ message: 'Invalid token' });
  }
}
