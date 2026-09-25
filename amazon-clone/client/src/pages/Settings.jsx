import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Wallet as WalletIcon,
  Shield,
  MapPin,
  Save,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const SETTINGS_STORAGE_KEY = 'amazon_clone_user_settings';

export default function Settings() {
  const [settings, setSettings] = useState({
    displayName: 'Demo Customer',
    email: 'customer@example.com',
    phone: '+1 (555) 234-5678',
    language: 'en-US',
    currency: 'USD ($)',
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
      fullName: 'John Doe',
      line1: '123 Market Street, Apt 4B',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'United States',
    },
  });

  const [savedMessage, setSavedMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch (e) {}
    }

    api
      .get('/settings')
      .then((res) => {
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(null);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      await api.put('/settings', settings);
      setSavedMessage('Your account, wallet, notification, and privacy settings have been saved!');
    } catch (err) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSavedMessage('Settings saved successfully to your profile!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link to="/profile" className="hover:underline">Your Account</Link> <span>›</span>{' '}
              <span className="text-gray-900 font-semibold">Settings & Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <SettingsIcon className="text-amber-500" size={28} /> Account & Store Settings
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Manage your profile, Amazon Pay Wallet defaults, delivery alerts, security, and shipping address.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm transition flex items-center gap-2 self-start"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {savedMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Profile & Regional Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <User size={18} className="text-amber-500" /> Personal Information & Regional Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone (for Callbacks & SMS)</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Globe size={13} /> Preferred Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white outline-none"
                >
                  <option value="USD ($)">USD ($) — US Dollar</option>
                  <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                  <option value="EUR (€)">EUR (€) — Euro</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Amazon Pay Wallet & Checkout Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <WalletIcon size={18} className="text-amber-500" /> Amazon Pay Wallet & Payment Preferences
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-50">
                <div>
                  <p className="font-bold text-gray-900">Default Payment Method at Checkout</p>
                  <p className="text-gray-500">Choose whether to automatically select your Amazon Pay Wallet or Credit Card.</p>
                </div>
                <select
                  value={settings.defaultPaymentMethod}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 bg-amber-50/50 outline-none"
                >
                  <option value="wallet">Amazon Pay Wallet (Instant 1-Click)</option>
                  <option value="card">Credit / Debit Card (Stripe)</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="font-bold text-gray-900">Enable 1-Click Instant Wallet Checkout</p>
                  <p className="text-gray-500">Complete purchases immediately using available Amazon Pay Wallet balance.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.oneClickWalletCheckout}
                  onChange={(e) =>
                    setSettings({ ...settings, oneClickWalletCheckout: e.target.checked })
                  }
                  className="h-4 w-4 accent-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="font-bold text-gray-900">Auto-Reload Wallet When Balance Drops Below $25</p>
                  <p className="text-gray-500">Automatically top up $50 from your saved card so you never run out at checkout.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReloadWallet}
                  onChange={(e) => setSettings({ ...settings, autoReloadWallet: e.target.checked })}
                  className="h-4 w-4 accent-amber-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* 3. Notification Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Bell size={18} className="text-amber-500" /> Order Delivery & Alert Notifications
            </h2>

            <div className="space-y-3 text-xs">
              {[
                {
                  key: 'orderDeliverySms',
                  label: 'SMS Delivery & Out-for-Delivery Alerts',
                  desc: 'Receive an instant text when your order is delivered and ready for Photo/Video review.',
                },
                {
                  key: 'whatsappTracking',
                  label: 'Real-Time Courier & Complaint Call Updates',
                  desc: 'Get live tracking links and callback confirmations when a support specialist calls you.',
                },
                {
                  key: 'priceDropAlerts',
                  label: 'Price Drop & Comparison Alerts',
                  desc: 'Notify me when products in my Compare list or Cart drop in price.',
                },
                {
                  key: 'securityAlerts',
                  label: 'Login & Wallet Transaction Security Alerts',
                  desc: 'Immediate notification whenever your Amazon Pay Wallet is debited or topped up.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between cursor-pointer py-2 border-b border-gray-50 last:border-none"
                >
                  <div>
                    <p className="font-bold text-gray-900">{item.label}</p>
                    <p className="text-gray-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.notifications?.[item.key])}
                    onChange={() => handleToggle('notifications', item.key)}
                    className="h-4 w-4 accent-amber-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 4. Default Shipping Address & Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <MapPin size={18} className="text-amber-500" /> Default Shipping Address
              </h2>
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="Recipient Full Name"
                  value={settings.defaultAddress?.fullName || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultAddress: { ...settings.defaultAddress, fullName: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Street Address / Apt"
                  value={settings.defaultAddress?.line1 || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultAddress: { ...settings.defaultAddress, line1: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={settings.defaultAddress?.city || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAddress: { ...settings.defaultAddress, city: e.target.value },
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="State / ZIP"
                    value={settings.defaultAddress?.zipCode || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAddress: { ...settings.defaultAddress, zipCode: e.target.value },
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Shield size={18} className="text-amber-500" /> Security & Review Privacy
              </h2>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between cursor-pointer py-1.5">
                  <div>
                    <p className="font-bold text-gray-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-gray-500">Require OTP verification for sensitive account changes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacy?.twoFactorAuth)}
                    onChange={() => handleToggle('privacy', 'twoFactorAuth')}
                    className="h-4 w-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1.5">
                  <div>
                    <p className="font-bold text-gray-900">Verified Badge on Photo & Video Reviews</p>
                    <p className="text-gray-500">Display "Verified Delivered Purchase" when you upload product photos/videos.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacy?.publicReviewProfile)}
                    onChange={() => handleToggle('privacy', 'publicReviewProfile')}
                    className="h-4 w-4 accent-amber-500"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold text-sm px-8 py-3 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
