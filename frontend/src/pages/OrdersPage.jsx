import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap, RefreshCw, Database } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage({ onGoToMarkets }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900">Sign In to View Trade Journal</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Track all your Zerodha Kite executions, buy/sell orders, and portfolio performance in real time with MongoDB persistence.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-6 py-2.5 bg-[#0c324e] hover:bg-[#14466b] text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    );
  }

  const totalBuyVolume = orders.filter(o => o.action === 'BUY').reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalSellVolume = orders.filter(o => o.action === 'SELL').reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white rounded-[2.5rem] p-6 sm:p-8 border border-purple-100/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">MONGODB RESILIENT LOGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Order Execution & Trade Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time record of all orders executed via Zerodha Kite Publisher & local paper trading.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Journal</span>
          </button>
          <button
            onClick={onGoToMarkets}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
          >
            New Trade +
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Recorded Orders</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
          <span className="text-[11px] text-violet-600 font-semibold">Active in Journal</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Buy Volume</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
            ₹{Number(totalBuyVolume).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">Allocated capital</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sell Volume</span>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            ₹{Number(totalSellVolume).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">Realized capital</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading order journal...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">No orders placed yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Open any equity from the Homepage/Screener and place your first 1-click trade.
            </p>
            <button
              onClick={onGoToMarkets}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-2xl text-xs font-bold hover:bg-violet-700 transition-colors"
            >
              Explore Equities
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Symbol & Broker</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Executed Price</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((order, idx) => {
                  const isBuy = order.action === 'BUY';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900 font-mono">{order.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{order.broker || 'Zerodha Kite'} • {order.exchange}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBuy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {order.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {order.quantity}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        ₹{Number(order.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                          <span>{order.status || 'EXECUTED'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[11px] text-slate-400 font-mono">
                        {order.timestamp ? new Date(order.timestamp).toLocaleString() : 'Just now'}
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
