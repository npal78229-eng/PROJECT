const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// In-memory session cart store for resilient local testing if PostgreSQL client is offline
const inMemoryCarts = new Map();
router.inMemoryCarts = inMemoryCarts;

// 1. Get cart items for logged-in user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT c.id AS cart_item_id, c.quantity, p.id, p.title, p.price, p.stock, p.images
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.warn('Database cart fetch fallback:', err.message);
    const userCart = inMemoryCarts.get(userId) || [];
    res.json(userCart);
  }
});

// 2. Add or increment item in cart
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const product_id = req.body.product_id || req.body.productId;
  const quantity = req.body.quantity || 1;
  const itemData = req.body.itemData;

  if (!product_id) {
    return res.status(400).json({ message: 'product_id is required' });
  }

  const numQty = parseInt(quantity, 10);

  try {
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [userId, product_id, numQty]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.warn('Database cart upsert fallback:', err.message);
    let userCart = inMemoryCarts.get(userId) || [];
    const existingIndex = userCart.findIndex((item) => String(item.id) === String(product_id));

    if (existingIndex >= 0) {
      userCart[existingIndex].quantity += numQty;
      if (userCart[existingIndex].quantity <= 0) {
        userCart.splice(existingIndex, 1);
      }
    } else if (numQty > 0) {
      userCart.push({
        id: product_id,
        title: itemData?.title || `Product #${product_id}`,
        price: itemData?.price || '99.99',
        stock: itemData?.stock || 50,
        images: itemData?.images || ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
        quantity: numQty,
      });
    }

    inMemoryCarts.set(userId, userCart);
    res.json({ user_id: userId, product_id, quantity: numQty, status: 'ok' });
  }
});

// 3. Update exact quantity in cart
router.patch('/:productId', async (req, res) => {
  const userId = req.user.id;
  const productId = parseInt(req.params.productId, 10);
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ message: 'quantity is required' });
  }

  const numQty = parseInt(quantity, 10);

  if (numQty <= 0) {
    try {
      await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
      return res.status(204).send();
    } catch (err) {
      let userCart = inMemoryCarts.get(userId) || [];
      inMemoryCarts.set(userId, userCart.filter((item) => item.id !== productId));
      return res.status(204).send();
    }
  }

  try {
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *`,
      [numQty, userId, productId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.warn('Database cart patch fallback:', err.message);
    let userCart = inMemoryCarts.get(userId) || [];
    const item = userCart.find((i) => i.id === productId);
    if (item) {
      item.quantity = numQty;
      res.json(item);
    } else {
      res.status(404).json({ message: 'Item not in cart' });
    }
  }
});

// 4. Remove item from cart
router.delete('/:productId', async (req, res) => {
  const userId = req.user.id;
  const productId = parseInt(req.params.productId, 10);

  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    res.status(204).send();
  } catch (err) {
    console.warn('Database cart delete fallback:', err.message);
    let userCart = inMemoryCarts.get(userId) || [];
    inMemoryCarts.set(
      userId,
      userCart.filter((item) => item.id !== productId)
    );
    res.status(204).send();
  }
});

module.exports = router;
