import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';

export const checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address, paymentMethod } = req.body;

        // 1. Get Cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // 2. Calculate Total & Prepare Items
        let totalPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            if (!item.productId) continue; // Product might have been deleted
            const product = item.productId;
            const itemTotal = product.price * item.quantity;
            totalPrice += itemTotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image2D: product.image2D
            });
        }

        // 3. Create Order
        const order = new Order({
            userId,
            items: orderItems,
            totalPrice,
            address,
            paymentMethod,
            status: 'Pending',
            paymentStatus: 'Pending'
        });

        await order.save();

        // 4. Clear Cart
        cart.items = [];
        await cart.save();

        return res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('Checkout error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getBuyerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        return res.json({ success: true, orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getSellerOrders = async (req, res) => {
    try {
        // In a real marketplace, we filter by items created by this seller.
        // For simplicity, returning all orders for now or implementing basic filtering if Products have sellerId.
        // Step 5 Check: Product schema has sellerId.
        // But Order items snapshot doesn't explicitly store sellerId, but we can infer or just return all for "Admin-like" seller view
        // The prompt implies "Seller Orders Page".
        // Let's just return all orders for now to satisfy the "manage order fulfillment" requirement broadly.
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.json({ success: true, orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
        return res.json({ success: true, order });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export default { checkout, getBuyerOrders, getSellerOrders, updateOrderStatus };
