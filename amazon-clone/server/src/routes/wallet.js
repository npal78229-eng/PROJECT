const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// In-memory wallet store for resilient local operation
const inMemoryWallets = new Map();

const PROMO_CODES = {
  AMAZON100: { amount: 100.0, label: 'Amazon Pay Gift Card ($100)' },
  WELCOME50: { amount: 50.0, label: 'Welcome Promotional Credit ($50)' },
  BONUS25: { amount: 25.0, label: 'Prime Cashback Reward ($25)' },
  FESTIVAL200: { amount: 200.0, label: 'Festival Voucher ($200)' },
};

function getOrCreateWallet(userId) {
  const key = String(userId);
  if (!inMemoryWallets.has(key)) {
    inMemoryWallets.set(key, {
      user_id: userId,
      balance: 250.0, // Pre-loaded $250.00 Amazon Pay Wallet balance for instant testing
      redeemedCodes: [],
      transactions: [
        {
          id: 'txn_init_1',
          type: 'credit',
          amount: 200.0,
          description: 'Amazon Pay Welcome Bonus Balance',
          method: 'Promotional Credit',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'txn_init_2',
          type: 'credit',
          amount: 50.0,
          description: 'Prime Cashback Reward — Electronics Order',
          method: 'Cashback',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
    });
  }
  return inMemoryWallets.get(key);
}

// Helper exported for checkout route integration
function deductWalletBalance(userId, amount, description = 'Amazon Clone Order Payment') {
  const wallet = getOrCreateWallet(userId);
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid payment amount');
  }
  if (wallet.balance < numAmount) {
    throw new Error(`Insufficient Amazon Wallet balance. Available: $${wallet.balance.toFixed(2)}, Required: $${numAmount.toFixed(2)}`);
  }

  wallet.balance = parseFloat((wallet.balance - numAmount).toFixed(2));
  const txn = {
    id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: 'debit',
    amount: numAmount,
    description,
    method: 'Amazon Pay Wallet',
    created_at: new Date().toISOString(),
  };
  wallet.transactions.unshift(txn);
  return { balance: wallet.balance, transaction: txn };
}

// 1. Get wallet balance & transaction history
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const wallet = getOrCreateWallet(userId);
    res.json({
      balance: wallet.balance,
      currency: 'USD',
      transactions: wallet.transactions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load wallet', error: err.message });
  }
});

// 2. Add funds / Top-up wallet
router.post('/add-funds', async (req, res) => {
  const userId = req.user.id;
  const { amount, method = 'Debit/Credit Card' } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
    return res.status(400).json({ message: 'Please enter a valid top-up amount between $1 and $10,000' });
  }

  const wallet = getOrCreateWallet(userId);
  wallet.balance = parseFloat((wallet.balance + numAmount).toFixed(2));

  const txn = {
    id: 'txn_' + Date.now(),
    type: 'credit',
    amount: numAmount,
    description: `Wallet Top-Up via ${method}`,
    method,
    created_at: new Date().toISOString(),
  };
  wallet.transactions.unshift(txn);

  res.status(200).json({
    message: `Successfully added $${numAmount.toFixed(2)} to your Amazon Pay Wallet`,
    balance: wallet.balance,
    transaction: txn,
    transactions: wallet.transactions,
  });
});

// 3. Redeem Gift Card / Promo Code
router.post('/redeem', async (req, res) => {
  const userId = req.user.id;
  const rawCode = (req.body.code || '').trim().toUpperCase();

  if (!rawCode) {
    return res.status(400).json({ message: 'Gift card or promo code is required' });
  }

  const wallet = getOrCreateWallet(userId);
  if (wallet.redeemedCodes.includes(rawCode)) {
    return res.status(400).json({ message: `Code "${rawCode}" has already been redeemed on this account` });
  }

  const promo = PROMO_CODES[rawCode] || (rawCode.startsWith('GIFT') ? { amount: 50.0, label: `Gift Voucher (${rawCode})` } : null);
  if (!promo) {
    return res.status(404).json({
      message: 'Invalid gift code. Try WELCOME50, AMAZON100, BONUS25, or FESTIVAL200',
    });
  }

  wallet.redeemedCodes.push(rawCode);
  wallet.balance = parseFloat((wallet.balance + promo.amount).toFixed(2));

  const txn = {
    id: 'txn_' + Date.now(),
    type: 'credit',
    amount: promo.amount,
    description: `${promo.label} [${rawCode}]`,
    method: 'Gift Card / Promo',
    created_at: new Date().toISOString(),
  };
  wallet.transactions.unshift(txn);

  res.status(200).json({
    message: `Redeemed ${rawCode}! +$${promo.amount.toFixed(2)} added to your wallet.`,
    balance: wallet.balance,
    transaction: txn,
    transactions: wallet.transactions,
  });
});

// 4. Pay with wallet directly
router.post('/pay', async (req, res) => {
  const userId = req.user.id;
  const { amount, orderId } = req.body;
  try {
    const result = deductWalletBalance(
      userId,
      amount,
      orderId ? `Order Payment #${orderId}` : 'Amazon Clone Purchase'
    );
    const wallet = getOrCreateWallet(userId);
    res.status(200).json({
      message: 'Payment completed via Amazon Pay Wallet',
      balance: result.balance,
      transaction: result.transaction,
      transactions: wallet.transactions,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.deductWalletBalance = deductWalletBalance;
router.getOrCreateWallet = getOrCreateWallet;

module.exports = router;
