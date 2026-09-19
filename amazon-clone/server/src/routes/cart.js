const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get cart items for logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id AS cart_item_id, c.quantity, p.id, p.title, p.price, p.stock, p.images
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// Add or increment item in cart
router.post('/', async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: 'product_id is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [req.user.id, product_id, quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// Remove item from cart
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.status(204).send();
  } catch (err) {
    console.error('Cart delete error:', err);
    res.status(500).json({ message: 'Server error deleting cart item' });
  }
});

module.exports = router;
