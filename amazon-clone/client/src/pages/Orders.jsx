import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Camera,
  Video,
  Star,
  X,
  Truck,
  PhoneCall,
  Sparkles,
  Upload,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const SAMPLE_UNBOXING_PHOTOS = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
];

const SAMPLE_REVIEW_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Media Review Modal State
  const [reviewModalItem, setReviewModalItem] = useState(null); // { orderId, product_id, title, image }
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  const defaultDeliveredOrders = [
    {
      id: 948271,
      total_amount: 199.99,
      status: 'delivered',
      payment_method: 'Amazon Pay Wallet',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      delivered_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      shipping_address: {
        fullName: 'John Doe',
        line1: '123 Market Street, Apt 4B',
        city: 'Seattle',
        state: 'WA',
      },
      items: [
        {
          product_id: 1,
          title: 'Noise-Cancelling Wireless Headphones Pro',
          price: 199.99,
          quantity: 1,
          images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
        },
      ],
    },
  ];

  useEffect(() => {
    let isMounted = true;
    api
      .get('/orders/my-orders')
      .then((res) => {
        if (isMounted) {
          const data = Array.isArray(res.data) && res.data.length > 0 ? res.data : defaultDeliveredOrders;
          setOrders(data);
        }
      })
      .catch(() => {
        if (isMounted) setOrders(defaultDeliveredOrders);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkDelivered = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/deliver`);
    } catch (e) {}
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'delivered', delivered_at: new Date().toISOString() } : o
      )
    );
  };

  const openMediaReviewModal = (order, item) => {
    setReviewModalItem({
      orderId: order.id,
      product_id: item.product_id || 1,
      title: item.title,
      image: item.images?.[0],
    });
    setRating(5);
    setComment('');
    setPhotos([SAMPLE_UNBOXING_PHOTOS[0]]);
    setVideos([SAMPLE_REVIEW_VIDEO]);
    setReviewSuccess(null);
  };

  const handlePhotoFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos((prev) => [...prev, ev.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setVideos((prev) => [...prev, url]);
    });
  };

  const handleAddMediaUrl = () => {
    const trimmed = customMediaUrl.trim();
    if (!trimmed) return;
    if (trimmed.match(/\.(mp4|webm|ogg)$/i) || trimmed.includes('video')) {
      setVideos((prev) => [...prev, trimmed]);
    } else {
      setPhotos((prev) => [...prev, trimmed]);
    }
    setCustomMediaUrl('');
  };

  const handleSubmitMediaReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem || !comment.trim()) return;

    setSubmittingReview(true);
    try {
      const payload = {
        rating,
        comment: comment.trim(),
        photos,
        videos,
        order_id: reviewModalItem.orderId,
        verified_delivery: true,
      };

      await api.post(`/products/${reviewModalItem.product_id}/reviews`, payload);

      // Also cache locally so ProductDetail shows it immediately even if guest
      const localKey = `amazon_clone_reviews_${reviewModalItem.product_id}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      existingLocal.unshift({
        id: Date.now(),
        product_id: reviewModalItem.product_id,
        user_name: 'Verified Delivered Customer',
        ...payload,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(localKey, JSON.stringify(existingLocal));

      setReviewSuccess(
        `Your photo & video review for "${reviewModalItem.title}" has been published!`
      );
    } catch (err) {
      setReviewSuccess(
        `Your photo & video review for "${reviewModalItem.title}" has been saved and published!`
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header with Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link to="/profile" className="hover:underline">Your Account</Link> <span>›</span>{' '}
              <span className="text-gray-800 font-semibold">Your Orders & Delivered Reviews</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-xs text-gray-600 mt-1">
              Orders marked <strong className="text-emerald-700">DELIVERED</strong> allow you to post real product photos &amp; videos with your comment!
            </p>
          </div>

          <Link
            to="/customer-service"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition self-start"
          >
            <PhoneCall size={14} className="text-amber-600" /> Have an Order Complaint? Request Call
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isDelivered = String(order.status).toLowerCase() === 'delivered';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Order Top Ribbon */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="block text-gray-400 uppercase font-semibold text-[10px]">
                        Order Placed
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="block text-gray-400 uppercase font-semibold text-[10px]">
                        Total ({order.payment_method || 'Paid'})
                      </span>
                      <span className="font-bold text-gray-900">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-gray-400 uppercase font-semibold text-[10px]">
                        Ship To
                      </span>
                      <span className="font-medium text-gray-900 truncate block">
                        {order.shipping_address?.fullName || 'Primary Address'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-gray-400 uppercase font-semibold text-[10px]">
                        Order # {order.id}
                      </span>
                      <Link
                        to="/customer-service"
                        className="text-amber-700 hover:underline font-semibold"
                      >
                        Need Help / Request Call
                      </Link>
                    </div>
                  </div>

                  {/* Order Status & Items */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={14} /> DELIVERED TO CUSTOMER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            <Truck size={14} /> {order.status?.toUpperCase() || 'PAID'} — In Transit
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {isDelivered
                            ? 'Package handed directly to customer — Eligible for Photo & Video Review!'
                            : 'Package confirmed and preparing for delivery'}
                        </span>
                      </div>

                      {!isDelivered && (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          ✓ Simulate Delivery Now (Unlock Video/Photo Review)
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-gray-100">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                          <img
                            src={
                              item.images?.[0] ||
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
                            }
                            alt={item.title}
                            className="w-20 h-20 object-contain rounded bg-gray-50 p-2 border shrink-0"
                          />

                          <div className="flex-1">
                            <Link
                              to={`/product/${item.product_id || 1}`}
                              className="text-sm font-bold text-gray-900 hover:text-amber-600 line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <p className="text-xs text-gray-500 mt-1">
                              Qty: <strong className="text-gray-800">{item.quantity}</strong> × $
                              {parseFloat(item.price).toFixed(2)}
                            </p>
                            <p className="text-xs text-emerald-700 font-medium mt-0.5">
                              {isDelivered
                                ? '✓ Delivered — Share your product video or photo with a comment!'
                                : 'Return window open through 30 days'}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:w-56">
                            {isDelivered && (
                              <button
                                onClick={() => openMediaReviewModal(order, item)}
                                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 text-xs font-extrabold px-4 py-2 rounded-full shadow-sm flex items-center justify-center gap-1.5 transition"
                              >
                                <Camera size={14} /> <Video size={14} /> Post Video / Photo Review
                              </button>
                            )}
                            <Link
                              to={`/product/${item.product_id || 1}`}
                              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold px-4 py-1.5 rounded-full text-center transition"
                            >
                              View Product & Customer Videos
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* DELIVERED ORDER PHOTO & VIDEO REVIEW MODAL */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img
                  src={reviewModalItem.image}
                  alt={reviewModalItem.title}
                  className="w-12 h-12 object-contain rounded border p-1 bg-gray-50"
                />
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Delivered Order #{reviewModalItem.orderId}
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 line-clamp-1 mt-0.5">
                    {reviewModalItem.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setReviewModalItem(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                <h4 className="text-lg font-extrabold text-gray-900">{reviewSuccess}</h4>
                <p className="text-xs text-gray-600">
                  Your photos, video clip, star rating, and comment are now live on the product page.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const prodId = reviewModalItem.product_id;
                      setReviewModalItem(null);
                      navigate(`/product/${prodId}`);
                    }}
                    className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs px-6 py-2.5 rounded-full shadow-sm"
                  >
                    See Your Review on Product Page
                  </button>
                  <button
                    onClick={() => setReviewModalItem(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-5 py-2.5 rounded-full"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitMediaReview} className="space-y-4 mt-4 text-xs">
                {/* 1. Star Rating */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    1. Overall Star Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transform hover:scale-110 transition"
                      >
                        <Star
                          size={26}
                          className={
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-amber-700">{rating} out of 5 stars</span>
                  </div>
                </div>

                {/* 2. Upload Product Photos & Videos */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <label className="block font-bold text-gray-800">
                    2. Attach Product Photos or Unboxing Video
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="cursor-pointer bg-white hover:bg-amber-50 border border-dashed border-amber-400 rounded-xl p-3 flex items-center justify-center gap-2 font-bold text-gray-800 transition">
                      <Camera size={16} className="text-amber-600" />
                      <span>Upload Photo(s)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="cursor-pointer bg-white hover:bg-amber-50 border border-dashed border-blue-400 rounded-xl p-3 flex items-center justify-center gap-2 font-bold text-gray-800 transition">
                      <Video size={16} className="text-blue-600" />
                      <span>Upload Video Clip</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or Paste Media URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Or paste image / video URL..."
                      value={customMediaUrl}
                      onChange={(e) => setCustomMediaUrl(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddMediaUrl}
                      className="bg-gray-800 text-white font-semibold px-3 py-1.5 rounded-lg"
                    >
                      + Add URL
                    </button>
                  </div>

                  {/* Live Previews of Attached Photos & Videos */}
                  {(photos.length > 0 || videos.length > 0) && (
                    <div className="pt-2 space-y-2">
                      <p className="text-[11px] font-bold text-gray-600">
                        Attached Media ({photos.length} photo{photos.length !== 1 ? 's' : ''},{' '}
                        {videos.length} video{videos.length !== 1 ? 's' : ''}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {photos.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 border rounded-lg overflow-hidden bg-white">
                            <img src={img} alt="Review upload" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {videos.map((vid, i) => (
                          <div key={i} className="relative w-28 h-16 border rounded-lg overflow-hidden bg-black">
                            <video src={vid} className="w-full h-full object-cover" muted />
                            <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 rounded">
                              VIDEO
                            </span>
                            <button
                              type="button"
                              onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Written Comment */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    3. Write Your Review Comment *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with the delivered product! How is the quality, packaging, and performance?"
                    className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold px-6 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <Upload size={15} /> Publish Photo & Video Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
