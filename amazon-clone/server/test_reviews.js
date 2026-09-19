const express = require('express');
const jwt = require('jsonwebtoken');
const reviewsRouter = require('./src/routes/reviews');

async function runReviewsTests() {
  console.log('--- STARTING PHASE 6 REVIEWS & RATINGS TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_amazon_clone_2026';
  const testToken = jwt.sign(
    { id: 202, name: 'Reviewer Jane', email: 'jane@test.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const app = express();
  app.use(express.json());
  app.use('/api/products/:productId/reviews', reviewsRouter);

  const server = app.listen(5096);

  try {
    // Test 1: Fetch existing reviews for product 1
    const getRes = await fetch('http://localhost:5096/api/products/1/reviews');
    const initialReviews = await getRes.json();
    assert(getRes.status === 200 && Array.isArray(initialReviews) && initialReviews.length >= 2, 'GET /api/products/1/reviews returns initial reviews array');

    // Test 2: Unauthenticated POST review returns 401
    const unauthPost = await fetch('http://localhost:5096/api/products/1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, comment: 'Awesome product!' }),
    });
    assert(unauthPost.status === 401, 'POST review without auth header returns 401');

    // Test 3: Invalid rating (< 1 or > 5) returns 400
    const invalidRating = await fetch('http://localhost:5096/api/products/1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ rating: 7, comment: 'Way too high rating' }),
    });
    assert(invalidRating.status === 400, 'POST review with rating > 5 returns 400');

    // Test 4: Post valid review
    const postRes = await fetch('http://localhost:5096/api/products/1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ rating: 5, comment: 'Mind-blowing bass and seamless pairing.' }),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201 && postData.review?.id, 'POST review successfully creates review with 201');
    assert(postData.updatedProduct?.rating >= 4.5, 'Recalculated average rating reflects 5-star submission');
    assert(postData.updatedProduct?.num_reviews === initialReviews.length + 1, 'Total review count increments by 1');

    // Test 5: Verify new review appears in GET list
    const updatedGet = await fetch('http://localhost:5096/api/products/1/reviews');
    const updatedList = await updatedGet.json();
    assert(updatedList.length === initialReviews.length + 1 && updatedList[0].comment.includes('Mind-blowing'), 'New review appears at top of review list');

    console.log(`\nREVIEWS & RATINGS TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runReviewsTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
