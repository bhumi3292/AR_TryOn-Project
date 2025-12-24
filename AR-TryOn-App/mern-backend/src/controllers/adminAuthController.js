import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// --- Core Auth Functions ---

export const signup = async (req, res) => {
    // Extract required fields
    const fullName = req.body.fullName || req.body.name;
    const { email, password, confirmPassword } = req.body;

    // Extract optional fields added to the Mongoose model
    const { phone, address, city, country } = req.body;

    // Check for password consistency
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    // --- 1. Validation for required fields ---
    if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    try {
        // --- 2. Check for existing admin/user ---
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Admin account with this email already exists' });
        }

        // --- 3. Create new Admin User with all fields ---
        const admin = new User({
            fullName,
            email,
            role: 'admin',
            // Include optional fields from the request body
            phone,
            address,
            city,
            country,
        });

        // Use the Mongoose virtual setter for hashing (as per the model)
        admin.password = password;

        // --- 4. Save the user ---
        // The pre-save hook in the User model handles setting passwordHash from admin.password
        await admin.save();

        // --- 5. Success Response ---
        return res.status(201).json({
            success: true,
            message: 'Admin account created successfully'
        });

    } catch (err) {
        console.error('Admin Signup Error:', err);
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation failed: ${messages.join(', ')}` });
        }
        return res.status(500).json({ success: false, message: 'Server error during admin signup.' });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    // --- 1. Validation ---
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        // --- 2. Find User/Admin by email ---
        const admin = await User.findOne({ email }).select('+passwordHash');

        // --- 3. Check for existence and password match ---
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // --- 4. Generate Token ---
        const payload = {
            id: admin._id,
            role: admin.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // --- 5. Success Response ---
        // Exclude passwordHash before sending the user object back
        const { passwordHash: _, ...adminWithoutPassword } = admin.toObject();

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: adminWithoutPassword
        });

    } catch (err) {
        console.error('Admin Login Error:', err);
        return res.status(500).json({ success: false, message: 'Server error during admin login.' });
    }
};

// --- Password Management Functions (No changes required here as they only deal with password) ---

export const sendPasswordResetLink = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const user = await User.findOne({ email, role: 'admin' });

        if (!user) {
            // Send generic message to prevent email enumeration
            return res.status(200).json({ success: true, message: 'If an admin account with that email exists, a password reset link has been sent.' });
        }

        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const resetUrl = `${process.env.CLIENT_URL}/admin/reset-password/${resetToken}`;

        // NOTE: You must have the sendEmail utility correctly set up for this to work.
        // await sendEmail(user.email, subject, text, html); // Uncomment when ready

        return res.status(200).json({ success: true, message: 'If an admin account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Error in sendPasswordResetLink:', error);
        return res.status(500).json({ success: false, message: 'Failed to send password reset link. Please try again later.' });
    }
};


export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Both password fields are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Rely on Mongoose virtual/pre-save hook for password length validation
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user, ensuring they are an admin
        const user = await User.findOne({ _id: decoded.userId, role: 'admin' });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or token is invalid.' });
        }

        user.password = newPassword; // Mongoose virtual/pre-save hook will hash this
        await user.save();

        return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Reset link expired. Please request a new one.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ success: false, message: 'Invalid reset token. Please request a new one.' });
        }

        console.error('Error in resetPassword:', error);
        return res.status(500).json({ success: false, message: 'Failed to reset password. Please try again later.' });
    }
};


export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // `req.user` is populated by the authentication middleware (e.g., adminOnly)
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ success: false, message: "All password fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: "New password and confirm password do not match." });
    }

    try {
        // Find the user and explicitly select the passwordHash for comparison
        const user = await User.findById(userId).select('+passwordHash');
        if (!user) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect current password." });
        }

        // Update password (Mongoose virtual/pre-save hook will handle hashing)
        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully!" });

    } catch (error) {
        console.error("Error in changePassword:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        return res.status(500).json({ success: false, message: "Server error during password change." });
    }
};


// --- Profile Functions ---

export const getMe = async (req, res) => {
    // `req.user` is populated by the authentication middleware (e.g., adminOnly)
    const userId = req.user.id;

    try {
        // Find the user, explicitly excluding the passwordHash
        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get Me Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching admin profile." });
    }
};


export const updateProfile = async (req, res) => {
    const userId = req.user.id;
    // Destructure all possible updatable fields from the request body
    const { fullName, email, phone, address, city, country } = req.body;

    try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        // Handle email change validation
        if (email && email !== user.email) {
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail && String(existingUserWithEmail._id) !== String(userId)) {
                return res.status(400).json({ success: false, message: "Email already in use by another account." });
            }
        }

        // Update fields only if they are explicitly provided in the request body
        if (fullName !== undefined) user.fullName = fullName;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;       // NEW FIELD
        if (address !== undefined) user.address = address; // NEW FIELD
        if (city !== undefined) user.city = city;         // NEW FIELD
        if (country !== undefined) user.country = country; // NEW FIELD

        // Handle file upload
        if (req.file) {
            // Save relative path or full URL depending on how you serve statics.
            // Assuming '/uploads' static mount in app.js
            user.profileImage = `/uploads/${req.file.filename}`;
        }

        await user.save();

        const { passwordHash: _, ...adminWithoutPassword } = user.toObject();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            user: adminWithoutPassword
        });

    } catch (error) {
        console.error("Error in updateProfile:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation failed: ${messages.join(', ')}` });
        }
        return res.status(500).json({ success: false, message: "Server error during profile update." });
    }
};