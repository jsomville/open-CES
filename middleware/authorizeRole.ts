import type { NextFunction, Request, Response } from 'express';

export function authorizeRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes((req.user as any).role)) {

      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}