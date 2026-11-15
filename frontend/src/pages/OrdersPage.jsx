import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage({ onGoToMarkets }) {
  const { user, fetchCurrentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'COMPLETE' | 'PENDING' | 'CANCELLED'

  // Modal / prompt for confirming execution of a pending order
  const [selectedOrderToConfirm, setSelectedOrderToConfirm] = useState(null);
  const [confirmPrice, setConfirmPrice] = useState('');
  const [confirmKiteOrderId, setConfirmKiteOrderId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenConfirmModal = (order) => {
    setSelectedOrderToConfirm(order);
    setConfirmPrice(order.executedPrice || order.price);
    setConfirmKiteOrderId(order.kiteOrderId || '');
  };

  const handleConfirmExecution = async () => {
    if (!selectedOrderToConfirm) return;
    setConfirming(true);
    try {
      await axios.patch(`/api/user/orders/${selectedOrderToConfirm.id}/status`, {
        status: 'COMPLETE',
        executedPrice: Number(confirmPrice) || selectedOrderToConfirm.price,
        kiteOrderId: confirmKiteOrderId.trim() || undefined,
        statusMessage: 'Execution confirmed in Kite by user'
      });
      await fetchCurrentUser();
      await fetchOrders();
      setSelectedOrderToConfirm(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Mark this Kite order as CANCELLED in database?')) return;
    try {
      await axios.patch(`/api/user/orders/${orderId}/status`, {
        status: 'CANCELLED',
        statusMessage: 'Order cancelled by client'
      });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order');
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

  const completedOrders = orders.filter(o => o.status === 'COMPLETE' || o.status === 'EXECUTED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN');
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED');

  const filteredOrders = orders.filter(order => {
    if (filterTab === 'COMPLETE') return order.status === 'COMPLETE' || order.status === 'EXECUTED';
    if (filterTab === 'PENDING') return order.status === 'PENDING' || order.status === 'OPEN';
    if (filterTab === 'CANCELLED') return order.status === 'CANCELLED' || order.status === 'REJECTED';
    return true;
  });

  const totalBuyVolume = completedOrders
    .filter(o => o.action === 'BUY')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalSellVolume = completedOrders
    .filter(o => o.action === 'SELL')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white rounded-[2.5rem] p-6 sm:p-8 border border-purple-100/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">MONGODB EXACT ORDER TRACKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Order Execution & Trade Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time tracking of order lifecycles (Pending $\rightarrow$ Executed) for Zerodha Kite and Demo paper trading.
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Orders</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
          <span className="text-[11px] text-violet-600 font-semibold">{completedOrders.length} Completed</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-100/80 bg-amber-50/20 shadow-sm">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Pending in Kite</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingOrders.length}</p>
          <span className="text-[11px] text-amber-600 font-semibold">Awaiting Confirmation</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Executed Buy Volume</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
            ₹{Number(totalBuyVolume).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">Allocated demat/virtual</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Executed Sell Volume</span>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            ₹{Number(totalSellVolume).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">Realized capital</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'ALL' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setFilterTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'PENDING' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Kite ({pendingOrders.length})</span>
        </button>
        <button
          onClick={() => setFilterTab('COMPLETE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'COMPLETE' 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed ({completedOrders.length})
        </button>
        <button
          onClick={() => setFilterTab('CANCELLED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'CANCELLED' 
              ? 'bg-slate-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cancelled / Rejected ({cancelledOrders.length})
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading order journal...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">No {filterTab !== 'ALL' ? filterTab.toLowerCase() : ''} orders found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Execute a trade through Zerodha Kite or Virtual Demo to record and track its exact status.
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
                  <th className="py-4 px-6">Action & Type</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Tracking / Tag</th>
                  <th className="py-4 px-6">Exact Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((order, idx) => {
                  const isBuy = order.action === 'BUY';
                  const isPending = order.status === 'PENDING' || order.status === 'OPEN';
                  const isComplete = order.status === 'COMPLETE' || order.status === 'EXECUTED';
                  const isRejected = order.status === 'REJECTED';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <tr key={order.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <Link 
                          to={`/company/${order.symbol}`}
                          className="font-black text-slate-900 hover:text-violet-600 font-mono transition-colors"
                        >
                          {order.symbol}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {order.broker || 'Zerodha Kite'} • {order.exchange || 'NSE'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}>
                            {order.action}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {order.product || 'CNC'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {order.filledQuantity > 0 && order.filledQuantity !== order.quantity ? (
                          <span>{order.filledQuantity}/{order.quantity}</span>
                        ) : (
                          <span>{order.quantity}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        ₹{Number(order.executedPrice || order.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {order.executedPrice && order.executedPrice !== order.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{Number(order.price).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-slate-900">
                        ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6">
                        {order.tag ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                            <span>{order.tag}</span>
                            <button
                              onClick={() => copyToClipboard(order.tag, order.id)}
                              className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                              title="Copy tag"
                            >
                              {copiedId === order.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">—</span>
                        )}
                        {order.kiteOrderId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Kite: {order.kiteOrderId}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isComplete && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>EXECUTED</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                            <span>PENDING IN KITE</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            <span>REJECTED</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>CANCELLED</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenConfirmModal(order)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Confirm Fill
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {order.balanceApplied ? 'Synced' : 'No Balance'}
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

      {/* Confirmation Modal */}
      {selectedOrderToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Confirm Execution in Kite
              </h3>
              <button
                onClick={() => setSelectedOrderToConfirm(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <span className="text-slate-400">Order:</span>{' '}
                <span className="font-bold font-mono text-slate-900">
                  {selectedOrderToConfirm.action} {selectedOrderToConfirm.quantity} {selectedOrderToConfirm.symbol}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tag:</span>{' '}
                <span className="font-mono font-bold text-slate-700">{selectedOrderToConfirm.tag}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Actual Executed Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={confirmPrice}
                  onChange={(e) => setConfirmPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Kite Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 241115000000123"
                  value={confirmKiteOrderId}
                  onChange={(e) => setConfirmKiteOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderToConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmExecution}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {confirming ? 'Confirming...' : 'Mark Executed & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
