import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Wallet, 
  TrendingUp, 
  History, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  LogOut, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, fetchCurrentUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleResetVirtualCash = async () => {
    setResetting(true);
    setFeedback('');
    try {
      // Top up virtual cash back to 5 Lakhs
      await axios.post('/api/user/reset-balance', { amount: 500000 });
      await fetchCurrentUser();
      setFeedback('Virtual cash successfully reset to ₹5,00,000!');
    } catch (e) {
      // Local fallback
      user.walletBalance = 500000;
      setFeedback('Virtual cash reset to ₹5,00,000 in local session.');
    } finally {
      setResetting(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const balance = Number(user.walletBalance || 500000);
  const startingFund = 500000;
  const pnl = balance - startingFund;
  const pnlPct = ((pnl / startingFund) * 100).toFixed(2);
  const isProfit = pnl >= 0;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 font-sans">
      
      {/* 1. Header Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black text-xl">
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'PS'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900">{user.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200 font-mono">
                Verified Trader
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/history"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Order History</span>
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Virtual Cash & Paper Trading Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Virtual Balance Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Demo Cash</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00965e] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Virtual Demo Trading Balance</span>
          </div>
          <button
            onClick={handleResetVirtualCash}
            disabled={resetting}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset to ₹5,00,000</span>
          </button>
        </div>

        {/* Total Virtual P&L Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demo P&L Performance</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isProfit ? 'bg-emerald-50 text-[#10b981]' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className={`text-2xl font-black font-mono tracking-tight ${isProfit ? 'text-[#10b981]' : 'text-rose-600'}`}>
              {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`text-[11px] font-bold font-mono ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isProfit ? '↗' : '↘'} {isProfit ? '+' : ''}{pnlPct}% Overall Return
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Calculated against baseline ₹5,00,000 starting capital.
          </div>
        </div>

        {/* Gateway & Execution Status */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broker Gateway</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-sm text-slate-900">Zerodha Kite Publisher</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Official basket order gateway active with 1-click execution.</p>
          </div>
          <Link
            to="/orders"
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>View Execution Journal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* 3. Quick Action Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Platform Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/"
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors space-y-1"
          >
            <span className="font-bold text-slate-900 text-xs block">Explore Stock Screener</span>
            <span className="text-[11px] text-slate-500">Search Reliance, TCS, HDFC Bank & more</span>
          </Link>
          <Link
            to="/history"
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors space-y-1"
          >
            <span className="font-bold text-slate-900 text-xs block">Full Trade History</span>
            <span className="text-[11px] text-slate-500">Review all placed virtual & broker orders</span>
          </Link>
          <Link
            to="/company/RELIANCE"
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors space-y-1"
          >
            <span className="font-bold text-slate-900 text-xs block">Demo Trade Reliance</span>
            <span className="text-[11px] text-slate-500">Test 1-click execution on live NSE tick</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
