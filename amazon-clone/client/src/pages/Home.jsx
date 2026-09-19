import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';

const CATEGORIES = [
  { id: '', label: 'All Products' },
  { id: '1', label: 'Electronics' },
  { id: '2', label: 'Computers' },
  { id: '3', label: 'Smart Home & Audio' },
  { id: '4', label: 'Clothing & Fashion' },
  { id: '5', label: 'Home & Kitchen' },
  { id: '6', label: 'Books & Media' },
];

const SEED_PRODUCTS = [
  {
    id: 1,
    title: 'Noise-Cancelling Wireless Headphones Pro',
    description: 'Active noise cancellation with 40-hour battery life, spatial audio, and premium memory foam ear cushions.',
    price: 199.99,
    stock: 45,
    category_id: 2,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    rating: 4.8,
    num_reviews: 128,
  },
  {
    id: 2,
    title: 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)',
    description: 'Lightweight aluminum unibody, vibrant FHD IPS display, blazing fast performance for productivity and coding.',
    price: 749.99,
    stock: 20,
    category_id: 2,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    rating: 4.6,
    num_reviews: 94,
  },
  {
    id: 3,
    title: 'Ergonomic Wireless Mechanical Keyboard',
    description: 'Tactile hot-swappable switches with RGB backlighting and Bluetooth multi-device pairing.',
    price: 89.99,
    stock: 60,
    category_id: 2,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    rating: 4.7,
    num_reviews: 72,
  },
  {
    id: 4,
    title: 'Smart Voice-Controlled Speaker with Alexa',
    description: 'Room-filling balanced audio with smart home automation hub built right in.',
    price: 49.99,
    stock: 150,
    category_id: 3,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'],
    rating: 4.5,
    num_reviews: 310,
  },
  {
    id: 5,
    title: '4K Ultra HD Streaming Media Player',
    description: 'Cinematic 4K streaming with Dolby Vision, HDR10+, and Wi-Fi 6 support.',
    price: 39.99,
    stock: 85,
    category_id: 3,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
    rating: 4.4,
    num_reviews: 215,
  },
  {
    id: 6,
    title: 'Men\'s Classic Waterproof Winter Parka',
    description: 'Windproof and water-resistant winter coat with faux-fur lined hood and fleece insulation.',
    price: 119.50,
    stock: 35,
    category_id: 4,
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
    category_id: 4,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'],
    rating: 4.7,
    num_reviews: 189,
  },
  {
    id: 8,
    title: 'Programmable Stainless Steel Coffee Maker',
    description: 'Brew up to 12 cups of fresh coffee with programmable 24-hour timer and auto-pause.',
    price: 69.99,
    stock: 40,
    category_id: 5,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80'],
    rating: 4.6,
    num_reviews: 88,
  },
  {
    id: 9,
    title: 'Non-Stick Ceramic Cookware Set (10-Piece)',
    description: 'Toxin-free nonstick pots and pans set suitable for induction, gas, and electric stovetops.',
    price: 149.00,
    stock: 25,
    category_id: 5,
    images: ['https://images.unsplash.com/photo-1584990347449-37ec0e3c5443?w=800&q=80'],
    rating: 4.8,
    num_reviews: 64,
  },
  {
    id: 10,
    title: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to the architecture, storage engines, distributed consensus, and scalability of modern databases.',
    price: 38.50,
    stock: 75,
    category_id: 6,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'],
    rating: 4.9,
    num_reviews: 430,
  },
  {
    id: 11,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'A must-read handbook of agile software engineering principles, patterns, and refactoring techniques.',
    price: 42.00,
    stock: 50,
    category_id: 6,
    images: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&q=80'],
    rating: 4.7,
    num_reviews: 312,
  },
  {
    id: 12,
    title: '27-inch 4K UHD IPS Designer Monitor',
    description: 'Ultra-sharp 3840x2160 resolution with 99% sRGB color accuracy and USB-C 65W power delivery.',
    price: 349.99,
    stock: 18,
    category_id: 2,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
    rating: 4.6,
    num_reviews: 83,
  },
];

export default function Home() {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get('/products', { params: { q: query, category, sort } })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.warn('Backend query fallback on Home:', err.message);
        let items = [...SEED_PRODUCTS];
        if (query) {
          items = items.filter(
            (p) =>
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.description.toLowerCase().includes(query.toLowerCase())
          );
        }
        if (category) {
          items = items.filter((p) => String(p.category_id) === String(category));
        }
        if (sort === 'price_asc') items.sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') items.sort((a, b) => b.price - a.price);
        else if (sort === 'rating') items.sort((a, b) => b.rating - a.rating);

        if (isMounted) setProducts(items);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, category, sort]);

  const handleCategorySelect = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (catId) params.set('category', catId);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort) params.set('sort', newSort);
    else params.delete('sort');
    setSearchParams(params);
  };

  const handleSearch = (q, cat) => {
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q);
    else params.delete('q');
    if (cat) params.set('category', cat);
    else params.delete('category');
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar onSearch={handleSearch} />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-10 px-6 border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="bg-amber-400 text-gray-950 text-xs font-bold px-2.5 py-1 rounded shadow-sm">
              PHASE 2 PRODUCT CATALOG
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 tracking-tight">
              Curated Electronics, Gear & Books
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-lg">
              Explore 12+ real-world products with responsive filtering, category navigation, real-time ratings, and fast checkout.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Fast & Free Shipping</p>
            <p className="text-2xl font-bold mt-1">Prime Eligible</p>
            <p className="text-xs text-gray-300 mt-1">Free Next-Day delivery on eligible items</p>
          </div>
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 flex-nowrap">
            {CATEGORIES.map((cat) => {
              const isActive = (cat.id === '' && !category) || category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-amber-400 text-gray-950 font-semibold shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-500 hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-amber-500"
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {query
                ? `Results for "${query}"`
                : category
                ? `Products in ${CATEGORIES.find((c) => c.id === category)?.label || 'Category'}`
                : 'Browse All Catalog Items'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing {products.length} products</p>
          </div>

          {(query || category || sort) && (
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border max-w-md mx-auto">
            <SlidersHorizontal size={36} className="text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800">No products match your criteria</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your keywords or category filters.</p>
            <button
              onClick={() => setSearchParams({})}
              className="mt-4 bg-amber-400 text-gray-950 font-semibold text-xs px-4 py-2 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
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
