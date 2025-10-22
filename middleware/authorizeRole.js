export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {

      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}