import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShieldCheck, Truck, ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import { addToCart } from '../redux/cartSlice';
import api from '../api/axios';

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (isMounted) setProduct(res.data);
      })
      .catch((err) => {
        console.warn('Could not fetch product from backend, using placeholder', err);
        // Fallback for immediate UI test
        if (isMounted) {
          setProduct({
            id: Number(id),
            title: 'Noise-Cancelling Wireless Headphones Pro',
            description:
              'Experience industry-leading active noise cancellation with dual microphones, 40-hour ultra battery life, quick 10-minute charging for 5 hours of playback, and crystal-clear voice clarity.',
            price: 199.99,
            stock: 45,
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
            rating: 4.8,
            num_reviews: 128,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ product_id: product.id, quantity }));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <Link to="/" className="text-amber-600 hover:underline mt-4 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 mb-6">
          <ArrowLeft size={16} /> Back to results
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Image Column */}
          <div className="md:col-span-5 flex items-center justify-center bg-gray-50 rounded-lg p-6">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
              alt={product.title}
              className="max-h-96 object-contain"
            />
          </div>

          {/* Details Column */}
          <div className="md:col-span-4 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.title}</h1>

            <div className="flex items-center gap-2 mt-2 text-sm text-amber-500">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-gray-700 font-medium">{product.rating || 4.8}</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600 hover:underline cursor-pointer">{product.num_reviews || 128} ratings</span>
            </div>

            <hr className="my-4 border-gray-200" />

            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500">$</span>
              <span className="text-3xl font-extrabold text-gray-900">{parseFloat(product.price).toFixed(2)}</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">About this item</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-amber-500" />
                <span>Fast & Tracked Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>1 Year Manufacturer Warranty</span>
              </div>
            </div>
          </div>

          {/* Buy Box */}
          <div className="md:col-span-3 border border-gray-200 rounded-lg p-5 h-fit bg-gray-50/50">
            <div className="text-2xl font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Currently Out of Stock'}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none cursor-pointer"
              >
                {[...Array(Math.min(10, product.stock || 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full mt-4 py-2.5 px-4 rounded-full font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-gray-950'
              }`}
            >
              {added ? (
                <>
                  <Check size={16} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
              )}
            </button>

            <Link
              to="/checkout"
              className="block text-center w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 px-4 rounded-full transition shadow-sm"
            >
              Buy Now
            </Link>

            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>Ships from: Amazon Clone Logistics</p>
              <p>Sold by: Official Certified Partner</p>
              <p>Returns: 30-day refund policy</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
