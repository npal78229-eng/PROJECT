import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { User, Shield, Package, Store, LogOut, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { logout } from '../redux/authSlice';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: User Profile Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-2xl mb-4 border-2 border-amber-300">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>

            <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Customer'}</h2>
            <p className="text-xs text-gray-500 mb-3">{user?.email}</p>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} /> Active {user?.role ? user.role.toUpperCase() : 'CUSTOMER'}
            </span>

            <div className="w-full border-t border-gray-200 my-6"></div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 p-2.5 rounded-lg border border-red-200 transition"
            >
              <LogOut size={14} /> Sign Out of All Sessions
            </button>
          </div>

          {/* Right Column: Account Hub Options */}
          <div className="md:col-span-2 space-y-4">
            {/* Orders Tile */}
            <Link
              to="/orders"
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-amber-400 hover:shadow transition flex items-start gap-4"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Your Orders</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track, return, or buy things again. View receipts and delivery status.
                </p>
              </div>
            </Link>

            {/* Login & Security */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Shield size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Login & Security</h3>
                <p className="text-xs text-gray-500 mt-1">
                  JSON Web Tokens (JWT) access credentials are encrypted with bcrypt.
                </p>
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p><strong>User ID:</strong> #{user?.id || '1'}</p>
                  <p><strong>Primary Email:</strong> {user?.email}</p>
                  <p><strong>Account Role:</strong> {user?.role || 'customer'}</p>
                </div>
              </div>
            </div>

            {/* Seller Tile (conditional) */}
            {user?.role === 'seller' ? (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Seller Central</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage your merchant inventory, list products, and fulfill customer orders.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
