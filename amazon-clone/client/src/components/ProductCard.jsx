import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShoppingCart } from 'lucide-react';
import { addToCart } from '../redux/cartSlice';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({ product_id: product.id, quantity: 1 }));
  };

  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col p-4 relative group">
      <Link to={`/product/${product.id}`} className="block relative aspect-square mb-3 overflow-hidden rounded bg-gray-50 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={product.title}
          className="object-contain max-h-48 w-full group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/product/${product.id}`}
            className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-amber-600 transition"
          >
            {product.title}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-gray-500 ml-1">({product.num_reviews || 12})</span>
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-gray-500">$</span>
            <span className="text-xl font-bold text-gray-900">{parseFloat(product.price).toFixed(2)}</span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-amber-600 font-semibold">prime</span> FREE Next-Day Delivery
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-gray-900 text-xs font-semibold py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
