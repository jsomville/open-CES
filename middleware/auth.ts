import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      decodedToken?: JwtPayload | string;
      user?: JwtPayload | string;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {

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

    const decoded = jwt.verify(token[1], JWT_SECRET);

    if (typeof decoded === 'string') {
      return res.status(422).json({ error: "Invalid Token" });
    }

     // Decode ISS
    if (!decoded.iss) {
      return res.status(422).json({ error: "Invalid Refresh Token" });
    }

    //Check Trusted Issuer
    if (decoded.iss != process.env.TRUSTED_ISSUER) {
      return res.status(422).json({ error: "Untrusted Issuer" });
    }

    req.decodedToken = decoded

    //TODO : Fix using the user...
    req.user = decoded; // Attach user data to request

    next();
  }
  catch (error) {
    //console.error("Auth Middleware ", error)
    return res.status(403).json({ message: 'Invalid token' });
  }
}
