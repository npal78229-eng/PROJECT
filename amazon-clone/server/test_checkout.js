const express = require('express');
const jwt = require('jsonwebtoken');
const ordersRouter = require('./src/routes/orders');

async function runCheckoutTests() {
  console.log('--- STARTING PHASE 4 CHECKOUT & ATOMIC STOCK TEST SUITE ---');
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
    { id: 101, name: 'Checkout Buyer', email: 'buyer@test.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const app = express();
  app.use(express.json());
  app.use('/api/orders', ordersRouter);

  const server = app.listen(5097);

  try {
    // Test 1: Checkout with empty cart returns 400
    const emptyCheckout = await fetch('http://localhost:5097/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ cartItems: [] }),
    });
    assert(emptyCheckout.status === 400, 'POST /api/orders/checkout rejects empty cart with 400');

    // Test 2: Checkout with 3 headphones returns client secret and total
    const validCheckout = await fetch('http://localhost:5097/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        cartItems: [{ id: 1, title: 'Headphones Pro', price: 199.99, quantity: 3, stock: 45 }],
      }),
    });
    const checkoutData = await validCheckout.json();
    assert(validCheckout.status === 200 && checkoutData.clientSecret, 'POST /api/orders/checkout returns clientSecret');
    assert(checkoutData.total === 599.97, 'Total calculation matches price * quantity (599.97)');

    // Test 3: Confirm order and decrement stock
    const confirmRes = await fetch('http://localhost:5097/api/orders/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        paymentIntentId: 'pi_test_12345',
        shippingAddress: { line1: '123 Test St', city: 'Tech City' },
        cartItems: [{ id: 1, title: 'Headphones Pro', price: 199.99, quantity: 3 }],
      }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 201 && confirmData.orderId, 'POST /api/orders/confirm creates order with 201');

    // Test 4: Verify stock decremented (45 - 3 = 42)
    const stockRes = await fetch('http://localhost:5097/api/orders/inventory/1', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const stockData = await stockRes.json();
    assert(stockData.stock === 42, 'Stock atomically dropped from 45 to 42');

    // Test 5: Overselling rejection
    const oversellRes = await fetch('http://localhost:5097/api/orders/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        cartItems: [{ id: 1, title: 'Headphones Pro', price: 199.99, quantity: 100 }],
      }),
    });
    assert(oversellRes.status === 400, 'Order confirmation rejects request when requested quantity exceeds available stock');

    // Test 6: Verify placed order in /my-orders
    const ordersRes = await fetch('http://localhost:5097/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const myOrders = await ordersRes.json();
    assert(myOrders.length >= 1 && myOrders[0].id === confirmData.orderId, 'GET /api/orders/my-orders returns placed order');

    console.log(`\nCHECKOUT & INVENTORY TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runCheckoutTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
