import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShieldCheck, Truck, ArrowLeft, Check, ShoppingCart, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import { addToCart } from '../redux/cartSlice';
import api from '../api/axios';

const SEED_CATALOG = [
  {
    id: 1,
    categoryName: 'Computers & Accessories',
    title: 'Noise-Cancelling Wireless Headphones Pro',
    description: 'Active noise cancellation with 40-hour battery life, spatial audio, and premium memory foam ear cushions.',
    price: 199.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    rating: 4.8,
    num_reviews: 128,
  },
  {
    id: 2,
    categoryName: 'Computers & Accessories',
    title: 'Ultra-Slim 14-inch Laptop (16GB RAM, 512GB SSD)',
    description: 'Lightweight aluminum unibody, vibrant FHD IPS display, blazing fast performance for productivity and coding.',
    price: 749.99,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    rating: 4.6,
    num_reviews: 94,
  },
  {
    id: 3,
    categoryName: 'Computers & Accessories',
    title: 'Ergonomic Wireless Mechanical Keyboard',
    description: 'Tactile hot-swappable switches with RGB backlighting and Bluetooth multi-device pairing.',
    price: 89.99,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    rating: 4.7,
    num_reviews: 72,
  },
  {
    id: 4,
    categoryName: 'Smart Home & Audio',
    title: 'Smart Voice-Controlled Speaker with Alexa',
    description: 'Room-filling balanced audio with smart home automation hub built right in.',
    price: 49.99,
    stock: 150,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'],
    rating: 4.5,
    num_reviews: 310,
  },
  {
    id: 5,
    categoryName: 'Smart Home & Audio',
    title: '4K Ultra HD Streaming Media Player',
    description: 'Cinematic 4K streaming with Dolby Vision, HDR10+, and Wi-Fi 6 support.',
    price: 39.99,
    stock: 85,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
    rating: 4.4,
    num_reviews: 215,
  },
  {
    id: 6,
    categoryName: 'Clothing & Fashion',
    title: 'Men\'s Classic Waterproof Winter Parka',
    description: 'Windproof and water-resistant winter coat with faux-fur lined hood and fleece insulation.',
    price: 119.50,
    stock: 35,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce667823?w=800&q=80'],
    rating: 4.3,
    num_reviews: 56,
  },
  {
    id: 7,
    categoryName: 'Clothing & Fashion',
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
    categoryName: 'Home & Kitchen',
    title: 'Programmable Stainless Steel Coffee Maker',
    description: 'Brew up to 12 cups of fresh coffee with programmable 24-hour timer and auto-pause.',
    price: 69.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80'],
    rating: 4.6,
    num_reviews: 88,
  },
  {
    id: 9,
    categoryName: 'Home & Kitchen',
    title: 'Non-Stick Ceramic Cookware Set (10-Piece)',
    description: 'Toxin-free nonstick pots and pans set suitable for induction, gas, and electric stovetops.',
    price: 149.00,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1584990347449-37ec0e3c5443?w=800&q=80'],
    rating: 4.8,
    num_reviews: 64,
  },
  {
    id: 10,
    categoryName: 'Books & Media',
    title: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to the architecture, storage engines, distributed consensus, and scalability of modern databases.',
    price: 38.50,
    stock: 75,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'],
    rating: 4.9,
    num_reviews: 430,
  },
  {
    id: 11,
    categoryName: 'Books & Media',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'A must-read handbook of agile software engineering principles, patterns, and refactoring techniques.',
    price: 42.00,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&q=80'],
    rating: 4.7,
    num_reviews: 312,
  },
  {
    id: 12,
    categoryName: 'Computers & Accessories',
    title: '27-inch 4K UHD IPS Designer Monitor',
    description: 'Ultra-sharp 3840x2160 resolution with 99% sRGB color accuracy and USB-C 65W power delivery.',
    price: 349.99,
    stock: 18,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
    rating: 4.6,
    num_reviews: 83,
  },
];

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const productId = parseInt(id, 10);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/products/${productId}`)
      .then((res) => {
        if (isMounted && res.data) setProduct(res.data);
      })
      .catch((err) => {
        console.warn('Backend product lookup fallback:', err.message);
        const match = SEED_CATALOG.find((p) => p.id === productId);
        if (isMounted) setProduct(match || SEED_CATALOG[0]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Fetch reviews
    api
      .get(`/products/${productId}/reviews`)
      .then((res) => {
        if (isMounted && res.data) setReviews(res.data);
      })
      .catch((err) => {
        if (isMounted) {
          setReviews([
            {
              id: 1,
              user_name: 'David Miller',
              rating: 5,
              comment: 'Super fast delivery and the product quality exceeded my expectations!',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 2,
              user_name: 'Jessica Taylor',
              rating: 4,
              comment: 'Great value for money. Minor packaging dent but the item was flawless.',
              created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
          ]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setReviewSubmitting(true);
    setReviewSuccess(false);

    try {
      const res = await api.post(`/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.data?.review) {
        setReviews([res.data.review, ...reviews]);
      }
      if (res.data?.updatedProduct) {
        setProduct((prev) => ({
          ...prev,
          rating: res.data.updatedProduct.rating,
          num_reviews: res.data.updatedProduct.num_reviews,
        }));
      }
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      // Offline simulation fallback
      const localReview = {
        id: Date.now(),
        user_name: 'You (Verified Buyer)',
        rating: reviewRating,
        comment: reviewComment,
        created_at: new Date().toISOString(),
      };
      setReviews([localReview, ...reviews]);
      setProduct((prev) => ({
        ...prev,
        rating: parseFloat(
          (
            (parseFloat(prev?.rating || 4.5) * (prev?.num_reviews || 10) + reviewRating) /
            ((prev?.num_reviews || 10) + 1)
          ).toFixed(1)
        ),
        num_reviews: (prev?.num_reviews || 10) + 1,
      }));
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } finally {
      setReviewSubmitting(false);
    }
  };

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
          <Link to="/" className="text-amber-600 hover:underline mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
          <span>/</span>
          <span>{product.categoryName || 'Products'}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Image Column */}
          <div className="md:col-span-5 flex items-center justify-center bg-gray-50 rounded-lg p-6 border border-gray-100">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
              alt={product.title}
              className="max-h-96 w-full object-contain"
            />
          </div>

          {/* Details Column */}
          <div className="md:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Award size={12} /> Amazon Clone's Choice
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.title}</h1>

            <div className="flex items-center gap-2 mt-2 text-sm text-amber-500">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(product.rating || 4.5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-gray-700 font-medium">{product.rating || 4.8}</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600 hover:underline cursor-pointer">
                {product.num_reviews || 128} ratings
              </span>
            </div>

            <hr className="my-4 border-gray-200" />

            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500">$</span>
              <span className="text-3xl font-extrabold text-gray-900">
                {parseFloat(product.price).toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              <span className="text-amber-600 font-semibold">prime</span> FREE delivery with Prime
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">About this item</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-amber-500" />
                <span>Fast Tracked Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Verified Authentic Seller</span>
              </div>
            </div>
          </div>

          {/* Buy Box */}
          <div className="md:col-span-3 border border-gray-200 rounded-lg p-5 h-fit bg-gray-50/60">
            <div className="text-2xl font-bold text-gray-900">
              ${parseFloat(product.price).toFixed(2)}
            </div>
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
              <p>Ships from: Amazon Logistics</p>
              <p>Sold by: Official Certified Partner</p>
              <p>Returns: 30-day refund policy</p>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews & Ratings</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Rating Aggregates */}
            <div className="md:col-span-4 border-r md:pr-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gray-900">{product.rating || 4.8}</span>
                <span className="text-sm text-gray-500">out of 5</span>
              </div>

              <div className="flex items-center gap-1 my-2 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < Math.floor(product.rating || 4.5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500 mb-6">{product.num_reviews || 128} global ratings</p>

              {/* Write a review box */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-1">Review this product</h3>
                <p className="text-xs text-gray-500 mb-4">Share your thoughts with other customers</p>

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            size={22}
                            className={
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Review</label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="What did you like or dislike? How was the build quality?"
                      required
                      className="w-full border border-gray-300 rounded p-2.5 text-xs outline-none focus:border-amber-500"
                    ></textarea>
                  </div>

                  {reviewSuccess && (
                    <p className="text-xs text-emerald-600 font-semibold">Review submitted and rating updated!</p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold text-xs py-2 px-4 rounded-full shadow-sm transition"
                  >
                    {reviewSubmitting ? 'Posting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Reviews List */}
            <div className="md:col-span-8 space-y-6">
              <h3 className="font-bold text-sm text-gray-900 mb-4">Top Reviews</h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-gray-500">No written reviews yet. Be the first to review this product!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="pb-6 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                        {rev.user_name ? rev.user_name[0].toUpperCase() : 'C'}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{rev.user_name || 'Verified Purchaser'}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
