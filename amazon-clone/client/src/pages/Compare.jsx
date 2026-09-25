import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Scale,
  Star,
  ShoppingCart,
  Trash2,
  Plus,
  CheckCircle2,
  Award,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { addToCompare, removeFromCompare, clearCompare } from '../redux/compareSlice';
import { addToCart } from '../redux/cartSlice';
import api from '../api/axios';

const CATEGORY_NAMES = {
  1: 'Electronics',
  2: 'Computers & Laptops',
  3: 'Audio & Smart Home',
  4: 'Fashion & Apparel',
  5: 'Home & Kitchen',
  6: 'Books & Media',
};

export default function Compare() {
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare?.items || []);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    api
      .get('/products')
      .then((res) => setCatalog(res.data || []))
      .catch(() => {});
  }, []);

  const lowestPrice =
    compareItems.length > 0
      ? Math.min(...compareItems.map((p) => parseFloat(p.price || 999999)))
      : null;

  const highestRating =
    compareItems.length > 0
      ? Math.max(...compareItems.map((p) => parseFloat(p.rating || 0)))
      : null;

  const availableToAdd = catalog.filter(
    (p) => !compareItems.some((c) => Number(c.id) === Number(p.id))
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <Scale className="text-amber-500" size={28} /> Side-by-Side Product Comparison
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Compare prices, ratings, customer reviews, stock availability, and specifications across up to 4 products.
            </p>
          </div>

          {compareItems.length > 0 && (
            <button
              onClick={() => dispatch(clearCompare())}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 px-4 py-2 rounded-lg shadow-sm self-start transition"
            >
              Clear All ({compareItems.length})
            </button>
          )}
        </div>

        {/* Quick Add Products Strip */}
        {compareItems.length < 4 && availableToAdd.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              + Quick Add Product to Compare ({4 - compareItems.length} slots remaining):
            </p>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {availableToAdd.slice(0, 8).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => dispatch(addToCompare(prod))}
                  className="flex items-center gap-2.5 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-400 rounded-lg p-2 pr-3 text-left shrink-0 transition"
                >
                  <img
                    src={prod.images?.[0]}
                    alt={prod.title}
                    className="w-10 h-10 object-contain rounded bg-white border p-0.5"
                  />
                  <div className="max-w-[160px]">
                    <p className="text-xs font-semibold text-gray-900 truncate">{prod.title}</p>
                    <p className="text-[11px] font-bold text-amber-700">${parseFloat(prod.price).toFixed(2)}</p>
                  </div>
                  <Plus size={15} className="text-amber-600 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {compareItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm max-w-lg mx-auto">
            <Scale size={48} className="mx-auto text-amber-500 mb-4" />
            <h2 className="text-lg font-bold text-gray-900">No products selected for comparison</h2>
            <p className="text-xs text-gray-500 mt-2 mb-6">
              Click any product above or click the "Compare" button on any product card in the store.
            </p>
            <Link
              to="/"
              className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs px-6 py-2.5 rounded-full shadow-sm transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-44 p-5 bg-gray-50 text-xs font-bold text-gray-500 uppercase align-top">
                    Product Overview
                  </th>
                  {compareItems.map((item) => (
                    <th key={item.id} className="p-5 align-top border-l border-gray-100 w-64 relative">
                      <button
                        onClick={() => dispatch(removeFromCompare(item.id))}
                        title="Remove from comparison"
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition"
                      >
                        <Trash2 size={15} />
                      </button>

                      <Link to={`/product/${item.id}`} className="block mb-3">
                        <img
                          src={
                            item.images?.[0] ||
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
                          }
                          alt={item.title}
                          className="h-36 w-full object-contain rounded-lg bg-gray-50 p-2 border"
                        />
                      </Link>

                      <Link
                        to={`/product/${item.id}`}
                        className="text-sm font-bold text-gray-900 hover:text-amber-600 line-clamp-2"
                      >
                        {item.title}
                      </Link>

                      <button
                        onClick={() =>
                          dispatch(addToCart({ product_id: item.id, quantity: 1, product: item }))
                        }
                        className="mt-3 w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs py-2 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <ShoppingCart size={13} /> Add to Cart
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-xs">
                {/* Price Row */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Price</td>
                  {compareItems.map((item) => {
                    const isCheapest =
                      compareItems.length > 1 && parseFloat(item.price) === lowestPrice;
                    return (
                      <td key={item.id} className="p-4 border-l border-gray-100">
                        <span className="text-lg font-extrabold text-gray-900">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        {isCheapest && (
                          <span className="ml-2 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Best Price
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Customer Rating */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Customer Rating</td>
                  {compareItems.map((item) => {
                    const isTopRated =
                      compareItems.length > 1 && parseFloat(item.rating || 4.5) === highestRating;
                    return (
                      <td key={item.id} className="p-4 border-l border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.floor(item.rating || 4.5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                          <span className="font-bold text-gray-900">{item.rating || '4.5'} / 5</span>
                          <span className="text-gray-500">({item.num_reviews || 12} reviews)</span>
                        </div>
                        {isTopRated && (
                          <span className="mt-1 inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Award size={11} /> Top Rated Choice
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Category */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Category</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 font-medium text-gray-800">
                      {CATEGORY_NAMES[item.category_id] || 'Electronics & Accessories'}
                    </td>
                  ))}
                </tr>

                {/* Availability */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Stock Status</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100">
                      {(item.stock ?? 25) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 size={14} /> In Stock ({item.stock ?? 25} units available)
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold">Out of Stock</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Shipping & Delivery */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Prime Delivery</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 text-gray-700">
                      <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <Truck size={14} className="text-amber-600" /> FREE One-Day Prime Shipping
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Payment Options */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Eligible Payment</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 text-gray-700">
                      Amazon Pay Wallet (Instant) • Credit/Debit Card
                    </td>
                  ))}
                </tr>

                {/* Warranty & Returns */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Warranty & Return</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 text-gray-700">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <ShieldCheck size={14} /> 1-Year Warranty & 30-Day Free Replacement
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Specifications / Summary */}
                <tr>
                  <td className="p-4 bg-gray-50 font-bold text-gray-700">Key Specifications</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 text-gray-600 leading-relaxed">
                      {item.description || 'Premium build quality, verified customer photo & video reviews available.'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
