import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Headphones,
  MessageSquare,
  PhoneCall,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Package,
  Wallet as WalletIcon,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function CustomerService() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'call'

  // Live Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('948271');
  const [sendingChat, setSendingChat] = useState(false);

  // Request a Call for Complaint State
  const [callRequests, setCallRequests] = useState([]);
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [callOrderId, setCallOrderId] = useState('948271');
  const [category, setCategory] = useState('Defective / Damaged Product');
  const [urgency, setUrgency] = useState('Immediate Callback (< 2 mins)');
  const [preferredTime, setPreferredTime] = useState('Right Now');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [callSuccessMsg, setCallSuccessMsg] = useState(null);
  const [callErrorMsg, setCallErrorMsg] = useState(null);
  const [submittingCall, setSubmittingCall] = useState(false);

  useEffect(() => {
    api
      .get('/support/chat')
      .then((res) => setMessages(res.data || []))
      .catch(() => {
        setMessages([
          {
            id: 'msg_welcome',
            sender: 'agent',
            agentName: 'Maya (Senior Customer Care Specialist)',
            text: 'Hello! Welcome to Amazon Clone 24/7 Customer Service. I can assist you with order delivery complaints, instant Amazon Wallet refunds, damaged item replacements, or arrange an immediate phone call from our Escalations Supervisor.',
            timestamp: new Date().toISOString(),
          },
        ]);
      });

    api
      .get('/support/call-requests')
      .then((res) => setCallRequests(res.data || []))
      .catch(() => {});
  }, []);

  const handleSendChat = async (e, presetText) => {
    if (e) e.preventDefault();
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    setSendingChat(true);
    try {
      const { data } = await api.post('/support/chat', {
        text: textToSend,
        orderId: selectedOrder,
      });
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
      if (!presetText) setChatInput('');
    } catch (err) {
      const userMsg = {
        id: 'u_' + Date.now(),
        sender: 'user',
        text: textToSend,
        orderId: selectedOrder,
        timestamp: new Date().toISOString(),
      };
      const agentMsg = {
        id: 'a_' + (Date.now() + 1),
        sender: 'agent',
        agentName: 'Maya (Senior Customer Care Specialist)',
        text: `I have logged your priority request regarding Order #${selectedOrder}. I can issue an instant credit to your Amazon Pay Wallet or connect a supervisor to call you within 2 minutes.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      if (!presetText) setChatInput('');
    } finally {
      setSendingChat(false);
    }
  };

  const handleRequestCall = async (e) => {
    e.preventDefault();
    setCallErrorMsg(null);
    setCallSuccessMsg(null);

    if (!phone.trim() || !complaintDetails.trim()) {
      setCallErrorMsg('Please provide your phone number and complaint description.');
      return;
    }

    setSubmittingCall(true);
    try {
      const { data } = await api.post('/support/call-requests', {
        phone,
        orderId: callOrderId,
        category,
        urgency,
        preferredTime,
        complaintDetails,
      });
      setCallSuccessMsg(data.message);
      if (Array.isArray(data.requests)) {
        setCallRequests(data.requests);
      } else if (data.ticket) {
        setCallRequests((prev) => [data.ticket, ...prev]);
      }
      setComplaintDetails('');
    } catch (err) {
      const fallbackTicket = {
        id: 'CALL-' + Math.floor(10000 + Math.random() * 90000),
        phone,
        orderId: callOrderId,
        category,
        urgency,
        preferredTime,
        complaintDetails,
        assignedAgent: 'Sarah Jenkins (Resolution Supervisor)',
        status: 'Connecting Call Now (Est. < 2 mins)',
        created_at: new Date().toISOString(),
      };
      setCallRequests((prev) => [fallbackTicket, ...prev]);
      setCallSuccessMsg(
        `Callback request ${fallbackTicket.id} confirmed! ${fallbackTicket.assignedAgent} is calling ${phone}.`
      );
      setComplaintDetails('');
    } finally {
      setSubmittingCall(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#131921] to-[#232f3e] text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 rounded-full mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Live Resolution Center • <span className="text-white">Zero Hold Time</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
              <Headphones className="text-amber-400" size={30} /> Customer Service & Complaint Escalation
            </h1>
            <p className="text-xs text-gray-300 mt-1.5 max-w-2xl">
              Chat live with a Senior Support Specialist or request an immediate phone callback for any product complaint, delivery issue, or refund inquiry.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex bg-gray-900/80 p-1.5 rounded-xl border border-gray-700 shrink-0 self-start">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'chat'
                  ? 'bg-amber-400 text-gray-950 shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <MessageSquare size={15} /> Live Customer Service Chat
            </button>
            <button
              onClick={() => setActiveTab('call')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'call'
                  ? 'bg-amber-400 text-gray-950 shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <PhoneCall size={15} /> Request Call for Complaint
            </button>
          </div>
        </div>

        {/* Quick Self-Service Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link
            to="/orders"
            className="bg-white hover:border-amber-400 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition"
          >
            <Package size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Delivered Orders</p>
              <p className="text-[11px] text-gray-500">Post Photo/Video Review</p>
            </div>
          </Link>

          <Link
            to="/wallet"
            className="bg-white hover:border-amber-400 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition"
          >
            <WalletIcon size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Instant Refunds</p>
              <p className="text-[11px] text-gray-500">Check Amazon Pay Wallet</p>
            </div>
          </Link>

          <button
            onClick={() => setActiveTab('call')}
            className="bg-white hover:border-amber-400 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition text-left"
          >
            <PhoneCall size={20} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Priority Callback</p>
              <p className="text-[11px] text-gray-500">Speak to Supervisor (&lt; 2m)</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className="bg-white hover:border-amber-400 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition text-left"
          >
            <MessageSquare size={20} className="text-purple-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">24/7 Live Chat</p>
              <p className="text-[11px] text-gray-500">Real-time Order Help</p>
            </div>
          </button>
        </div>

        {/* TAB 1: LIVE CUSTOMER SERVICE CHAT */}
        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Window */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[560px] overflow-hidden">
              {/* Chat Top Bar */}
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    M
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      Maya — Senior Customer Care Specialist
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Connected • Linked to Order #{selectedOrder}
                    </p>
                  </div>
                </div>

                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-gray-700 outline-none"
                >
                  <option value="948271">Order #948271 (Headphones Pro)</option>
                  <option value="948105">Order #948105 (14-inch Laptop)</option>
                  <option value="General">General Account / Wallet Inquiry</option>
                </select>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-gray-400 mb-1 px-1">
                        {isUser ? 'You' : msg.agentName || 'Support Agent'}
                      </span>
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-[#131921] text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Topic Pills */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                {[
                  'My delivered item is damaged, need replacement',
                  'Request instant refund to my Amazon Wallet',
                  'Package tracking has not updated',
                  'Please have a supervisor call my phone',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendChat(null, prompt)}
                    className="text-[11px] bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-900 border border-gray-200 hover:border-amber-400 px-3 py-1 rounded-full transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => handleSendChat(e)}
                className="p-3.5 bg-white border-t border-gray-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your complaint or question for Maya..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={sendingChat}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition"
                >
                  <Send size={14} /> Send
                </button>
              </form>
            </div>

            {/* Right Sidebar: Need a Phone Call Instead? */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <PhoneCall size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Prefer to Speak on the Phone for a Complaint?
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Skip waiting on hold. Submit a Complaint Callback Request and our Escalations Lead will dial your number directly within 2 minutes.
                </p>
                <button
                  onClick={() => setActiveTab('call')}
                  className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <PhoneCall size={14} /> Request Callback for Complaint
                </button>
              </div>

              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 text-xs space-y-2">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" /> A-to-Z Complaint Guarantee
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Every order paid via Amazon Pay Wallet or Card is backed by instant replacement or 100% refund protection if the item arrives damaged or not as described.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: REQUEST A CALL FOR COMPLAINT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Callback Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <PhoneCall className="text-amber-500" size={22} /> Request a Phone Call for Complaint
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Enter your phone number and complaint details below. Our Escalations Specialist will call you directly.
              </p>

              {callSuccessMsg && (
                <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{callSuccessMsg}</span>
                </div>
              )}

              {callErrorMsg && (
                <div className="mb-6 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-xs font-medium">
                  {callErrorMsg}
                </div>
              )}

              <form onSubmit={handleRequestCall} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Your Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Related Order
                    </label>
                    <select
                      value={callOrderId}
                      onChange={(e) => setCallOrderId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                      <option value="948271">Order #948271 — Noise-Cancelling Headphones Pro ($199.99)</option>
                      <option value="948105">Order #948105 — Ultra-Slim 14-inch Laptop ($749.99)</option>
                      <option value="Wallet/Billing">Amazon Pay Wallet / Billing Dispute</option>
                      <option value="Other">Other Order / General Store Complaint</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Complaint Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                      <option value="Defective / Damaged Product">Defective or Damaged Product Received</option>
                      <option value="Missing Item / Late Delivery">Missing Package or Late Delivery</option>
                      <option value="Wrong Item Sent">Wrong Item or Counterfeit Complaint</option>
                      <option value="Refund / Amazon Wallet Issue">Refund Delay or Amazon Wallet Issue</option>
                      <option value="Courier / Delivery Agent Behavior">Courier / Delivery Agent Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Callback Urgency & Time Slot
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => {
                        setUrgency(e.target.value);
                        setPreferredTime(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                      <option value="Immediate Callback (< 2 mins)">Call Me Immediately (Est. wait &lt; 2 mins)</option>
                      <option value="Call Within 15 Minutes">Call Within 15 Minutes</option>
                      <option value="Today Evening (5:00 PM - 7:00 PM)">Schedule Today Evening (5:00 PM - 7:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Complaint Details & Resolution Requested *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Describe the issue with your order or product (e.g., 'Left earcup has static noise after delivery, requesting immediate replacement or full refund to my Amazon Wallet')..."
                    className="w-full border border-gray-300 rounded-lg p-3.5 text-xs text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingCall}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold text-sm py-3 px-6 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <PhoneCall size={16} /> Submit Complaint & Request Call Now
                </button>
              </form>
            </div>

            {/* Active Callback Tickets Tracker */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Clock size={18} className="text-amber-500" /> Active Callback Requests ({callRequests.length})
              </h3>

              <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                {callRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-gray-900 bg-amber-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                        {req.status}
                      </span>
                    </div>

                    <p className="font-bold text-gray-900">{req.category}</p>
                    <p className="text-gray-600 line-clamp-2">{req.complaintDetails}</p>

                    <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
                      <p>
                        <strong>Phone:</strong> {req.phone} • <strong>Order:</strong> #{req.orderId}
                      </p>
                      <p className="flex items-center gap-1 text-gray-800 font-medium">
                        <UserCheck size={13} className="text-emerald-600" /> Specialist: {req.assignedAgent}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
