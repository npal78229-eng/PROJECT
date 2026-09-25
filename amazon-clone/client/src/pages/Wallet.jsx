import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  PlusCircle,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { fetchWallet, addWalletFunds, redeemGiftCode } from '../redux/walletSlice';

export default function Wallet() {
  const dispatch = useDispatch();
  const { balance, transactions } = useSelector((state) => state.wallet);

  const [topUpAmount, setTopUpAmount] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState('Visa •••• 4242');
  const [promoCode, setPromoCode] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    const num = parseFloat(topUpAmount);
    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a valid amount greater than $0');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await dispatch(addWalletFunds({ amount: num, method: paymentMethod })).unwrap();
      setStatusMessage(res.message || `Added $${num.toFixed(2)} to your Amazon Pay Wallet!`);
    } catch (err) {
      setErrorMessage(err || 'Failed to add funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    if (!promoCode.trim()) {
      setErrorMessage('Please enter a gift card or promo code');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await dispatch(redeemGiftCode(promoCode.trim())).unwrap();
      setStatusMessage(res.message || 'Gift card redeemed successfully!');
      setPromoCode('');
    } catch (err) {
      setErrorMessage(typeof err === 'string' ? err : 'Invalid or already redeemed gift code');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link to="/profile" className="hover:underline">Your Account</Link> <span>›</span>{' '}
              <span className="text-gray-900 font-semibold">Amazon Pay Wallet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <WalletIcon className="text-amber-500" size={30} /> Amazon Pay Wallet
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Instant 1-click checkout, zero transaction fees, cashback rewards, and gift voucher redemption.
            </p>
          </div>

          <Link
            to="/cart"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition self-start"
          >
            <ShoppingBag size={15} /> Pay with Wallet at Checkout
          </Link>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Balance Card & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Balance Card */}
            <div className="bg-gradient-to-br from-[#131921] via-[#232f3e] to-gray-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-amber-400/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                    <Sparkles size={12} /> Active Amazon Pay Balance
                  </span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      ${Number(balance).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-300 font-medium">USD Available</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-400" />
                    100% Buyer Protection • Eligible for 1-Click Instant Order Payment
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 text-xs space-y-1.5 min-w-[210px]">
                  <p className="text-gray-300 font-semibold">Available Promo Vouchers:</p>
                  <div className="flex items-center justify-between text-amber-300 font-mono">
                    <span>AMAZON100</span>
                    <span className="font-bold">+$100.00</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300 font-mono">
                    <span>WELCOME50</span>
                    <span className="font-bold">+$50.00</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-300 font-mono">
                    <span>BONUS25</span>
                    <span className="font-bold">+$25.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Money to Wallet */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <PlusCircle size={20} className="text-amber-500" /> Add Money to Wallet
              </h2>

              {/* Quick Top-Up Pills */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(String(amt))}
                    className={`py-2.5 px-3 rounded-lg font-bold text-sm border transition ${
                      String(topUpAmount) === String(amt)
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleTopUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Top-Up Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step="0.01"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Funding Source
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                  >
                    <option value="Visa •••• 4242">Visa Debit •••• 4242</option>
                    <option value="Mastercard •••• 8891">Mastercard •••• 8891</option>
                    <option value="Instant Bank Transfer (ACH/UPI)">Instant Bank Transfer (ACH/UPI)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-sm py-2.5 px-5 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} /> Add Funds Instantly
                </button>
              </form>
            </div>

            {/* Redeem Gift Card / Promo Code */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Gift size={20} className="text-emerald-600" /> Redeem Gift Card or Promo Voucher
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Try entering <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-800">AMAZON100</code>,{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-800">WELCOME50</code>, or{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-800">BONUS25</code> to claim instant wallet cash.
              </p>

              <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter voucher code (e.g. AMAZON100)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-amber-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm transition"
                >
                  Apply to Wallet
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Wallet Transaction Ledger */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Wallet Activity & Ledger</h2>

            <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {(transactions || []).map((txn, idx) => (
                <div key={txn.id || idx} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-2 rounded-full ${
                        txn.type === 'credit'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {txn.type === 'credit' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{txn.description}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {txn.method || 'Amazon Pay'} •{' '}
                        {new Date(txn.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold shrink-0 ${
                      txn.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'
                    }`}
                  >
                    {txn.type === 'credit' ? '+' : '-'}${Number(txn.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
