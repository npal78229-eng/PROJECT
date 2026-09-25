process.env.NODE_ENV = 'test';
const jwt = require('jsonwebtoken');
const app = require('./src/index');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_amazon_clone_2026';

async function runNewFeaturesTests() {
  console.log('--- STARTING NEW FEATURES TEST SUITE (WALLET, CHATBOT, MEDIA REVIEWS, SUPPORT, SETTINGS) ---');
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

  const server = app.listen(5093);
  const baseUrl = 'http://localhost:5093';
  const token = jwt.sign(
    { id: 77, name: 'Feature Tester', email: 'tester@example.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  try {
    // 1. Wallet Initial Balance ($250.00)
    const resW1 = await fetch(`${baseUrl}/api/wallet`, { headers: authHeaders });
    const w1 = await resW1.json();
    assert(resW1.status === 200 && w1.balance === 250, 'GET /api/wallet returns $250.00 initial balance');

    // 2. Wallet Add Funds (+$50.00 -> $300.00)
    const resW2 = await fetch(`${baseUrl}/api/wallet/add-funds`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 50, method: 'Visa Debit' }),
    });
    const w2 = await resW2.json();
    assert(resW2.status === 200 && w2.balance === 300, 'POST /api/wallet/add-funds increments balance to $300.00');

    // 3. Wallet Redeem Gift Code (AMAZON100 -> +$100 -> $400.00)
    const resW3 = await fetch(`${baseUrl}/api/wallet/redeem`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ code: 'AMAZON100' }),
    });
    const w3 = await resW3.json();
    assert(resW3.status === 200 && w3.balance === 400, 'POST /api/wallet/redeem applies AMAZON100 (+$100.00)');

    // 4. Order Checkout Paid via Amazon Wallet & Marked Delivered
    const resOrder = await fetch(`${baseUrl}/api/orders/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        paymentMethod: 'wallet',
        markDelivered: true,
        shippingAddress: { fullName: 'Feature Tester', city: 'Seattle' },
        cartItems: [{ id: 1, title: 'Headphones Pro', price: 199.99, quantity: 1 }],
      }),
    });
    const orderData = await resOrder.json();
    assert(
      resOrder.status === 201 &&
        orderData.status === 'delivered' &&
        orderData.walletBalance === 200.01,
      'POST /api/orders/confirm pays with Amazon Wallet ($200.01 left) & marks order DELIVERED'
    );

    // 5. Delivered Order Media Review (Photos + Videos + Comment)
    const resRev = await fetch(`${baseUrl}/api/products/1/reviews`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        rating: 5,
        comment: 'Delivered order review with unboxing photo and video clip!',
        photos: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
        videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
        order_id: orderData.orderId,
        verified_delivery: true,
      }),
    });
    const revData = await resRev.json();
    assert(
      resRev.status === 201 &&
        revData.review.photos.length === 1 &&
        revData.review.videos.length === 1 &&
        revData.review.verified_delivery === true,
      'POST /api/products/1/reviews saves customer photo, video clip, and verified_delivery badge'
    );

    // 6. AI Chatbot Assistant
    const resBot = await fetch(`${baseUrl}/api/support/chatbot`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'How do I check my wallet balance?' }),
    });
    const botData = await resBot.json();
    assert(
      resBot.status === 200 && botData.reply.includes('Wallet') && botData.actionLink?.path === '/wallet',
      'POST /api/support/chatbot responds with Wallet guidance and action link'
    );

    // 7. Customer Service Live Chat
    const resChat = await fetch(`${baseUrl}/api/support/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'My delivered item arrived damaged, need replacement', orderId: '948271' }),
    });
    const chatData = await resChat.json();
    assert(
      resChat.status === 201 && chatData.agentReply && chatData.agentReply.sender === 'agent',
      'POST /api/support/chat logs customer message and returns specialist response'
    );

    // 8. Request Call for Complaint
    const resCall = await fetch(`${baseUrl}/api/support/call-requests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        phone: '+1 (555) 987-6543',
        orderId: '948271',
        category: 'Defective / Damaged Product',
        urgency: 'Immediate Callback (< 2 mins)',
        complaintDetails: 'Left audio channel has static noise, requesting supervisor callback.',
      }),
    });
    const callData = await resCall.json();
    assert(
      resCall.status === 201 && callData.ticket?.id.startsWith('CALL-'),
      'POST /api/support/call-requests creates priority complaint callback ticket'
    );

    // 9. User Account & App Settings
    const resSet = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        defaultPaymentMethod: 'wallet',
        notifications: { orderDeliverySms: true, priceDropAlerts: true },
      }),
    });
    const setData = await resSet.json();
    assert(
      resSet.status === 200 && setData.settings.defaultPaymentMethod === 'wallet',
      'PUT /api/settings updates and persists user account & wallet preferences'
    );

    console.log(`\nNEW FEATURES TESTS RESULT: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runNewFeaturesTests();
