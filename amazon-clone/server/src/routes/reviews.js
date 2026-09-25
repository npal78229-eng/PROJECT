const router = require('express').Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// In-memory reviews store for resilient local testing (with photo & video support)
const inMemoryReviews = new Map();

// Sample starter reviews with verified delivered product photos & videos
inMemoryReviews.set(1, [
  {
    id: 101,
    product_id: 1,
    user_id: 2,
    user_name: 'Alex Johnson',
    rating: 5,
    comment: 'Delivered right on time! Attached unboxing photos and a video clip of the headphones. Exceptional sound quality and active noise cancellation!',
    verified_delivery: true,
    order_id: 948271,
    photos: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    ],
    videos: [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 102,
    product_id: 1,
    user_id: 3,
    user_name: 'Sarah Connor',
    rating: 5,
    comment: 'Comfortable memory foam ear cups, lasts all week on a single battery charge. Sharing a real photo from my desk setup!',
    verified_delivery: true,
    order_id: 948105,
    photos: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80',
    ],
    videos: [],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]);

// 1. Get reviews for a specific product
router.get('/', async (req, res) => {
  const productId = parseInt(req.params.productId, 10);

  try {
    const result = await pool.query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    if (result.rows.length) {
      return res.json(result.rows);
    }
  } catch (err) {
    console.warn('Database reviews query fallback:', err.message);
  }

  const reviews = inMemoryReviews.get(productId) || [];
  res.json(reviews);
});

// 2. Post a new review for a product (Supports Delivered Order Photos & Videos!)
router.post('/', authenticate, async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  const userId = req.user.id;
  const userName = req.user.name || 'Verified Customer';
  const {
    rating,
    comment,
    photos = [],
    videos = [],
    order_id = null,
    verified_delivery = true,
  } = req.body;

  const numRating = parseInt(rating, 10);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Review comment cannot be empty' });
  }

  const cleanPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const cleanVideos = Array.isArray(videos) ? videos.filter(Boolean) : [];

  try {
    const reviewResult = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, userId, numRating, comment.trim()]
    );

    const aggregate = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews
       WHERE product_id = $1`,
      [productId]
    );

    const avgRating = parseFloat(aggregate.rows[0].avg_rating);
    const totalReviews = parseInt(aggregate.rows[0].total_reviews, 10);

    await pool.query(
      `UPDATE products
       SET rating = $1, num_reviews = $2
       WHERE id = $3`,
      [avgRating, totalReviews, productId]
    );

    return res.status(201).json({
      review: {
        ...reviewResult.rows[0],
        user_name: userName,
        photos: cleanPhotos,
        videos: cleanVideos,
        order_id,
        verified_delivery: Boolean(verified_delivery),
      },
      updatedProduct: {
        id: productId,
        rating: avgRating,
        num_reviews: totalReviews,
      },
    });
  } catch (err) {
    console.warn('Database review insertion fallback:', err.message);

    const existing = inMemoryReviews.get(productId) || [];
    const newReview = {
      id: Math.floor(1000 + Math.random() * 9000),
      product_id: productId,
      user_id: userId,
      user_name: userName,
      rating: numRating,
      comment: comment.trim(),
      photos: cleanPhotos,
      videos: cleanVideos,
      order_id,
      verified_delivery: Boolean(verified_delivery),
      created_at: new Date().toISOString(),
    };

    existing.unshift(newReview);
    inMemoryReviews.set(productId, existing);

    const totalRating = existing.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = parseFloat((totalRating / existing.length).toFixed(1));
    const totalReviews = existing.length;

    return res.status(201).json({
      review: newReview,
      updatedProduct: {
        id: productId,
        rating: avgRating,
        num_reviews: totalReviews,
      },
    });
  }
});

module.exports = router;
