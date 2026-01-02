const requireRole = (roles = []) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient role' });
    next();
};

export default requireRole;
