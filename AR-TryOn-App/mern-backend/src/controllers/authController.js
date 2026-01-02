import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const signToken = (user) => {
    const payload = { id: user._id, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    // Input validation
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Default role to USER if not provided (mapping USER -> BUYER internally or just using USER)
    // DreamDwell references roles USER / SELLER / ADMIN.
    // Existing User model uses ['BUYER', 'SELLER', 'admin'].
    // We should map 'USER' to 'BUYER' or just accept 'BUYER' from frontend.
    // Let's stick to the model's enum or update it if needed. Use model defaults.
    // Requirement says: role (USER / SELLER / ADMIN).
    // Let's allow passing these and map them if necessary, or update the model. 
    // The existing model has 'BUYER', 'SELLER', 'admin'. 
    // Let's mapping: USER -> BUYER, ADMIN -> admin. SELLER -> SELLER.

    let userRole = role || 'BUYER';
    if (role === 'USER') userRole = 'BUYER';
    if (role === 'ADMIN') userRole = 'admin';

    if (!['BUYER', 'SELLER', 'admin'].includes(userRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });

        const user = new User({ name, email, role: userRole });
        user.password = password; // Virtual setter handles hashing
        await user.save();

        const token = signToken(user);
        const { passwordHash, ...u } = user.toObject();
        return res.status(201).json({ success: true, token, user: u });
    } catch (err) {
        console.error('Register error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    try {
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const match = await user.comparePassword(password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = signToken(user);
        const { passwordHash, ...u } = user.toObject();
        return res.json({ success: true, token, user: u });
    } catch (err) {
        console.error('Login error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Check requirement "Return clear 400/401 errors" - usually 404 for not found or 400.
            // But for security often we return 200. Since "not security" focus, let's be clear.
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // No email service, just return success so frontend can redirect
        return res.json({ success: true, message: 'Email verified. You can reset your password.' });
    } catch (err) {
        console.error('Forgot Password error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Email and new password are required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.password = newPassword; // Hashing handled by model
        await user.save();

        return res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset Password error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export default { register, login, forgotPassword, resetPassword };
