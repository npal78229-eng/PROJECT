import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ShoppingBag, DollarSign, CheckCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 142,
    totalOrders: 68,
    totalRevenue: 12450.75,
    totalProducts: 12,
  });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/admin/overview').catch(() => ({ data: stats })),
      api.get('/admin/orders').catch(() => ({
        data: [
          {
            id: 100234,
            customer_name: 'Jane Buyer',
            customer_email: 'buyer@test.com',
            total_amount: '349.99',
            status: 'paid',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 100235,
            customer_name: 'Jane Buyer',
            customer_email: 'buyer@test.com',
            total_amount: '199.99',
            status: 'shipped',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      })),
      api.get('/admin/users').catch(() => ({
        data: [
          { id: 1, name: 'Amazon Store Admin', email: 'admin@amazonclone.com', role: 'admin' },
          { id: 2, name: 'Certified Seller', email: 'seller@test.com', role: 'seller' },
          { id: 3, name: 'Jane Buyer', email: 'buyer@test.com', role: 'customer' },
        ],
      })),
    ])
      .then(([statsRes, ordersRes, usersRes]) => {
        if (isMounted) {
          if (statsRes.data) setStats(statsRes.data);
          if (ordersRes.data) setOrders(ordersRes.data);
          if (usersRes.data) setUsers(usersRes.data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Platform Admin Operations</h1>
            <p className="text-xs text-gray-500">System-wide governance, customer orders, and catalog management</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold text-xs border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-amber-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-semibold text-xs border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-amber-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold text-xs border-b-2 transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registered Users ({users.length})
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Total Revenue</p>
              <h3 className="text-2xl font-extrabold text-gray-900">${stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Total Orders</p>
              <h3 className="text-2xl font-extrabold text-gray-900">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Total Customers</p>
              <h3 className="text-2xl font-extrabold text-gray-900">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <PackageCheck size={24} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Catalog Products</p>
              <h3 className="text-2xl font-extrabold text-gray-900">{stats.totalProducts}</h3>
            </div>
          </div>
        </div>

        {/* Content depending on tab */}
        {activeTab === 'orders' || activeTab === 'overview' ? (
          <div className="bg-white rounded-xl border shadow-xs overflow-hidden mb-8">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-sm">Customer Order Fulfillment</h2>
              <span className="text-xs text-gray-500">Click a status to update workflow</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] text-gray-400 uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">#{o.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 block">{o.customer_name || 'Customer'}</span>
                        <span className="text-[11px] text-gray-400">{o.customer_email || 'email@domain.com'}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">${parseFloat(o.total_amount).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status?.toUpperCase() || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'paid')}
                          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold"
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'shipped')}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold"
                        >
                          Ship
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'delivered')}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold"
                        >
                          Deliver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'users' ? (
          <div className="bg-white rounded-xl border shadow-xs overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-bold text-gray-900 text-sm">Platform Accounts & Roles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] text-gray-400 uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{u.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
