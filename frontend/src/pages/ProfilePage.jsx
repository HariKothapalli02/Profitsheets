import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Wallet, 
  TrendingUp, 
  History, 
  ShieldCheck, 
  Zap, 
  LogOut, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  Bookmark,
  Compass,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  BarChart2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Safely redirect to /login only after auth check has completed
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Fetch user's orders for recent activity and statistics
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      if (!user) return;
      setOrdersLoading(true);
      try {
        const res = await axios.get('/api/user/orders');
        if (isMounted) {
          setOrders(res.data?.orders || []);
        }
      } catch (e) {
        console.warn('Failed to load user orders:', e.message);
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    if (user) {
      fetchOrders();
    }
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading) {
    return (
      <div className="w-full max-w-[1720px] mx-auto py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading trader profile...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const balance = Number(user.walletBalance || 500000);
  const startingFund = 500000;
  const pnl = balance - startingFund;
  const pnlPct = ((pnl / startingFund) * 100).toFixed(2);
  const isProfit = pnl >= 0;

  // Order stats calculations
  const isOrderVirtual = (o) => Boolean(
    o.isDemo || 
    (o.broker && (o.broker.toLowerCase().includes('demo') || o.broker.toLowerCase().includes('virtual')))
  );
  const isOrderReal = (o) => !isOrderVirtual(o);

  const completedOrders = orders.filter(o => o.status === 'COMPLETE' || o.status === 'EXECUTED');
  const realOrders = orders.filter(isOrderReal);
  const virtualOrders = orders.filter(isOrderVirtual);
  const totalVolume = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // User formatting
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PS';
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Nov 2026';
  const accountId = user.id ? `PS-${user.id.substring(0, 8).toUpperCase()}` : 'PS-TRADER';

  const handleCopyEmail = () => {
    if (user.email) {
      navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const bluechipShortcuts = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Retail', tag: 'Nifty 50' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT & Software', tag: 'Nifty 50' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Private Banking', tag: 'Nifty 50' },
    { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT Services', tag: 'Nifty 50' }
  ];

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 sm:space-y-8 pb-6 sm:pb-8 font-sans">
      
      {/* 1. Header Profile & Identity Hub */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background gradient glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-gradient-to-bl from-emerald-50/70 via-slate-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Avatar & Identity info */}
          <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md ring-4 ring-slate-100/90">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs" title="Live Session Active">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200/80 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Trader</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase border border-indigo-200/80 font-mono">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>SEBI 2% Risk Discipline</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {/* Email with copy */}
                <button 
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer group"
                  title="Click to copy email"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  <span className="font-mono">{user.email}</span>
                  {copiedEmail ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                <span className="text-slate-300">•</span>

                {/* Account ID with copy */}
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer font-mono text-[11px]"
                  title="Click to copy Account ID"
                >
                  <span className="text-slate-400">ID:</span>
                  <span className="font-semibold text-slate-700">{accountId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                <span className="text-slate-300">•</span>

                <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Navigation Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <Link
              to="/orders"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-2"
            >
              <History className="w-3.5 h-3.5" />
              <span>Orders Journal</span>
              {orders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] font-mono">
                  {orders.length}
                </span>
              )}
            </Link>

            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Screener</span>
            </Link>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Core Capital & Performance Trio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Available Demo Capital */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Demo Capital
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ₹
              </div>
            </div>

            <div className="mt-3">
              <h2 className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Virtual Demo Trading Balance</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Visual Capital Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Capital Utilization</span>
                <span className="text-emerald-700 font-bold">100% Available</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Initial Fund</span>
                <span className="font-bold text-slate-800">₹5,00,000</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Max Risk/Trade (2%)</span>
                <span className="font-bold text-indigo-700">₹10,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Demo P&L Performance */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Demo P&L Performance
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h2 className={`text-3xl font-black font-mono tracking-tight ${
                isProfit ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                  isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {isProfit ? '↗' : '↘'} {isProfit ? '+' : ''}{pnlPct}% Overall Return
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Filled Orders</span>
                <span className="font-bold text-slate-800">{completedOrders.length} Completed</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Volume</span>
                <span className="font-bold text-slate-800">
                  ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Realized P&L tracked against the ₹5,00,000 baseline with circuit-breaker protection.
            </p>
          </div>
        </div>

        {/* Card 3: Broker Gateway */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Broker Gateway
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="font-extrabold text-base text-slate-900">Zerodha Kite Publisher</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official basket checkout gateway active with 1-click execution.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order Routing:</span>
                <span className="font-mono font-bold text-slate-700">Basket Dispatch</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">AMO Auto-Detection:</span>
                <span className="font-mono font-bold text-emerald-700">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pop-up Protection:</span>
                <span className="font-mono font-bold text-emerald-700">Bypass Form</span>
              </div>
            </div>

            <Link
              to="/orders"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>View Execution Journal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 3. Recent Activity & Market Leaders Dual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Orders Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Recent Order Activity
              </h3>
            </div>
            <Link
              to="/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center space-x-1"
            >
              <span>Full Journal ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">No Orders Executed Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Test your strategies risk-free using demo paper trading or dispatch real orders via Zerodha Kite.
                </p>
              </div>
              <Link
                to="/company/RELIANCE"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <span>Demo Trade Reliance</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 4).map((order) => {
                const isVirtual = isOrderVirtual(order);
                const isBuy = order.action === 'BUY';
                const isComplete = order.status === 'COMPLETE' || order.status === 'EXECUTED';
                const isPending = order.status === 'PENDING' || order.status === 'OPEN';

                return (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isBuy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {order.action}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/company/${order.symbol}`}
                            className="font-black text-xs text-slate-900 hover:text-emerald-700 font-mono transition-colors"
                          >
                            {order.symbol}
                          </Link>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                            isVirtual 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isVirtual ? 'Virtual Demo' : 'Real Kite'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {order.quantity} Qty • {order.product || 'CNC'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        ₹{(Number(order.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold font-mono mt-0.5 ${
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700'
                          : isPending
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Market Leaders Quick Terminal Access (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Bluechips Quick Trade
              </h3>
            </div>
            <Link
              to="/watchlist"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center space-x-1"
            >
              <span>Watchlist</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {bluechipShortcuts.map((stock) => (
              <Link
                key={stock.symbol}
                to={`/company/${stock.symbol}`}
                className="group p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between block"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-xs text-slate-900 font-mono group-hover:text-emerald-700 transition-colors">
                      {stock.symbol}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-mono text-[9px] font-bold">
                      {stock.tag}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[180px]">
                    {stock.name}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  <span>Trade</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Risk Discipline & Trading Architecture Guard */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono uppercase border border-emerald-500/30">
                Disciplined Architecture Active
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Institutional Risk & Execution Safeguards
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every virtual order and Kite basket submission adheres to SEBI margin limits, circuit-breaker checks, and automatic After-Market Order (AMO) scheduling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 text-[10px] block">Max Risk / Position</span>
              <span className="font-bold text-emerald-400">1.0% - 2.0% Equity</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 text-[10px] block">Execution Engine</span>
              <span className="font-bold text-amber-300">Zerodha Kite Publisher</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Platform Shortcuts (High-Fidelity Action Cards) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          Platform Shortcuts & Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/"
            className="group p-5 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  Stock Screener
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                Filter 500+ NSE & BSE stocks with Magic Formula, Compounders & Debt-Free presets.
              </span>
            </div>
          </Link>

          <Link
            to="/orders"
            className="group p-5 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                  Order Journal
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                Audit all placed trades, verify execution timestamps, and filter Real vs Demo orders.
              </span>
            </div>
          </Link>

          <Link
            to="/watchlist"
            className="group p-5 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                  Saved Watchlist
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                Monitor your curated basket of high-conviction companies with live ticks.
              </span>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
