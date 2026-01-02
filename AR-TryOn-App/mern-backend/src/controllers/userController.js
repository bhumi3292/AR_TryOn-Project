import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Get profile error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, fullName, email, phone, address, city, country } = req.body;

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Email change check
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists && String(exists._id) !== String(userId)) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    return res.json({ success: true, user: userObj });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const saveAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, mobile, city, street } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only allow POST when there's no address yet
    if (user.deliveryAddress && user.deliveryAddress.fullName) {
      return res.status(400).json({ success: false, message: 'Delivery address already set. Use update endpoint.' });
    }

    user.deliveryAddress = { fullName, mobile, city, street };
    await user.save();
    const u = user.toObject(); delete u.passwordHash;
    return res.status(201).json({ success: true, user: u });
  } catch (err) {
    console.error('Save address error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, mobile, city, street } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.deliveryAddress = Object.assign({}, user.deliveryAddress || {}, { fullName, mobile, city, street });
    await user.save();
    const u = user.toObject(); delete u.passwordHash;
    return res.json({ success: true, user: u });
  } catch (err) {
    console.error('Update address error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const savePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { esewaId, khaltiId, defaultMethod } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Allow both create and overwrite via POST for convenience
    user.payment = { esewaId, khaltiId, defaultMethod: defaultMethod || 'none' };
    await user.save();
    const u = user.toObject(); delete u.passwordHash;
    return res.status(201).json({ success: true, user: u });
  } catch (err) {
    console.error('Save payment error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { esewaId, khaltiId, defaultMethod } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.payment = Object.assign({}, user.payment || {}, { esewaId, khaltiId, defaultMethod: defaultMethod || user.payment?.defaultMethod || 'none' });
    await user.save();
    const u = user.toObject(); delete u.passwordHash;
    return res.json({ success: true, user: u });
  } catch (err) {
    console.error('Update payment error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export default { getProfile, updateProfile };
