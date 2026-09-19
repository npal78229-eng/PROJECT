const express = require('express');
const jwt = require('jsonwebtoken');
const sellerRouter = require('./src/routes/seller');

async function runSellerTests() {
  console.log('--- STARTING PHASE 7 SELLER DASHBOARD TEST SUITE ---');
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

  const sellerToken = jwt.sign(
    { id: 1, name: 'Official Seller', email: 'seller@test.com', role: 'seller' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    { id: 2, name: 'Regular Customer', email: 'customer@test.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const app = express();
  app.use(express.json());
  app.use('/api/seller', sellerRouter);

  const server = app.listen(5095);

  try {
    // Test 1: Customer role is denied with 403 Forbidden
    const deniedRes = await fetch('http://localhost:5095/api/seller/products', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(deniedRes.status === 403, 'Customer token is rejected from /api/seller with 403 Forbidden');

    // Test 2: Seller role can list own products
    const listRes = await fetch('http://localhost:5095/api/seller/products', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const sellerItems = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(sellerItems), 'Seller token successfully lists seller products');

    // Test 3: Seller creates a new product
    const createRes = await fetch('http://localhost:5095/api/seller/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'High-Precision Gaming Mouse',
        price: 59.99,
        stock: 30,
        category_id: 2,
        description: '25K DPI optical sensor with ultra-light honeycomb chassis.',
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'],
      }),
    });
    const createdProd = await createRes.json();
    assert(createRes.status === 201 && createdProd.id, 'Seller successfully creates new product with 201');

    // Test 4: Update product stock
    const updateRes = await fetch(`http://localhost:5095/api/seller/products/${createdProd.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({ stock: 55 }),
    });
    const updatedProd = await updateRes.json();
    assert(updateRes.status === 200 && updatedProd.stock === 55, 'Seller successfully updates stock to 55');

    // Test 5: Seller metrics stats
    const statsRes = await fetch('http://localhost:5095/api/seller/stats', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const stats = await statsRes.json();
    assert(stats.totalListings >= 1 && stats.totalUnits > 0, 'GET /api/seller/stats returns inventory aggregates');

    // Test 6: Delete created product
    const deleteRes = await fetch(`http://localhost:5095/api/seller/products/${createdProd.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(deleteRes.status === 204, 'DELETE /api/seller/products/:id deletes listing with 204 No Content');

    console.log(`\nSELLER DASHBOARD TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runSellerTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
