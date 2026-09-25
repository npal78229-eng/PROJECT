import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  Wallet as WalletIcon,
  Scale,
} from 'lucide-react';
import api from '../api/axios';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! 👋 I'm your **Amazon Clone AI Assistant**. Ask me about:\n• **Delivered Orders** & uploading **Photo/Video Reviews**\n• **Amazon Pay Wallet** ($250 balance & promo codes)\n• **Product Comparison**\n• **Customer Service Live Chat** or **Requesting a Call for a Complaint**",
      suggestions: [
        'Post Photo/Video Review',
        'Amazon Wallet & Promo Codes',
        'Compare Products',
        'Request Call for Complaint',
      ],
      actionLink: null,
    },
  ]);

  const sendMessage = async (textToSend) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/support/chatbot', { message: query });
      setMessages((prev) => [
        ...prev,
        {
          id: 'b_' + Date.now(),
          sender: 'bot',
          text: data.reply,
          suggestions: data.suggestions || [],
          actionLink: data.actionLink || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'b_' + Date.now(),
          sender: 'bot',
          text: 'I can take you directly to our Customer Service Hub, Wallet, Product Comparison, or Orders page!',
          suggestions: ['Open Amazon Wallet', 'Compare Products', 'Request Call for Complaint'],
          actionLink: { label: 'Open Customer Service Hub', path: '/customer-service' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Open Chat Panel */}
      {isOpen ? (
        <div className="w-[350px] sm:w-[390px] h-[510px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#131921] to-[#232f3e] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-xs font-extrabold flex items-center gap-1.5">
                  Amazon AI Assistant <Sparkles size={12} className="text-amber-400" />
                </p>
                <p className="text-[10px] text-emerald-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online • Instant Store & Support Guide
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-[#131921] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {m.text}

                  {m.actionLink && (
                    <button
                      onClick={() => {
                        navigate(m.actionLink.path);
                      }}
                      className="mt-2.5 w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      {m.actionLink.label} <ExternalLink size={12} />
                    </button>
                  )}
                </div>

                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(sug)}
                        className="text-[11px] bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-900 border border-gray-200 hover:border-amber-400 px-2.5 py-1 rounded-full transition shadow-sm"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-gray-400 italic px-2">Assistant is typing...</div>
            )}
          </div>

          {/* Bottom Quick Navigation Bar */}
          <div className="px-3 py-1.5 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-[11px]">
            <button
              onClick={() => navigate('/wallet')}
              className="flex items-center gap-1 text-gray-700 hover:text-amber-700 font-semibold"
            >
              <WalletIcon size={12} /> Wallet
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="flex items-center gap-1 text-gray-700 hover:text-amber-700 font-semibold"
            >
              <Scale size={12} /> Compare
            </button>
            <button
              onClick={() => navigate('/customer-service')}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
            >
              <PhoneCall size={12} /> Request Call
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI chatbot anything..."
              className="flex-1 border border-gray-300 rounded-full px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-500 text-gray-950 p-2 rounded-full shadow-sm transition"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        /* Floating Launcher Button */
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#131921] to-[#232f3e] hover:from-gray-900 hover:to-gray-800 text-white px-4 py-3 rounded-full shadow-xl border-2 border-amber-400 flex items-center gap-2.5 group transition transform hover:scale-105"
        >
          <div className="relative">
            <Bot size={22} className="text-amber-400" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-gray-900"></span>
          </div>
          <div className="text-left leading-tight">
            <span className="block text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
              24/7 AI Helper
            </span>
            <span className="block text-xs font-extrabold text-white">Chat Bot & Support</span>
          </div>
        </button>
      )}
    </div>
  );
}
