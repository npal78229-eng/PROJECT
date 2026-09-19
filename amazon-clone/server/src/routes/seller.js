const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole(['seller', 'admin']));

// In-memory seller products store for fallback testing
const inMemorySellerProducts = new Map();

// Starter products for seller #1
inMemorySellerProducts.set(1, [
  {
    id: 1,
    seller_id: 1,
    title: 'Noise-Cancelling Wireless Headphones Pro',
    price: 199.99,
    stock: 42,
    category_id: 2,
    categoryName: 'Computers & Accessories',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 2,
    seller_id: 1,
    title: 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)',
    price: 749.99,
    stock: 20,
    category_id: 2,
    categoryName: 'Computers & Accessories',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
]);

// 1. Get products owned by the authenticated seller
router.get('/products', async (req, res) => {
  const sellerId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.seller_id = $1
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    if (result.rows.length) {
      return res.json(result.rows);
    }
  } catch (err) {
    console.warn('Database seller products query fallback:', err.message);
  }

  const items = inMemorySellerProducts.get(sellerId) || [];
  res.json(items);
});

// 2. Create product as seller
router.post('/products', async (req, res) => {
  const sellerId = req.user.id;
  const { title, description, price, stock, category_id, images } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ message: 'Title and price are required' });
  }

  const numPrice = parseFloat(price);
  const numStock = parseInt(stock || 0, 10);
  const imgArray = Array.isArray(images) && images.length
    ? images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'];

  try {
    const result = await pool.query(
      `INSERT INTO products (seller_id, category_id, title, description, price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sellerId, category_id || null, title, description || '', numPrice, numStock, imgArray]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.warn('Database seller product insertion fallback:', err.message);

    const newProd = {
      id: Math.floor(100 + Math.random() * 900),
      seller_id: sellerId,
      category_id: category_id || 1,
      title,
      description: description || '',
      price: numPrice,
      stock: numStock,
      images: imgArray,
      rating: 5.0,
      num_reviews: 0,
      created_at: new Date().toISOString(),
    };

    const currentList = inMemorySellerProducts.get(sellerId) || [];
    currentList.unshift(newProd);
    inMemorySellerProducts.set(sellerId, currentList);

    return res.status(201).json(newProd);
  }
});

// 3. Update seller product
router.put('/products/:id', async (req, res) => {
  const sellerId = req.user.id;
  const productId = parseInt(req.params.id, 10);
  const { title, description, price, stock, category_id, images } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category_id = COALESCE($5, category_id),
           images = COALESCE($6, images)
       WHERE id = $7 AND (seller_id = $8 OR $9 = 'admin')
       RETURNING *`,
      [title, description, price, stock, category_id, images, productId, sellerId, req.user.role]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.warn('Database seller product update fallback:', err.message);

    const currentList = inMemorySellerProducts.get(sellerId) || [];
    const item = currentList.find((p) => p.id === productId);
    if (!item) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    if (title !== undefined) item.title = title;
    if (price !== undefined) item.price = parseFloat(price);
    if (stock !== undefined) item.stock = parseInt(stock, 10);
    if (description !== undefined) item.description = description;

    return res.json(item);
  }
});

// 4. Delete seller product
router.delete('/products/:id', async (req, res) => {
  const sellerId = req.user.id;
  const productId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 AND (seller_id = $2 OR $3 = 'admin') RETURNING id`,
      [productId, sellerId, req.user.role]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    return res.status(204).send();
  } catch (err) {
    console.warn('Database seller product deletion fallback:', err.message);

    let currentList = inMemorySellerProducts.get(sellerId) || [];
    inMemorySellerProducts.set(sellerId, currentList.filter((p) => p.id !== productId));
    return res.status(204).send();
  }
});

// 5. Seller Statistics
router.get('/stats', async (req, res) => {
  const sellerId = req.user.id;
  const items = inMemorySellerProducts.get(sellerId) || [];
  const totalListings = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.stock, 0);

  res.json({
    totalListings,
    totalUnits,
    lowStockAlerts: items.filter((i) => i.stock < 10).length,
  });
});

module.exports = router;
