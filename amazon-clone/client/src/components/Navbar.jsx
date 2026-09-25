import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  ShoppingCart,
  MapPin,
  LogOut,
  Package,
  Wallet as WalletIcon,
  Scale,
  Headphones,
  Settings as SettingsIcon,
  PhoneCall,
} from 'lucide-react';
import { logout } from '../redux/authSlice';

export default function Navbar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const { items } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const compareItems = useSelector((state) => state.compare?.items || []);
  const walletBalance = useSelector((state) => state.wallet?.balance ?? 250.0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm, category);
    } else {
      navigate(`/?q=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top Main Navbar */}
      <div className="bg-[#131921] text-white px-4 py-2 flex items-center gap-3 text-sm">
        {/* Amazon Logo / Brand */}
        <Link to="/" className="flex items-center gap-1 hover:border border-white p-1 rounded shrink-0">
          <span className="text-xl font-black tracking-tight text-white flex items-baseline">
            amazon<span className="text-amber-400 text-xs font-semibold ml-0.5">.clone</span>
          </span>
        </Link>

        {/* Deliver to Location */}
        <Link
          to="/settings"
          className="hidden lg:flex items-center gap-1 hover:border border-white p-1 rounded cursor-pointer shrink-0"
          title="Update delivery address in Settings"
        >
          <MapPin size={16} className="text-gray-300" />
          <div className="text-xs leading-tight">
            <p className="text-gray-400">Deliver to</p>
            <p className="font-bold text-white">United States</p>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-1 items-stretch rounded-md overflow-hidden bg-white">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-100 text-gray-700 text-xs px-2 border-r outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="1">Electronics</option>
            <option value="2">Computers</option>
            <option value="3">Audio & Smart Home</option>
            <option value="4">Clothing & Fashion</option>
            <option value="5">Home & Kitchen</option>
            <option value="6">Books</option>
          </select>

          <input
            type="text"
            placeholder="Search Amazon Clone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-gray-900 px-3 py-2 text-sm outline-none"
          />

          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 flex items-center justify-center transition"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Right Actions: Wallet, Compare, Account, Orders, Settings, Cart */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Amazon Pay Wallet Quick Pill */}
          <Link
            to="/wallet"
            className="hidden md:flex items-center gap-1.5 bg-[#232f3e] hover:bg-gray-700 border border-amber-400/40 px-2.5 py-1 rounded-md text-xs leading-tight transition"
            title="Amazon Pay Wallet Balance"
          >
            <WalletIcon size={15} className="text-amber-400" />
            <div>
              <p className="text-[10px] text-gray-300">Amazon Wallet</p>
              <p className="font-bold text-amber-400">${Number(walletBalance).toFixed(2)}</p>
            </div>
          </Link>

          {/* Product Compare Quick Badge */}
          <Link
            to="/compare"
            className="hidden md:flex items-center gap-1 hover:border border-white p-1.5 rounded text-xs leading-tight relative"
            title="Compare Products"
          >
            <Scale size={17} className="text-amber-300" />
            <div className="hidden xl:block">
              <p className="text-gray-400 text-[10px]">Product</p>
              <p className="font-bold text-white">Compare ({compareItems.length})</p>
            </div>
            {compareItems.length > 0 && (
              <span className="xl:hidden bg-amber-400 text-gray-900 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {compareItems.length}
              </span>
            )}
          </Link>

          {/* Account & Lists */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link to="/profile" className="text-xs leading-tight hover:border border-white p-1 rounded">
                <p className="text-gray-400">Hello, {user?.name?.split(' ')[0] || 'User'}</p>
                <p className="font-bold text-white capitalize">{user?.role || 'Account'}</p>
              </Link>
              <button
                onClick={() => dispatch(logout())}
                title="Sign Out"
                className="text-gray-300 hover:text-white hover:border border-white p-1 rounded"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hover:border border-white p-1 rounded text-xs leading-tight">
              <p className="text-gray-400">Hello, sign in</p>
              <p className="font-bold text-white">Account & Lists</p>
            </Link>
          )}

          {/* Orders */}
          <Link to="/orders" className="hidden sm:flex items-center gap-1 hover:border border-white p-1 rounded text-xs leading-tight">
            <Package size={16} className="text-gray-300" />
            <div>
              <p className="text-gray-400">Returns</p>
              <p className="font-bold text-white">& Orders</p>
            </div>
          </Link>

          {/* Settings Icon */}
          <Link
            to="/settings"
            title="Account & App Settings"
            className="hover:border border-white p-1.5 rounded text-gray-200 hover:text-amber-400 transition"
          >
            <SettingsIcon size={18} />
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex items-center gap-1 hover:border border-white p-1 rounded relative">
            <div className="relative">
              <ShoppingCart size={25} className="text-white" />
              <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-900 text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <span className="hidden sm:inline font-bold text-sm text-white self-end">Cart</span>
          </Link>
        </div>
      </div>

      {/* Subnav Ribbon */}
      <div className="bg-[#232f3e] text-white px-4 py-1.5 flex items-center gap-5 text-xs overflow-x-auto whitespace-nowrap">
        <Link to="/" className="font-bold flex items-center gap-1 hover:text-amber-400">
          <span>☰</span> All Products
        </Link>
        <Link to="/wallet" className="hover:text-amber-400 flex items-center gap-1 text-amber-300 font-semibold">
          <WalletIcon size={13} /> Amazon Pay Wallet (${Number(walletBalance).toFixed(2)})
        </Link>
        <Link to="/compare" className="hover:text-amber-400 flex items-center gap-1">
          <Scale size={13} /> Compare Products ({compareItems.length})
        </Link>
        <Link to="/orders" className="hover:text-amber-400 flex items-center gap-1">
          <Package size={13} /> Delivered Orders & Media Reviews
        </Link>
        <Link to="/customer-service" className="hover:text-amber-400 flex items-center gap-1 text-emerald-300 font-semibold">
          <Headphones size={13} /> Customer Service Chat & Request Call
        </Link>
        <Link to="/settings" className="hover:text-amber-400 flex items-center gap-1">
          <SettingsIcon size={13} /> Settings
        </Link>
        <Link to="/seller" className="hover:text-amber-400 font-medium text-amber-200 ml-auto">
          Seller Dashboard
        </Link>
        <Link to="/admin" className="hover:text-amber-400 font-medium text-purple-300">
          Admin Portal
        </Link>
      </div>
    </header>
  );
}
