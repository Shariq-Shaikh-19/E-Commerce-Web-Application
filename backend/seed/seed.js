// Run with: npm run seed
// Creates an admin user (from .env SEED_ADMIN_EMAIL/PASSWORD) and sample products.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Over-ear headphones with active noise cancellation and 30-hour battery life.',
    price: 59.99,
    category: 'Electronics',
    stock: 50,
    image: 'https://via.placeholder.com/300x300?text=Headphones',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with blue switches, ideal for gaming and typing.',
    price: 89.99,
    category: 'Electronics',
    stock: 30,
    image: 'https://via.placeholder.com/300x300?text=Keyboard',
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Soft, breathable 100% cotton crew neck t-shirt. Available in multiple colors.',
    price: 14.99,
    category: 'Apparel',
    stock: 100,
    image: 'https://via.placeholder.com/300x300?text=T-Shirt',
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated 750ml bottle that keeps drinks cold for 24 hours or hot for 12.',
    price: 19.99,
    category: 'Home & Kitchen',
    stock: 75,
    image: 'https://via.placeholder.com/300x300?text=Water+Bottle',
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip 6mm thick yoga mat with carrying strap.',
    price: 24.99,
    category: 'Fitness',
    stock: 40,
    image: 'https://via.placeholder.com/300x300?text=Yoga+Mat',
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 ceramic mugs, 350ml each, dishwasher and microwave safe.',
    price: 22.5,
    category: 'Home & Kitchen',
    stock: 60,
    image: 'https://via.placeholder.com/300x300?text=Mug+Set',
  },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('Admin user already exists, skipping creation.');
    }

    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      const productsWithCreator = sampleProducts.map((p) => ({ ...p, createdBy: admin._id }));
      await Product.insertMany(productsWithCreator);
      console.log(`Inserted ${sampleProducts.length} sample products.`);
    } else {
      console.log(`Products collection already has ${existingCount} documents, skipping product seed.`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
