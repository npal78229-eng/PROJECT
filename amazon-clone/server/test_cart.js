const express = require('express');
const jwt = require('jsonwebtoken');
const cartRouter = require('./src/routes/cart');

async function runCartTests() {
  console.log('--- STARTING PHASE 3 CART & PERSISTENCE TEST SUITE ---');
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
    { id: 99, name: 'Cart Tester', email: 'cart@test.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const app = express();
  app.use(express.json());
  app.use('/api/cart', cartRouter);

  const server = app.listen(5098);

  try {
    // Test 1: Unauthenticated request to cart is rejected with 401
    const unauthRes = await fetch('http://localhost:5098/api/cart');
    assert(unauthRes.status === 401, 'Unauthenticated request to GET /api/cart is rejected with 401');

    // Test 2: Add item to cart with valid token
    const addRes = await fetch('http://localhost:5098/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ product_id: 1, quantity: 2, itemData: { title: 'Headphones', price: '199.99' } }),
    });
    assert(addRes.status === 200, 'POST /api/cart adds item successfully with 200 status');

    // Test 3: Fetch user's cart
    const fetchRes = await fetch('http://localhost:5098/api/cart', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const cartItems = await fetchRes.json();
    assert(Array.isArray(cartItems) && cartItems.length === 1 && cartItems[0].quantity === 2, 'GET /api/cart retrieves added cart items with correct quantity');

    // Test 4: Update item quantity via PATCH
    const patchRes = await fetch('http://localhost:5098/api/cart/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ quantity: 5 }),
    });
    assert(patchRes.status === 200, 'PATCH /api/cart/1 updates item quantity to 5');

    // Verify quantity updated
    const verifyRes = await fetch('http://localhost:5098/api/cart', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const updatedCart = await verifyRes.json();
    assert(updatedCart[0].quantity === 5, 'Verified updated quantity is 5 in cart');

    // Test 5: Delete item from cart
    const deleteRes = await fetch('http://localhost:5098/api/cart/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(deleteRes.status === 204, 'DELETE /api/cart/1 deletes item with 204 No Content');

    // Verify cart is empty
    const emptyRes = await fetch('http://localhost:5098/api/cart', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const emptyCart = await emptyRes.json();
    assert(emptyCart.length === 0, 'Cart is confirmed empty after deletion');

    console.log(`\nCART & PERSISTENCE TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runCartTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
