import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Lock,
  ShieldCheck,
  CheckCircle,
  Wallet as WalletIcon,
  CreditCard,
  PlusCircle,
  Camera,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { clearCartState } from '../redux/cartSlice';
import { deductLocalWallet, addWalletFunds, setWalletBalance } from '../redux/walletSlice';
import api from '../api/axios';

export default function Checkout() {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items } = useSelector((state) => state.cart);
  const walletBalance = useSelector((state) => state.wallet?.balance ?? 250.0);

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.price || 0) * item.quantity,
    0
  );

  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' | 'card'
  const [markDelivered, setMarkDelivered] = useState(true);

  const [address, setAddress] = useState({
    fullName: 'John Doe',
    line1: '123 Market Street, Apt 4B',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleQuickWalletTopUp = () => {
    const needed = Math.max(100, Math.ceil(subtotal - walletBalance + 50));
    dispatch(addWalletFunds({ amount: needed, method: 'Instant Checkout Top-Up' }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    if (paymentMethod === 'wallet' && walletBalance < subtotal) {
      setErrorMessage(
        `Insufficient Amazon Pay Wallet balance ($${Number(walletBalance).toFixed(
          2
        )} available for $${subtotal.toFixed(2)} order). Click "+ Instant Top-Up" below or switch to Card.`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      let paymentIntentId =
        paymentMethod === 'wallet' ? 'wallet_pay_' + Date.now() : 'card_pi_' + Date.now();

      if (paymentMethod === 'card') {
        let clientSecret = null;
        try {
          const res = await api.post('/orders/checkout', { cartItems: items });
          clientSecret = res.data.clientSecret;
        } catch (err) {
          console.warn('Live Stripe secret not available, proceeding in test mock mode', err);
        }

        if (stripe && elements && clientSecret && !clientSecret.includes('mock')) {
          const cardElement = elements.getElement(CardElement);
          const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
          });

          if (error) {
            setErrorMessage(error.message);
            setIsSubmitting(false);
            return;
          }
          paymentIntentId = paymentIntent.id;
        }
      }

      const generatedOrderId = Math.floor(100000 + Math.random() * 900000);

      try {
        const confirmRes = await api.post('/orders/confirm', {
          paymentIntentId,
          paymentMethod,
          markDelivered,
          shippingAddress: address,
          cartItems: items,
        });
        const finalId = confirmRes.data?.orderId || generatedOrderId;
        setOrderId(finalId);
        if (confirmRes.data?.walletBalance !== undefined && confirmRes.data?.walletBalance !== null) {
          dispatch(setWalletBalance(confirmRes.data.walletBalance));
        } else if (paymentMethod === 'wallet') {
          dispatch(
            deductLocalWallet({
              amount: subtotal,
              description: `Order Payment #${finalId}`,
            })
          );
        }
      } catch (confirmErr) {
        setOrderId(generatedOrderId);
        if (paymentMethod === 'wallet') {
          dispatch(
            deductLocalWallet({
              amount: subtotal,
              description: `Order Payment #${generatedOrderId}`,
            })
          );
        }
      }

      setPaidAmount(subtotal);
      dispatch(clearCartState());
      setOrderComplete(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Payment processing failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              Thank you, your order has been placed!
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Order ID <strong className="text-gray-800">#{orderId}</strong> paid via{' '}
              <strong className="text-amber-700">
                {paymentMethod === 'wallet' ? 'Amazon Pay Wallet' : 'Credit/Debit Card'}
              </strong>
              .
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-xs text-gray-600 space-y-1.5 border">
              <p>
                <strong>Shipping to:</strong> {address.fullName}, {address.line1}, {address.city},{' '}
                {address.state} {address.zipCode}
              </p>
              <p>
                <strong>Total Paid:</strong> ${paidAmount.toFixed(2)}
              </p>
              {paymentMethod === 'wallet' && (
                <p className="text-emerald-700 font-bold">
                  <strong>Remaining Amazon Pay Wallet Balance:</strong> $
                  {Number(walletBalance).toFixed(2)}
                </p>
              )}
              <p>
                <strong>Order Status:</strong>{' '}
                {markDelivered
                  ? 'DELIVERED TO CUSTOMER (Ready for Photo & Video Review!)'
                  : 'Paid — Preparing for Dispatch'}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/orders"
                className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Camera size={15} /> Go to Orders &amp; Post Photo/Video Review
              </Link>
              <Link
                to="/"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-full text-xs transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      {/* Top Checkout Banner */}
      <div className="bg-white border-b border-gray-200 py-3 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            Checkout (<span className="text-amber-600">{items.length} items</span>)
          </h1>
          <Lock size={18} className="text-gray-400" />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-medium flex flex-wrap items-center justify-between gap-2">
            <span>{errorMessage}</span>
            {paymentMethod === 'wallet' && walletBalance < subtotal && (
              <button
                type="button"
                onClick={handleQuickWalletTopUp}
                className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-3 py-1.5 rounded-lg"
              >
                + Instant Top-Up Wallet Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Shipping & Payment */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Shipping Address */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">1. Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="line1"
                    value={address.line1}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State / Postal Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      required
                      placeholder="State"
                      className="w-1/2 border border-gray-300 rounded p-2 text-sm outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      name="zipCode"
                      value={address.zipCode}
                      onChange={handleInputChange}
                      required
                      placeholder="Zip"
                      className="w-1/2 border border-gray-300 rounded p-2 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector: Amazon Pay Wallet vs Stripe Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">2. Select Payment Method</h2>
                <Link
                  to="/wallet"
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Manage Wallet / Redeem Voucher
                </Link>
              </div>

              {/* Option A: Amazon Pay Wallet */}
              <label
                onClick={() => setPaymentMethod('wallet')}
                className={`block rounded-xl border-2 p-4 cursor-pointer transition ${
                  paymentMethod === 'wallet'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <div className="h-9 w-9 rounded-lg bg-[#131921] text-amber-400 flex items-center justify-center">
                      <WalletIcon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                        Amazon Pay Wallet
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          RECOMMENDED • 1-CLICK
                        </span>
                      </p>
                      <p className="text-xs text-gray-600">
                        Available Balance:{' '}
                        <strong className="text-gray-900">
                          ${Number(walletBalance).toFixed(2)}
                        </strong>{' '}
                        {walletBalance >= subtotal
                          ? `($${(walletBalance - subtotal).toFixed(2)} remaining after payment)`
                          : '(Low balance — click top-up)'}
                      </p>
                    </div>
                  </div>

                  {walletBalance < subtotal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickWalletTopUp();
                      }}
                      className="bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      + Top Up Now
                    </button>
                  )}
                </div>
              </label>

              {/* Option B: Credit / Debit Card (Stripe) */}
              <label
                onClick={() => setPaymentMethod('card')}
                className={`block rounded-xl border-2 p-4 cursor-pointer transition ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="h-4 w-4 accent-amber-500"
                  />
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Credit or Debit Card (Stripe)
                    </p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, American Express</p>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="border border-gray-300 rounded-lg p-3 bg-white mt-2">
                    {stripe ? (
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '15px',
                              color: '#1f2937',
                              '::placeholder': { color: '#9ca3af' },
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="text-xs text-gray-500 py-1">
                        Stripe Elements test mode active.
                      </div>
                    )}
                  </div>
                )}
              </label>

              {/* Demo Delivery Toggle */}
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markDelivered}
                    onChange={(e) => setMarkDelivered(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600 rounded"
                  />
                  <span>
                    <strong>Fast-Track Demo Delivery:</strong> Mark order as{' '}
                    <span className="text-emerald-700 font-bold">DELIVERED</span> immediately so I can post a Photo/Video review right away
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping &amp; Handling:</span>
                  <span className="text-emerald-600 font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold text-gray-900">
                    {paymentMethod === 'wallet' ? 'Amazon Wallet' : 'Stripe Card'}
                  </span>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              <div className="flex justify-between text-lg font-extrabold text-gray-900">
                <span>Order Total:</span>
                <span className="text-amber-600">${subtotal.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-gray-950 font-extrabold py-3 px-4 rounded-full shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Processing Payment...'
                  : paymentMethod === 'wallet'
                  ? `Pay $${subtotal.toFixed(2)} with Amazon Wallet`
                  : `Pay $${subtotal.toFixed(2)} with Card`}
              </button>

              <p className="text-[11px] text-gray-500 text-center mt-4 leading-tight">
                By placing your order, you agree to Amazon Clone's privacy notice and conditions of use.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
