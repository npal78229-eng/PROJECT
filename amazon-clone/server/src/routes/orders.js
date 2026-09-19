const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

router.use(authenticate);

// 1. Create a payment intent from cart items
router.post('/checkout', async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT c.quantity, p.id, p.price, p.stock
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (!cart.rows.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const item of cart.rows) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          message: `Insufficient stock for product ID ${item.id}. Available: ${item.stock}`,
        });
      }
    }

    const total = cart.rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    let clientSecret = 'mock_stripe_client_secret_for_local_testing';
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // cents
        currency: 'usd',
        metadata: { userId: req.user.id },
      });
      clientSecret = paymentIntent.client_secret;
    }

    res.json({ clientSecret, total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    console.error('Checkout payment intent error:', err);
    res.status(500).json({ message: 'Error creating checkout intent', error: err.message });
  }
});

// 2. Confirm order after payment succeeds (Atomic Transaction)
router.post('/confirm', async (req, res) => {
  const { paymentIntentId = 'offline_paid', shippingAddress = {} } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cart = await client.query(
      `SELECT c.quantity, p.id, p.price, p.stock
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (!cart.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const item of cart.rows) {
      if (item.quantity > item.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for product ${item.id}. Available: ${item.stock}`,
        });
      }
    }

    const total = cart.rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_intent_id)
       VALUES ($1, $2, 'paid', $3, $4)
       RETURNING id`,
      [req.user.id, total, JSON.stringify(shippingAddress), paymentIntentId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );

      // Atomically decrement stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    // Clear cart after successful checkout
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');
    res.status(201).json({ orderId, total, status: 'paid' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order confirmation transaction error:', err);
    res.status(500).json({ message: 'Order transaction failed', error: err.message });
  } finally {
    client.release();
  }
});

// 3. User past order history
router.get('/my-orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.shipping_address, o.created_at,
              COALESCE(json_agg(json_build_object(
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'price', oi.price_at_purchase,
                'title', p.title,
                'images', p.images
              )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch my-orders error:', err);
    res.status(500).json({ message: 'Server error retrieving orders' });
  }
});

module.exports = router;
