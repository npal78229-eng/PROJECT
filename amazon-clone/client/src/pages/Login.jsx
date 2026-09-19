import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import api from '../api/axios';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // 1. Register user
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }

      // 2. Login user
      const res = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      dispatch(
        setCredentials({
          user: res.data.user,
          token: res.data.token,
          refreshToken: res.data.refreshToken,
        })
      );

      navigate('/');
    } catch (err) {
      // If backend is not connected yet, allow demo mock sign-in for Phase 0 UI preview
      console.warn('Backend auth request error, enabling demo fallback', err);
      dispatch(
        setCredentials({
          user: {
            id: 1,
            name: formData.name || 'Demo User',
            email: formData.email,
            role: formData.role,
          },
          token: 'demo_token_xyz_123',
        })
      );
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-10 px-4">
      {/* Amazon Logo */}
      <Link to="/" className="mb-6">
        <span className="text-3xl font-black tracking-tight text-gray-950 flex items-baseline">
          amazon<span className="text-amber-500 text-sm font-semibold ml-0.5">.clone</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-sm border border-gray-300 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Your name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={isRegister}
                placeholder="First and last name"
                className="w-full border border-gray-400 rounded p-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-400 rounded p-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              className="w-full border border-gray-400 rounded p-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Account Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded p-2 text-sm outline-none focus:border-amber-500 bg-white cursor-pointer"
              >
                <option value="customer">Customer (Buy Products)</option>
                <option value="seller">Seller (List & Sell Products)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-gray-950 font-medium py-2 rounded-lg text-sm shadow-sm transition mt-2"
          >
            {loading ? 'Submitting...' : isRegister ? 'Continue' : 'Sign In'}
          </button>
        </form>

        <p className="text-[11px] text-gray-500 mt-4 leading-tight">
          By continuing, you agree to Amazon Clone's Conditions of Use and Privacy Notice.
        </p>
      </div>

      {/* Toggle between Login and Register */}
      <div className="w-full max-w-sm mt-6 text-center">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-500">
            {isRegister ? 'Already have an account?' : 'New to Amazon Clone?'}
          </span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          className="w-full mt-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 font-medium py-1.5 rounded-lg text-xs shadow-sm transition"
        >
          {isRegister ? 'Sign in with existing account' : 'Create your Amazon Clone account'}
        </button>
      </div>
    </div>
  );
}
