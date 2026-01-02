import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seedUsers = async () => {
    try {
        await connectDB();
        console.log('🌱 Connected to DB for Seeding...');

        const users = [
            {
                name: "Demo Seller",
                email: "seller@arjewels.com",
                password: "password123", // The model pre-save hook will hash this
                role: "SELLER",
                phone: "9800000001",
                address: "Kathmandu, Nepal",
                city: "Kathmandu",
                country: "Nepal"
            },
            {
                name: "Demo Buyer",
                email: "buyer@arjewels.com",
                password: "password123",
                role: "BUYER",
                phone: "9800000002",
                address: "Lalitpur, Nepal",
                city: "Lalitpur",
                country: "Nepal",
                deliveryAddress: {
                    fullName: "Demo Buyer",
                    mobile: "9800000002",
                    city: "Lalitpur",
                    street: "Kupondole"
                }
            }
        ];

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                console.log(`⚠️ User ${u.email} already exists. Skipping...`);
            } else {
                const newUser = new User(u);
                await newUser.save();
                console.log(`✅ Created user: ${u.email} (${u.role})`);
            }
        }

        console.log('\n🎉 Seeding Complete! Use these credentials:');
        console.table(users.map(u => ({ Email: u.email, Password: 'password123', Role: u.role })));

        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedUsers();
