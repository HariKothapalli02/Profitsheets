import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  Trash2,
  TrendingUp,
  Layers
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await axios.get('/api/user/orders');
        setOrders(res.data.orders || []);
      } else {
        // Fallback for guest paper trades
        const guestOrders = JSON.parse(localStorage.getItem('guest_paper_orders') || '[]');
        setOrders(guestOrders);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
      const guestOrders = JSON.parse(localStorage.getItem('guest_paper_orders') || '[]');
      setOrders(guestOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your trade history?')) {
      try {
        if (user) {
          await axios.delete('/api/user/orders');
        }
        localStorage.removeItem('guest_paper_orders');
        setOrders([]);
      } catch (e) {
        console.error('Failed to clear orders on server', e);
        setOrders([]);
      }
    }
  };

  const totalTrades = orders.length;
  const buyCount = orders.filter(o => o.action === 'BUY').length;
  const sellCount = orders.filter(o => o.action === 'SELL').length;
  const totalVolume = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Trade History & Audit Journal</h1>
              <p className="text-xs text-slate-500">
                Complete record of virtual cash trades and Zerodha Kite demat dispatches
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              const csv = `ID,Symbol,Action,Quantity,Price,Total,Date\n` + 
                orders.map(o => `${o.id || ''},${o.symbol},${o.action},${o.quantity},${o.price},${o.total},${o.timestamp || ''}`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `profitsheets_trade_history.csv`;
              a.click();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 2. Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Trades</span>
          <p className="text-xl font-black font-mono text-slate-900">{totalTrades}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Buy Orders</span>
          <p className="text-xl font-black font-mono text-[#00965e]">{buyCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sell Orders</span>
          <p className="text-xl font-black font-mono text-[#df1d44]">{sellCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Turnover</span>
          <p className="text-xl font-black font-mono text-slate-900">
            ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* 3. Trade Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400">
            Loading order journal...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Trades Executed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Place a demo order on Reliance, TCS, or Lalithaa Jewellery to record your first virtual trade.
            </p>
            <Link
              to="/company/RELIANCE"
              className="inline-block px-5 py-2.5 bg-[#00965e] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#007f50] transition-colors"
            >
              Start Demo Trading
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold font-mono">
                  <th className="py-3 px-4">Time & Date</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Execution Type</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order, idx) => {
                  const isBuy = order.action === 'BUY';
                  const dateStr = order.timestamp 
                    ? new Date(order.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Just now';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <Link 
                          to={`/company/${order.symbol}`}
                          className="font-black text-slate-900 hover:text-indigo-600 transition-colors font-mono"
                        >
                          {order.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                          isBuy 
                            ? 'bg-emerald-50 text-[#00965e] border border-emerald-200' 
                            : 'bg-rose-50 text-[#df1d44] border border-rose-200'
                        }`}>
                          {isBuy ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {order.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {order.quantity}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        ₹{Number(order.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                        ₹{Number(order.total || (order.quantity * order.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {order.broker || 'Virtual Demo Engine'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {order.status === 'PENDING' || order.status === 'OPEN' ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-600 font-mono">
                            <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />
                            PENDING
                          </span>
                        ) : order.status === 'REJECTED' ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-rose-600 font-mono">
                            ✕ REJECTED
                          </span>
                        ) : order.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-500 font-mono">
                            ⊘ CANCELLED
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            EXECUTED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
