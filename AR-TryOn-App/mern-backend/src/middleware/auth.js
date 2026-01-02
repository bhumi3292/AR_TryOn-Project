import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
        req.user = { id: user._id, role: user.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

export default auth;
