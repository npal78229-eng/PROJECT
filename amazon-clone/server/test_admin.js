const express = require('express');
const jwt = require('jsonwebtoken');
const adminRouter = require('./src/routes/admin');

async function runAdminTests() {
  console.log('--- STARTING PHASE 8 ADMIN DASHBOARD TEST SUITE ---');
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

  const adminToken = jwt.sign(
    { id: 999, name: 'System Administrator', email: 'admin@amazonclone.com', role: 'admin' },
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
  app.use('/api/admin', adminRouter);

  const server = app.listen(5094);

  try {
    // Test 1: Non-admin role is rejected with 403
    const deniedRes = await fetch('http://localhost:5094/api/admin/overview', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(deniedRes.status === 403, 'Customer token is rejected from /api/admin with 403 Forbidden');

    // Test 2: Admin can fetch platform overview KPIs
    const overviewRes = await fetch('http://localhost:5094/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stats = await overviewRes.json();
    assert(overviewRes.status === 200 && stats.totalRevenue > 0 && stats.totalOrders > 0, 'GET /api/admin/overview returns KPI stats');

    // Test 3: Admin can list platform users
    const usersRes = await fetch('http://localhost:5094/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userList = await usersRes.json();
    assert(usersRes.status === 200 && Array.isArray(userList) && userList.length >= 2, 'GET /api/admin/users returns registered users list');

    // Test 4: Admin can list all orders
    const ordersRes = await fetch('http://localhost:5094/api/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderList = await ordersRes.json();
    assert(ordersRes.status === 200 && Array.isArray(orderList) && orderList.length >= 1, 'GET /api/admin/orders returns orders list');

    // Test 5: Admin updates order status to 'delivered'
    const statusRes = await fetch('http://localhost:5094/api/admin/orders/100234/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'delivered' }),
    });
    const updatedOrder = await statusRes.json();
    assert(statusRes.status === 200 && updatedOrder.status === 'delivered', 'PATCH /api/admin/orders/:id/status updates order status');

    // Test 6: Invalid status is rejected with 400
    const invalidStatus = await fetch('http://localhost:5094/api/admin/orders/100234/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'bogus_status' }),
    });
    assert(invalidStatus.status === 400, 'Invalid order status is rejected with 400 Bad Request');

    console.log(`\nADMIN DASHBOARD TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runAdminTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
