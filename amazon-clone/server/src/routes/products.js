const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// Default catalog fallback for initial local exploration
const FALLBACK_CATALOG = [
  {
    id: 1,
    seller_id: 1,
    category_id: 2,
    title: 'Noise-Cancelling Wireless Headphones Pro',
    description: 'Active noise cancellation with 40-hour battery life, spatial audio, and premium memory foam ear cushions.',
    price: '199.99',
    stock: 45,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    rating: '4.8',
    num_reviews: 128,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    seller_id: 1,
    category_id: 2,
    title: 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)',
    description: 'Lightweight aluminum unibody, vibrant FHD IPS display, blazing fast performance for productivity and coding.',
    price: '749.99',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    rating: '4.6',
    num_reviews: 94,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    seller_id: 1,
    category_id: 2,
    title: 'Ergonomic Wireless Mechanical Keyboard',
    description: 'Tactile hot-swappable switches with RGB backlighting and Bluetooth multi-device pairing.',
    price: '89.99',
    stock: 60,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    rating: '4.7',
    num_reviews: 72,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    seller_id: 1,
    category_id: 3,
    title: 'Smart Voice-Controlled Speaker with Alexa',
    description: 'Room-filling balanced audio with smart home automation hub built right in.',
    price: '49.99',
    stock: 150,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'],
    rating: '4.5',
    num_reviews: 310,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    seller_id: 1,
    category_id: 3,
    title: '4K Ultra HD Streaming Media Player',
    description: 'Cinematic 4K streaming with Dolby Vision, HDR10+, and Wi-Fi 6 support.',
    price: '39.99',
    stock: 85,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
    rating: '4.4',
    num_reviews: 215,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    seller_id: 1,
    category_id: 4,
    title: 'Men\'s Classic Waterproof Winter Parka',
    description: 'Windproof and water-resistant winter coat with faux-fur lined hood and fleece insulation.',
    price: '119.50',
    stock: 35,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce667823?w=800&q=80'],
    rating: '4.3',
    num_reviews: 56,
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    seller_id: 1,
    category_id: 4,
    title: 'Premium Leather Minimalist Slim Wallet',
    description: 'RFID-blocking slim front-pocket bifold crafted from genuine full-grain leather.',
    price: '29.99',
    stock: 110,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'],
    rating: '4.7',
    num_reviews: 189,
    created_at: new Date().toISOString(),
  },
  {
    id: 8,
    seller_id: 1,
    category_id: 5,
    title: 'Programmable Stainless Steel Coffee Maker',
    description: 'Brew up to 12 cups of fresh coffee with programmable 24-hour timer and auto-pause.',
    price: '69.99',
    stock: 40,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80'],
    rating: '4.6',
    num_reviews: 88,
    created_at: new Date().toISOString(),
  },
  {
    id: 9,
    seller_id: 1,
    category_id: 5,
    title: 'Non-Stick Ceramic Cookware Set (10-Piece)',
    description: 'Toxin-free nonstick pots and pans set suitable for induction, gas, and electric stovetops.',
    price: '149.00',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1584990347449-37ec0e3c5443?w=800&q=80'],
    rating: '4.8',
    num_reviews: 64,
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    seller_id: 1,
    category_id: 6,
    title: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to the architecture, storage engines, distributed consensus, and scalability of modern databases.',
    price: '38.50',
    stock: 75,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'],
    rating: '4.9',
    num_reviews: 430,
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    seller_id: 1,
    category_id: 6,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'A must-read handbook of agile software engineering principles, patterns, and refactoring techniques.',
    price: '42.00',
    stock: 50,
    images: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&q=80'],
    rating: '4.7',
    num_reviews: 312,
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    seller_id: 1,
    category_id: 2,
    title: '27-inch 4K UHD IPS Designer Monitor',
    description: 'Ultra-sharp 3840x2160 resolution with 99% sRGB color accuracy and USB-C 65W power delivery.',
    price: '349.99',
    stock: 18,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
    rating: '4.6',
    num_reviews: 83,
    created_at: new Date().toISOString(),
  },
];

// 1. List + search + filter + sort + pagination
router.get('/', async (req, res) => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

  try {
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
      values.push(parseInt(category, 10));
      i++;
    }
    if (minPrice) {
      conditions.push(`price >= $${i}`);
      values.push(parseFloat(minPrice));
      i++;
    }
    if (maxPrice) {
      conditions.push(`price <= $${i}`);
      values.push(parseFloat(maxPrice));
      i++;
    }

    let orderBy = 'created_at DESC';
    if (sort === 'price_asc') orderBy = 'price ASC';
    else if (sort === 'price_desc') orderBy = 'price DESC';
    else if (sort === 'rating') orderBy = 'rating DESC';
    else if (sort === 'reviews') orderBy = 'num_reviews DESC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    values.push(parseInt(limit, 10), offset);

    const result = await pool.query(
      `SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i++}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    // Graceful fallback to seeded catalogue if DB is initializing
    console.warn('Database query fallback on products route:', err.message);

    let filtered = [...FALLBACK_CATALOG];
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.description.toLowerCase().includes(q.toLowerCase())
      );
    }
    if (category) {
      filtered = filtered.filter((p) => String(p.category_id) === String(category));
    }
    if (minPrice) {
      filtered = filtered.filter((p) => parseFloat(p.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => parseFloat(p.price) <= parseFloat(maxPrice));
    }

    if (sort === 'price_asc') filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sort === 'price_desc') filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else if (sort === 'rating') filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    res.json(filtered.slice(offset, offset + parseInt(limit, 10)));
  }
});

// 2. Single product detail
router.get('/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (result.rows[0]) {
      return res.json(result.rows[0]);
    }
  } catch (err) {
    console.warn('Database single product lookup fallback:', err.message);
  }

  const fallback = FALLBACK_CATALOG.find((p) => p.id === productId);
  if (fallback) return res.json(fallback);

  res.status(404).json({ message: 'Product not found' });
});

// 3. Create product (Seller only)
router.post('/', authenticate, requireRole(['seller', 'admin']), async (req, res) => {
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

// 4. Update product (Seller owner or Admin)
router.put('/:id', authenticate, requireRole(['seller', 'admin']), async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const { title, description, price, stock, category_id, images } = req.body;

  try {
    const check = await pool.query('SELECT seller_id FROM products WHERE id = $1', [productId]);
    if (!check.rows[0]) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && check.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own products' });
    }

    const result = await pool.query(
      `UPDATE products
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category_id = COALESCE($5, category_id),
           images = COALESCE($6, images)
       WHERE id = $7 RETURNING *`,
      [title, description, price, stock, category_id, images, productId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Product update error:', err);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// 5. Delete product (Seller owner or Admin)
router.delete('/:id', authenticate, requireRole(['seller', 'admin']), async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const check = await pool.query('SELECT seller_id FROM products WHERE id = $1', [productId]);
    if (!check.rows[0]) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && check.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own products' });
    }

    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    res.status(204).send();
  } catch (err) {
    console.error('Product delete error:', err);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;
