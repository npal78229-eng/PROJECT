const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const inMemorySettings = new Map();

function getOrCreateSettings(user) {
  const key = String(user.id);
  if (!inMemorySettings.has(key)) {
    inMemorySettings.set(key, {
      displayName: user.name || 'Demo Customer',
      email: user.email || 'customer@example.com',
      phone: '+1 (555) 234-5678',
      language: 'en-US',
      currency: 'USD ($)',
      theme: 'light',
      defaultPaymentMethod: 'wallet',
      oneClickWalletCheckout: true,
      autoReloadWallet: false,
      notifications: {
        orderDeliverySms: true,
        whatsappTracking: true,
        priceDropAlerts: true,
        promotionalEmails: false,
        securityAlerts: true,
      },
      privacy: {
        twoFactorAuth: true,
        browsingHistoryPersonalization: true,
        publicReviewProfile: true,
      },
      defaultAddress: {
        fullName: user.name || 'Demo Customer',
        line1: '123 Market Street, Apt 4B',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'United States',
      },
      updated_at: new Date().toISOString(),
    });
  }
  return inMemorySettings.get(key);
}

router.get('/', (req, res) => {
  const settings = getOrCreateSettings(req.user);
  res.json(settings);
});

router.put('/', (req, res) => {
  const current = getOrCreateSettings(req.user);
  const updated = {
    ...current,
    ...req.body,
    notifications: {
      ...current.notifications,
      ...(req.body.notifications || {}),
    },
    privacy: {
      ...current.privacy,
      ...(req.body.privacy || {}),
    },
    defaultAddress: {
      ...current.defaultAddress,
      ...(req.body.defaultAddress || {}),
    },
    updated_at: new Date().toISOString(),
  };
  inMemorySettings.set(String(req.user.id), updated);
  res.json({
    message: 'Your Amazon Clone settings have been saved successfully',
    settings: updated,
  });
});

module.exports = router;
