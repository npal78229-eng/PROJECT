const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function runAuthTests() {
  console.log('--- STARTING PHASE 1 AUTH TEST SUITE ---');
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
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development_jwt_refresh_secret_key_amazon_clone_2026';

  // Test 1: Password hashing and comparison
  const rawPassword = 'SecurePassword123!';
  const hash = await bcrypt.hash(rawPassword, 10);
  assert(await bcrypt.compare(rawPassword, hash), 'Bcrypt correctly verifies hashed password');
  assert(!(await bcrypt.compare('WrongPassword', hash)), 'Bcrypt correctly rejects invalid password');

  // Test 2: JWT generation and verification
  const testUser = { id: 42, name: 'Alice Smith', email: 'alice@example.com', role: 'customer' };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.id === 42 && decoded.role === 'customer', 'JWT verifies and retains user payload');

  // Test 3: JWT rejection with invalid secret
  try {
    jwt.verify(token, 'invalid_secret_key');
    assert(false, 'JWT should throw with invalid secret');
  } catch (err) {
    assert(err.name === 'JsonWebTokenError', 'JWT properly throws JsonWebTokenError on invalid signature');
  }

  // Test 4: Refresh token lifecycle
  const refreshToken = jwt.sign({ id: testUser.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  const refreshDecoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  assert(refreshDecoded.id === 42, 'Refresh token verifies with refresh secret');

  // Test 5: Role checker logic
  const requireRole = (roles) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (userRole) => allowed.includes(userRole);
  };
  const isSellerOrAdmin = requireRole(['seller', 'admin']);
  assert(isSellerOrAdmin('seller'), 'Role checker permits seller');
  assert(isSellerOrAdmin('admin'), 'Role checker permits admin');
  assert(!isSellerOrAdmin('customer'), 'Role checker denies customer for seller-only route');

  console.log(`\nAUTH TESTS RESULT: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runAuthTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
