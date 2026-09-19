const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// List + search + filter + pagination
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(title ILIKE $${i} OR description ILIKE $${i})`);
      values.push(`%${q}%`);
      i++;
    }
    if (category) {
      conditions.push(`category_id = $${i}`);
      values.push(category);
      i++;
    }
    if (minPrice) {
      conditions.push(`price >= $${i}`);
      values.push(minPrice);
      i++;
    }
    if (maxPrice) {
      conditions.push(`price <= $${i}`);
      values.push(maxPrice);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    values.push(parseInt(limit, 10), offset);

    const result = await pool.query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
});

// Single product detail
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ message: 'Server error retrieving product' });
  }
});

// Create product (Seller only)
router.post('/', authenticate, requireRole('seller'), async (req, res) => {
  const { title, description, price, stock, category_id, images } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ message: 'Title and price are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (seller_id, category_id, title, description, price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, category_id || null, title, description || '', price, stock || 0, images || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

module.exports = router;
