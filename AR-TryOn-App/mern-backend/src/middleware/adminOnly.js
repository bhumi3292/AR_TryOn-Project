import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to ensure the user is authenticated and has the 'admin' role.
const adminOnly = async (req, res, next) => {
    // 1. Get Token from Header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authentication failed: No admin token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Verify Token and Decode Payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // The token payload contains the user ID (named `id` in login controller)
        const userId = decoded.id || decoded.userId;

        // 3. Find the User by ID and verify their role
        // We look for a User with the given ID AND the role 'admin'
        const user = await User.findOne({ _id: userId, role: 'admin' }).select('-passwordHash');

        if (!user) {
            // This handles cases where the token is valid but the user either doesn't exist
            // or does not have the required 'admin' role.
            return res.status(401).json({ success: false, message: "Authorization failed: Invalid admin credentials or permission denied." });
        }

        // 4. Attach verified user to request for downstream handlers (using standard name 'req.user')
        req.user = user;
        
        next();

    } catch (err) {
        // 5. Handle JWT Errors
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired. Please login again." });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Invalid token. Please login again." });
        }
        
        console.error("Admin Authentication Error:", err);
        return res.status(500).json({ success: false, message: "Authentication failed due to server error." });
    }
};

export default adminOnly;