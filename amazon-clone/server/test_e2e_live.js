process.env.NODE_ENV = 'test';
const app = require('./src/index');

async function testFullLiveFlow() {
  console.log('=====================================================');
  console.log('   AMAZON CLONE: COMPLETE END-TO-END LIVE FLOW TEST  ');
  console.log('=====================================================');

  const server = app.listen(5000);
  let passed = 0;
  let failed = 0;

  function assert(condition, stepName) {
    if (condition) {
      console.log(`  ✓ [PASSED] ${stepName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAILED] ${stepName}`);
      failed++;
    }
  }

  try {
    const baseUrl = 'http://localhost:5000';

    // 1. Health Check (Phase 0)
    const resHealth = await fetch(`${baseUrl}/`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.status === 'ok', 'Step 1: Health Check GET / returns { status: "ok" }');

    // 2. Product Catalog (Phase 2)
    const resProducts = await fetch(`${baseUrl}/api/products`);
    const products = await resProducts.json();
    assert(resProducts.status === 200 && products.length >= 10, `Step 2: GET /api/products returns ${products.length} products`);

    // 3. Single Product Lookup (Phase 2)
    const resProduct1 = await fetch(`${baseUrl}/api/products/1`);
    const product1 = await resProduct1.json();
    assert(resProduct1.status === 200 && product1.id === 1, `Step 3: GET /api/products/1 returns "${product1.title}"`);

    // 4. User Registration (Phase 1)
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const resReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Customer', email: uniqueEmail, password: 'SecurePassword123' }),
    });
    const regData = await resReg.json();
    assert(resReg.status === 201 && regData.accessToken, 'Step 4: POST /api/auth/register creates account & issues token');
    const token = regData.accessToken;

    // 5. User Profile / Authentication Check (Phase 1)
    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await resMe.json();
    assert(resMe.status === 200 && meData.email === uniqueEmail, 'Step 5: GET /api/auth/me rehydrates user profile');

    // 6. Add to Cart (Phase 3)
    const resAddCart = await fetch(`${baseUrl}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: 1, quantity: 2 }),
    });
    const cartItem = await resAddCart.json();
    assert(resAddCart.status === 200 && cartItem.quantity === 2, 'Step 6: POST /api/cart adds item to server-side cart');

    // 7. View Cart (Phase 3)
    const resGetCart = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cartItems = await resGetCart.json();
    assert(resGetCart.status === 200 && cartItems.length >= 1, `Step 7: GET /api/cart retrieves ${cartItems.length} cart items`);

    // 8. Stripe Payment Intent Creation (Phase 4)
    const resCheckout = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shippingAddress: '123 Main St, New York, NY' }),
    });
    const checkoutData = await resCheckout.json();
    assert(resCheckout.status === 200 && checkoutData.clientSecret, 'Step 8: POST /api/orders/checkout creates Stripe PaymentIntent');

    // 9. Atomic Order Confirmation & Inventory Decrement (Phase 4 & 5)
    const initialStock = product1.stock;
    const resConfirm = await fetch(`${baseUrl}/api/orders/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentIntentId: checkoutData.paymentIntentId || 'pi_test_live',
        shippingAddress: '123 Main St, New York, NY',
      }),
    });
    const orderData = await resConfirm.json();
    assert(resConfirm.status === 201 && orderData.id, `Step 9: POST /api/orders/confirm placed order #${orderData.id}`);

    // Check stock was decremented
    const resProductCheck = await fetch(`${baseUrl}/api/products/1`);
    const product1After = await resProductCheck.json();
    assert(product1After.stock < initialStock, `Step 10: Stock atomically decremented from ${initialStock} to ${product1After.stock}`);

    // 11. View Order History (Phase 5)
    const resOrders = await fetch(`${baseUrl}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userOrders = await resOrders.json();
    assert(resOrders.status === 200 && userOrders.length >= 1, `Step 11: GET /api/orders/my-orders shows ${userOrders.length} placed order(s)`);

    // 12. Submit Review & Rating (Phase 6)
    const resReview = await fetch(`${baseUrl}/api/products/1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: 5, comment: 'Exceptional product quality, highly recommend!' }),
    });
    const reviewData = await resReview.json();
    assert(resReview.status === 201 && reviewData.rating === 5, 'Step 12: POST /api/products/1/reviews submits 5-star rating');

    console.log('=====================================================');
    console.log(`TOTAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('=====================================================');
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    server.close();
  }
}

testFullLiveFlow();
