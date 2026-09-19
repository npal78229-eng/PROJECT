import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import { removeFromCart, addToCart } from '../redux/cartSlice';

export default function Cart() {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.price || 0) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Your Amazon Clone Cart is empty</h2>
            <p className="text-gray-500 text-sm mt-2">
              Your shopping cart is waiting. Give it purpose — fill it with electronics, clothing, books, and more.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-full text-sm shadow-sm transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Items Column */}
            <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 items-center">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
                      alt={item.title}
                      className="w-24 h-24 object-contain rounded bg-gray-50 p-2"
                    />

                    <div className="flex-1">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-amber-600 line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">In Stock</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() =>
                              dispatch(
                                addToCart({
                                  product_id: item.id,
                                  quantity: -1,
                                })
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              dispatch(
                                addToCart({
                                  product_id: item.id,
                                  quantity: 1,
                                })
                              )
                            }
                            className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="text-xs text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal Order Summary Box */}
            <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Items ({totalItems}):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping:</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Subtotal:</span>
                <span className="text-amber-600">${subtotal.toFixed(2)}</span>
              </div>

              <Link
                to="/checkout"
                className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
