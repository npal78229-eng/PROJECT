const router = require('express').Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_amazon_clone_2026';

// Optional auth helper so both guests and logged-in users can use chatbot & support
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      req.user = { id: 'guest', name: 'Valued Customer' };
    }
  } else {
    req.user = { id: 'guest', name: 'Valued Customer' };
  }
  next();
}

router.use(optionalAuth);

const inMemorySupportChats = new Map();
const inMemoryCallRequests = new Map();

function getUserChats(userId) {
  const key = String(userId);
  if (!inMemorySupportChats.has(key)) {
    inMemorySupportChats.set(key, [
      {
        id: 'msg_welcome',
        sender: 'agent',
        agentName: 'Maya (Senior Customer Care Specialist)',
        text: 'Hello! Welcome to Amazon Clone 24/7 Customer Service. I can help you with order delivery issues, refunds, damaged item complaints, Amazon Pay Wallet inquiries, or escalate your case for an instant phone callback. How can I help you today?',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ]);
  }
  return inMemorySupportChats.get(key);
}

function getUserCallRequests(userId) {
  const key = String(userId);
  if (!inMemoryCallRequests.has(key)) {
    inMemoryCallRequests.set(key, [
      {
        id: 'CALL-84920',
        phone: '+1 (555) 234-5678',
        orderId: '948271',
        category: 'Late Delivery / Package Tracking',
        urgency: 'High — Call within 5 minutes',
        preferredTime: 'Immediate Callback',
        complaintDetails: 'Package was marked out for delivery yesterday, requesting status update from carrier.',
        assignedAgent: 'David R. (Escalations Lead)',
        status: 'Agent Assigned — Calling Shortly',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ]);
  }
  return inMemoryCallRequests.get(key);
}

// 1. AI Shopping & Support Chatbot Endpoint
router.post('/chatbot', (req, res) => {
  const { message = '' } = req.body;
  const lower = message.toLowerCase();

  let reply = '';
  let suggestions = [];
  let actionLink = null;

  if (lower.includes('order') || lower.includes('track') || lower.includes('deliver')) {
    reply =
      '📦 You can track your orders and delivery status on the **Returns & Orders** page. Once an order is marked **DELIVERED**, you can click **"Post Photo / Video Review"** directly on your order card to upload product photos and videos with your comment!';
    suggestions = ['Go to My Orders', 'How to upload video review?', 'Report late delivery'];
    actionLink = { label: 'Open Your Orders', path: '/orders' };
  } else if (lower.includes('wallet') || lower.includes('balance') || lower.includes('promo') || lower.includes('pay')) {
    reply =
      '💳 Your **Amazon Pay Wallet** comes pre-loaded with **$250.00** for instant 1-click checkout! You can top up funds anytime or redeem promo codes **`AMAZON100`** (+$100), **`WELCOME50`** (+$50), or **`BONUS25`** (+$25) on the Wallet page.';
    suggestions = ['Open Amazon Wallet', 'Use promo code AMAZON100', 'Pay with Wallet at Checkout'];
    actionLink = { label: 'Open Amazon Pay Wallet', path: '/wallet' };
  } else if (lower.includes('compare') || lower.includes('comparison') || lower.includes('vs') || lower.includes('difference')) {
    reply =
      '⚖️ You can compare up to **4 products side-by-side** (price, star ratings, stock, warranty, and technical specs) using our **Product Comparison** tool! Click the "Compare" button on any product card or visit the Compare page directly.';
    suggestions = ['Open Product Comparison', 'Best headphones vs earbuds', 'Top laptops under $800'];
    actionLink = { label: 'Compare Products Now', path: '/compare' };
  } else if (lower.includes('call') || lower.includes('complaint') || lower.includes('agent') || lower.includes('human') || lower.includes('phone') || lower.includes('refund')) {
    reply =
      '📞 Need urgent help with a complaint? You can **Request an Instant Callback** from our Escalations Team or chat live with a support agent in our **Customer Service Hub**. Average callback connection time is under 2 minutes.';
    suggestions = ['Request Callback for Complaint', 'Start Live Agent Chat', 'Refund Policy'];
    actionLink = { label: 'Request Call / Live Support', path: '/customer-service' };
  } else if (lower.includes('video') || lower.includes('photo') || lower.includes('review') || lower.includes('media')) {
    reply =
      '🎥 Customers with **Delivered Orders** can upload **Product Photos and Videos** along with a star rating and written review! Go to **Orders**, click **"Post Photo / Video Review"** on any delivered item, or scroll down to the Customer Reviews section on any product page.';
    suggestions = ['Post Photo/Video Review', 'View Verified Media Reviews'];
    actionLink = { label: 'Go to Delivered Orders', path: '/orders' };
  } else if (lower.includes('setting') || lower.includes('theme') || lower.includes('notification') || lower.includes('address')) {
    reply =
      '⚙️ You can customize your account preferences, delivery notifications, default payment method (Amazon Wallet vs Card), currency, and security options in **Settings**.';
    suggestions = ['Open Settings', 'Update Notification Preferences'];
    actionLink = { label: 'Open Account Settings', path: '/settings' };
  } else {
    reply =
      "👋 Hi! I'm your **Amazon Clone AI Assistant**. I can help you:\n• Track orders & post **Photo/Video Reviews** on delivered items\n• Manage your **Amazon Pay Wallet** ($250 balance & promo codes)\n• **Compare Products** side-by-side\n• Connect to **Live Customer Service Chat** or **Request a Phone Call for a Complaint**\n• Configure **Account Settings**";
    suggestions = ['Check Wallet Balance', 'Compare Products', 'Track My Order', 'Request Complaint Call'];
  }

  res.json({
    reply,
    suggestions,
    actionLink,
    timestamp: new Date().toISOString(),
  });
});

// 2. Get Customer Service Live Chat Messages
router.get('/chat', (req, res) => {
  const chats = getUserChats(req.user.id);
  res.json(chats);
});

// 3. Send Message to Customer Service Live Chat
router.post('/chat', (req, res) => {
  const { text, orderId, attachment } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  const chats = getUserChats(req.user.id);
  const userMsg = {
    id: 'msg_u_' + Date.now(),
    sender: 'user',
    userName: req.user.name || 'Customer',
    text: text.trim(),
    orderId: orderId || null,
    attachment: attachment || null,
    timestamp: new Date().toISOString(),
  };
  chats.push(userMsg);

  // Generate realistic specialist response based on user message
  const lower = text.toLowerCase();
  let agentText = '';
  if (lower.includes('refund') || lower.includes('return') || lower.includes('money back')) {
    agentText = `I completely understand your concern${orderId ? ` regarding Order #${orderId}` : ''}. I have initiated a priority return & instant refund check for your account. We can credit the full amount directly to your Amazon Pay Wallet within 2 hours or back to your original card.`;
  } else if (lower.includes('damage') || lower.includes('broken') || lower.includes('defect') || lower.includes('wrong')) {
    agentText = `I am very sorry you received a damaged or incorrect item${orderId ? ` on Order #${orderId}` : ''}! I have logged a Priority Replacement Ticket and waived return shipping. You can also request an immediate supervisor phone call in the "Request a Call for Complaint" tab if you'd like verbal confirmation.`;
  } else if (lower.includes('call') || lower.includes('phone') || lower.includes('speak')) {
    agentText = `Absolutely! I can arrange for a Senior Resolution Specialist to call your phone immediately. Please switch to the "Request Call for Complaint" panel or confirm your phone number here, and we will ring you within 2 minutes.`;
  } else {
    agentText = `Thank you for reaching out${orderId ? ` about Order #${orderId}` : ''}. I have reviewed your account details and escalated this to our Priority Resolution Queue (Ref #CS-${Math.floor(10000 + Math.random() * 90000)}). Is there anything specific you would like me to credit to your Amazon Wallet or replace today?`;
  }

  const agentMsg = {
    id: 'msg_a_' + (Date.now() + 1),
    sender: 'agent',
    agentName: 'Maya (Senior Customer Care Specialist)',
    text: agentText,
    timestamp: new Date(Date.now() + 500).toISOString(),
  };
  chats.push(agentMsg);

  res.status(201).json({
    userMessage: userMsg,
    agentReply: agentMsg,
    messages: chats,
  });
});

// 4. Get Callback Requests for Complaints
router.get('/call-requests', (req, res) => {
  const requests = getUserCallRequests(req.user.id);
  res.json(requests);
});

// 5. Submit a New "Request a Call for Complaint"
router.post('/call-requests', (req, res) => {
  const {
    phone,
    orderId = 'General Account',
    category = 'Defective / Damaged Product',
    urgency = 'Immediate Callback (< 2 mins)',
    preferredTime = 'Right Now',
    complaintDetails = '',
  } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Phone number is required to request a callback' });
  }
  if (!complaintDetails || !complaintDetails.trim()) {
    return res.status(400).json({ message: 'Please briefly describe your complaint so the specialist can prepare' });
  }

  const requests = getUserCallRequests(req.user.id);
  const newTicket = {
    id: 'CALL-' + Math.floor(10000 + Math.random() * 90000),
    phone: phone.trim(),
    orderId: String(orderId),
    category,
    urgency,
    preferredTime,
    complaintDetails: complaintDetails.trim(),
    assignedAgent: urgency.includes('Immediate') ? 'Sarah Jenkins (Resolution Supervisor)' : 'David R. (Escalations Lead)',
    status: urgency.includes('Immediate') ? 'Connecting Call Now (Est. < 2 mins)' : 'Scheduled — Agent Assigned',
    created_at: new Date().toISOString(),
  };

  requests.unshift(newTicket);

  res.status(201).json({
    message: `Callback request ${newTicket.id} confirmed! ${newTicket.assignedAgent} will call ${newTicket.phone} (${newTicket.preferredTime}).`,
    ticket: newTicket,
    requests,
  });
});

module.exports = router;
