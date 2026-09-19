const express = require('express');
const productsRouter = require('./src/routes/products');

async function runProductTests() {
  console.log('--- STARTING PHASE 2 PRODUCT CATALOG TEST SUITE ---');
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

  const app = express();
  app.use(express.json());
  app.use('/api/products', productsRouter);

  const server = app.listen(5099);

  try {
    // Test 1: Fetch full products catalog
    const res1 = await fetch('http://localhost:5099/api/products');
    const catalog = await res1.json();
    assert(res1.status === 200 && Array.isArray(catalog) && catalog.length >= 10, 'Catalog returns 10+ items');

    // Test 2: Text search filtering (q=Headphones)
    const res2 = await fetch('http://localhost:5099/api/products?q=Headphones');
    const searchResults = await res2.json();
    assert(searchResults.length >= 1 && searchResults[0].title.includes('Headphones'), 'Search filters correctly on title keyword');

    // Test 3: Category filtering (category=2)
    const res3 = await fetch('http://localhost:5099/api/products?category=2');
    const catResults = await res3.json();
    assert(catResults.every((p) => String(p.category_id) === '2'), 'Category filter limits items to category_id 2');

    // Test 4: Price sort ascending
    const res4 = await fetch('http://localhost:5099/api/products?sort=price_asc');
    const ascResults = await res4.json();
    const isSortedAsc = ascResults.every((item, i) => i === 0 || parseFloat(item.price) >= parseFloat(ascResults[i - 1].price));
    assert(isSortedAsc, 'Sort price_asc properly orders lowest to highest');

    // Test 5: Single product lookup by ID
    const res5 = await fetch('http://localhost:5099/api/products/1');
    const singleProduct = await res5.json();
    assert(singleProduct.id === 1 && singleProduct.title.includes('Headphones'), 'Single product lookup GET /products/1 returns valid product');

    // Test 6: Non-existent product ID returns 404
    const res6 = await fetch('http://localhost:5099/api/products/99999');
    assert(res6.status === 404, 'Non-existent product ID returns 404 status');

    console.log(`\nPRODUCT CATALOG TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runProductTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
