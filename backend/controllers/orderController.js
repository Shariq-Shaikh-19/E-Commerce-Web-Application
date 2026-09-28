const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create new order (checkout) - validates stock & recalculates total server-side
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
  }
  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: 'Shipping address is required' });
  }

  const requiredAddressFields = ['fullName', 'address', 'city', 'postalCode', 'country'];
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field]) {
      return res.status(400).json({ success: false, message: `Shipping address field missing: ${field}` });
    }
  }

  const session = await mongoose.startSession();
  try {
    let orderItems = [];
    let totalAmount = 0;

    await session.withTransaction(async () => {
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          throw Object.assign(new Error(`Product not found: ${item.product}`), { statusCode: 404 });
        }
        if (product.stock < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`), {
            statusCode: 400,
          });
        }

        product.stock -= item.quantity;
        await product.save({ session });

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });
        totalAmount += product.price * item.quantity;
      }

      const order = await Order.create(
        [
          {
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            totalAmount,
            status: 'pending',
          },
        ],
        { session }
      );

      res.status(201).json({ success: true, data: order[0] });
    });
  } finally {
    session.endSession();
  }
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, data: orders });
});

// @desc    Get single order (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }
  res.json({ success: true, data: order });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, data: orders });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = status;
  await order.save();

  res.json({ success: true, data: order });
});

module.exports = { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus };
