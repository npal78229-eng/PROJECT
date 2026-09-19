import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';

// Default mock products for immediate Phase 0 visualization
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    title: 'Noise-Cancelling Wireless Headphones Pro',
    description: 'Active noise cancellation with 40-hour battery life and spatial audio.',
    price: 199.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    rating: 4.8,
    num_reviews: 128,
  },
  {
    id: 2,
    title: 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)',
    description: 'Lightweight aluminum unibody with vibrant FHD IPS display.',
    price: 749.99,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    rating: 4.6,
    num_reviews: 94,
  },
  {
    id: 3,
    title: 'Ergonomic Wireless Mechanical Keyboard',
    description: 'Tactile hot-swappable switches with RGB backlighting.',
    price: 89.99,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    rating: 4.7,
    num_reviews: 72,
  },
  {
    id: 4,
    title: 'Smart Voice-Controlled Speaker with Alexa',
    description: 'Room-filling balanced audio with smart home automation hub.',
    price: 49.99,
    stock: 150,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'],
    rating: 4.5,
    num_reviews: 310,
  },
  {
    id: 5,
    title: '4K Ultra HD Streaming Media Player',
    description: 'Cinematic 4K streaming with Dolby Vision and Wi-Fi 6 support.',
    price: 39.99,
    stock: 85,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
    rating: 4.4,
    num_reviews: 215,
  },
  {
    id: 6,
    title: 'Men\'s Classic Waterproof Winter Parka',
    description: 'Windproof and water-resistant winter coat with faux-fur lined hood.',
    price: 119.50,
    stock: 35,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce667823?w=800&q=80'],
    rating: 4.3,
    num_reviews: 56,
  },
  {
    id: 7,
    title: 'Premium Leather Minimalist Slim Wallet',
    description: 'RFID-blocking slim front-pocket bifold crafted from genuine full-grain leather.',
    price: 29.99,
    stock: 110,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'],
    rating: 4.7,
    num_reviews: 189,
  },
  {
    id: 8,
    title: 'Programmable Stainless Steel Coffee Maker',
    description: 'Brew up to 12 cups of fresh coffee with programmable 24-hour timer.',
    price: 69.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80'],
    rating: 4.6,
    num_reviews: 88,
  }
];

export default function Home() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get('/products', { params: { q: query, category } })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.warn('Backend products not reachable yet, showing mock catalogue.', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, category]);

  const handleSearch = (q, cat) => {
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar onSearch={handleSearch} />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 to-indigo-950 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="bg-amber-400 text-gray-950 text-xs font-bold px-2.5 py-1 rounded">
              SPRING SALE 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 tracking-tight">
              Huge Savings on Top Brands
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-lg">
              Explore thousands of tech gadgets, designer apparel, books, and home essentials with fast, reliable checkout.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Fast & Free Shipping</p>
            <p className="text-2xl font-bold mt-1">Prime Members</p>
            <p className="text-xs text-gray-300 mt-1">Try Prime free for 30 days</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {query ? `Results for "${query}"` : 'Featured Deals & Bestsellers'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing {products.length} products</p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#232f3e] text-gray-300 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-2">Amazon Clone — Full-Stack Educational Platform</p>
          <p className="text-gray-400">Built with React, Express, PostgreSQL, Redux Toolkit, and Stripe</p>
        </div>
      </footer>
    </div>
  );
}
