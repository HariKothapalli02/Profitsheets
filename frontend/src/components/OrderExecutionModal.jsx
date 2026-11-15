import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Zap, 
  Info, 
  Plus, 
  Minus, 
  Wallet, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useKite } from '../context/KiteContext';

export default function OrderExecutionModal({ 
  isOpen, 
  onClose, 
  stock, 
  initialAction = 'BUY',
  onTradeComplete 
}) {
  if (!isOpen || !stock) return null;

  const { user, fetchCurrentUser } = useAuth();
  const { kiteApiKey } = useKite();

  // 'BUY' | 'SELL'
  const [action, setAction] = useState(initialAction);
  // 'CNC' | 'MIS'
  const [product, setProduct] = useState('CNC');
  // 'NSE' | 'BSE'
  const [exchange, setExchange] = useState('NSE');
  // 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
  const [orderType, setOrderType] = useState('MARKET');
  // Quantity
  const [quantity, setQuantity] = useState(1);
  // Limit Price (editable if not MARKET)
  const currentPrice = Number(stock.currentPrice || stock.price || 100);
  const [customPrice, setCustomPrice] = useState(currentPrice);

  // 'DEMO' | 'ZERODHA'
  const [executionMode, setExecutionMode] = useState('DEMO');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Order tracking stage state (for Kite orders)
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [copiedTag, setCopiedTag] = useState(false);
  const [manualKiteOrderId, setManualKiteOrderId] = useState('');
  const [manualFillPrice, setManualFillPrice] = useState(currentPrice);
  const [manualFillQty, setManualFillQty] = useState(1);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const priceToUse = orderType === 'MARKET' ? currentPrice : Number(customPrice || currentPrice);
  const estimatedOrderValue = (quantity * priceToUse).toFixed(2);
  const walletBalance = Number(user?.walletBalance || 500000);

  const isBuy = action === 'BUY';
  const themeBgColor = isBuy ? 'bg-[#00965e]' : 'bg-[#df1d44]'; // Authentic Kite Green & Kite Red
  const themeTextColor = isBuy ? 'text-[#00965e]' : 'text-[#df1d44]';
  const themeBorderColor = isBuy ? 'border-[#00965e]' : 'border-[#df1d44]';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const dispatchKiteBasket = (orderTag) => {
    const rawKey = (kiteApiKey || '').trim();
    // Default to the registered Zerodha Kite App Key (or custom configured key)
    const activeKey = rawKey || 'pplopxdr29w7pa6u';

    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://kite.zerodha.com/connect/basket';
      form.target = '_blank';

      const apiKeyInput = document.createElement('input');
      apiKeyInput.type = 'hidden';
      apiKeyInput.name = 'api_key';
      apiKeyInput.value = activeKey;
      form.appendChild(apiKeyInput);

      // Explicitly provide the return redirect_url so Kite redirects back on Cancel or Success
      const redirectInput = document.createElement('input');
      redirectInput.type = 'hidden';
      redirectInput.name = 'redirect_url';
      redirectInput.value = `${window.location.origin}/orders`;
      form.appendChild(redirectInput);

      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';

      const basketItem = {
        variety: 'regular',
        tradingsymbol: (stock.symbol || 'STOCK').toUpperCase(),
        exchange: exchange.toUpperCase(),
        transaction_type: action.toUpperCase(),
        order_type: orderType.toUpperCase(),
        quantity: Number(quantity),
        product: product.toUpperCase(),
        tag: orderTag
      };

      if (orderType === 'LIMIT' || orderType === 'SL') {
        basketItem.price = Number(priceToUse);
      }
      if (orderType === 'SL' || orderType === 'SL-M') {
        basketItem.trigger_price = Number(priceToUse);
      }

      dataInput.value = JSON.stringify([basketItem]);
      form.appendChild(dataInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      console.warn('Zerodha dispatch error:', err);
    }
  };

  const handleExecute = async () => {
    if (!user) {
      setFeedback({
        type: 'error',
        msg: 'Please sign in to your ProfitSheets account to execute trade orders.'
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    if (executionMode === 'DEMO') {
      // 1. Virtual Cash Demo Trade (Instant Execution)
      if (isBuy && Number(estimatedOrderValue) > walletBalance) {
        setFeedback({
          type: 'error',
          msg: `Insufficient virtual cash balance (₹${walletBalance.toLocaleString('en-IN')}). Please reduce quantity or reset balance in Profile.`
        });
        setSubmitting(false);
        return;
      }

      try {
        await axios.post('/api/user/orders', {
          symbol: stock.symbol,
          action: action,
          quantity: Number(quantity),
          price: priceToUse,
          exchange: exchange,
          orderType: orderType,
          product: product,
          broker: 'Virtual Demo',
          isDemo: true
        });
        await fetchCurrentUser();

        if (onTradeComplete) onTradeComplete();

        setFeedback({
          type: 'success',
          msg: `Demo ${action} order for ${quantity} shares of ${stock.symbol} executed with Virtual Cash!`
        });

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        console.error('Demo trade error:', err);
        setFeedback({
          type: 'error',
          msg: err.response?.data?.error || 'Error logging virtual demo trade.'
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 2. Zerodha Kite Demat Broker Flow with Exact Lifecycle Tracking (tag must be max 8 chars for Zerodha)
    const orderTag = ('P' + Date.now().toString(36).slice(-4) + Math.random().toString(36).substring(2, 5)).toUpperCase().slice(0, 8);

    try {
      // Step A: Save Order in MongoDB with status: 'PENDING'
      const res = await axios.post('/api/user/orders', {
        symbol: stock.symbol,
        action: action,
        quantity: Number(quantity),
        price: priceToUse,
        exchange: exchange,
        orderType: orderType,
        product: product,
        broker: 'Zerodha Kite',
        isDemo: false,
        tag: orderTag
      });

      const savedOrder = res.data.order;
      setTrackedOrder(savedOrder);
      setManualFillPrice(priceToUse);
      setManualFillQty(Number(quantity));

      // Step B: Submit order to Zerodha Kite basket tab
      dispatchKiteBasket(orderTag);

      if (onTradeComplete) onTradeComplete();

      setFeedback({
        type: 'info',
        msg: `Order basket launched in Zerodha Kite! Order saved as PENDING in database.`
      });
    } catch (err) {
      console.error('Kite order save error:', err);
      setFeedback({
        type: 'error',
        msg: err.response?.data?.error || 'Failed to record order in database.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm or cancel order execution status in database
  const handleUpdateStatus = async (newStatus) => {
    if (!trackedOrder) return;
    setIsUpdatingStatus(true);
    setFeedback(null);

    try {
      const res = await axios.patch(`/api/user/orders/${trackedOrder.id}/status`, {
        status: newStatus,
        kiteOrderId: manualKiteOrderId || undefined,
        executedPrice: Number(manualFillPrice) || priceToUse,
        filledQuantity: Number(manualFillQty) || Number(quantity),
        statusMessage: newStatus === 'COMPLETE' 
          ? `Executed in Kite Demat Account (ID: ${manualKiteOrderId || 'Confirmed'})` 
          : `Order marked as ${newStatus} on Kite`
      });

      setTrackedOrder(res.data.order);
      await fetchCurrentUser();
      if (onTradeComplete) onTradeComplete();

      if (newStatus === 'COMPLETE') {
        setFeedback({
          type: 'success',
          msg: `✓ Order execution confirmed & logged to MongoDB database! Wallet adjusted.`
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setFeedback({
          type: 'info',
          msg: `Order status updated to ${newStatus} in database.`
        });
      }
    } catch (err) {
      console.error('Status update error:', err);
      setFeedback({
        type: 'error',
        msg: err.response?.data?.error || 'Failed to update order status in database.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className={`${trackedOrder ? 'bg-amber-600' : themeBgColor} text-white px-5 py-3.5 flex items-center justify-between transition-colors duration-200`}>
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="px-2 py-0.5 rounded text-[11px] font-black tracking-wider bg-white/20 uppercase font-mono">
              {trackedOrder ? trackedOrder.status : action}
            </span>
            <span className="font-bold text-sm truncate font-mono tracking-wide">
              {stock.symbol}
            </span>
            <span className="text-xs text-white/85 truncate font-normal hidden sm:inline">
              ({stock.name || stock.companyName || stock.symbol})
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* ============================================================== */}
          {/* VIEW A: ACTIVE ORDER TRACKING & CONFIRMATION STAGE */}
          {/* ============================================================== */}
          {trackedOrder ? (
            <div className="space-y-4">
              {/* Status Header Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                trackedOrder.status === 'COMPLETE' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : trackedOrder.status === 'CANCELLED' || trackedOrder.status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {trackedOrder.status === 'COMPLETE' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : trackedOrder.status === 'CANCELLED' || trackedOrder.status === 'REJECTED' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Status: {trackedOrder.status}
                    </h4>
                    {trackedOrder.status === 'PENDING' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 animate-pulse">
                        Awaiting Fill
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">
                    {trackedOrder.status === 'COMPLETE'
                      ? 'Order fully executed and confirmed in database.'
                      : trackedOrder.status === 'CANCELLED'
                      ? 'Order marked cancelled. No wallet deduction applied.'
                      : 'Kite basket has been dispatched in your browser. Complete order in Zerodha tab, then confirm fill below.'}
                  </p>
                </div>
              </div>

              {/* Order Metadata Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tracking Tag:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                    <span>{trackedOrder.tag}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(trackedOrder.tag)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy tag"
                    >
                      {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Order Detail:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {trackedOrder.action} {trackedOrder.quantity} {trackedOrder.symbol} ({trackedOrder.product})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Estimated Value:</span>
                  <span className="font-black text-slate-900 font-mono">
                    ₹{Number(trackedOrder.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Confirmation Inputs (when status is still PENDING) */}
              {trackedOrder.status === 'PENDING' && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00965e]" />
                    Confirm Fill from Zerodha Kite
                  </h5>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Kite Order ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 241115000..."
                        value={manualKiteOrderId}
                        onChange={(e) => setManualKiteOrderId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Executed Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={manualFillPrice}
                        onChange={(e) => setManualFillPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('COMPLETE')}
                      className="w-full py-2.5 bg-[#00965e] hover:bg-[#007f50] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUpdatingStatus ? 'Updating...' : 'Confirm Order Executed (COMPLETE)'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus('CANCELLED')}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      >
                        ✕ Mark Cancelled
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchKiteBasket(trackedOrder.tag)}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Reopen Kite</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {feedback && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold text-center ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : feedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}>
                  {feedback.msg}
                </div>
              )}

              {/* Close / Track link */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 text-center transition-colors"
              >
                Close & Track in Orders Journal →
              </button>
            </div>
          ) : (
            /* ============================================================== */
            /* VIEW B: ORDER CONFIGURATION & SUBMISSION STAGE */
            /* ============================================================== */
            <>
              {/* Action Switcher: BUY (Long) vs SELL (Short/Exit) */}
              <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setAction('BUY')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    isBuy 
                      ? 'bg-[#00965e] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BUY (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setAction('SELL')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    !isBuy 
                      ? 'bg-[#df1d44] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SELL (Short/Exit)
                </button>
              </div>

              {/* Row 1: PRODUCT & EXCHANGE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PRODUCT
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                    <button
                      type="button"
                      onClick={() => setProduct('CNC')}
                      className={`py-1.5 rounded-md transition-all ${
                        product === 'CNC' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      CNC <span className="text-[10px] font-normal text-slate-400 block sm:inline">(Delivery)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProduct('MIS')}
                      className={`py-1.5 rounded-md transition-all ${
                        product === 'MIS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      MIS <span className="text-[10px] font-normal text-slate-400 block sm:inline">(Intraday)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    EXCHANGE
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                    <button
                      type="button"
                      onClick={() => setExchange('NSE')}
                      className={`py-1.5 rounded-md transition-all ${
                        exchange === 'NSE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      NSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('BSE')}
                      className={`py-1.5 rounded-md transition-all ${
                        exchange === 'BSE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      BSE
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: ORDER TYPE (MARKET, LIMIT, SL, SL-M) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ORDER TYPE
                </label>
                <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                  {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(ot => (
                    <button
                      key={ot}
                      type="button"
                      onClick={() => setOrderType(ot)}
                      className={`py-1.5 rounded-md transition-all ${
                        orderType === ot ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: QUANTITY (SHARES) & PRICE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    QUANTITY (SHARES)
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/60 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-2 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2 bg-transparent text-sm font-bold font-mono text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2.5 py-2 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Pills */}
                  <div className="flex items-center space-x-1.5 mt-2">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuantity(amt)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PRICE (₹) {orderType === 'MARKET' ? '(AT MARKET)' : ''}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={orderType === 'MARKET'}
                    value={orderType === 'MARKET' ? currentPrice : customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      orderType === 'MARKET' ? 'bg-slate-100/70 text-slate-500 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Execution Channel Switcher: Demo Trading vs Zerodha Kite */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  EXECUTION MODE
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('DEMO')}
                    className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      executionMode === 'DEMO'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Demo (Virtual Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('ZERODHA')}
                    className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      executionMode === 'ZERODHA'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>Zerodha Kite</span>
                  </button>
                </div>
              </div>

              {/* Estimated Order Value Card */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Order Value</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    ₹{Number(estimatedOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {executionMode === 'DEMO' ? (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-600" />
                      <span>Available Virtual Cash</span>
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">Brokerage & Tracking</span>
                    <span className="font-bold text-[#00965e] font-mono">Real-time Kite Postback</span>
                  </div>
                )}
              </div>

              {/* Info footnote */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {executionMode === 'DEMO'
                    ? 'Demo mode executes paper trades instantly using your ₹5,00,000 virtual cash balance. Zero risk, tracked in your History and Profile.'
                    : 'Zerodha Kite orders are dispatched with a unique tracking tag and saved as PENDING until confirmed complete. Your portfolio updates upon execution!'}
                </span>
              </div>

              {/* Feedback message if any */}
              {feedback && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold text-center ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : feedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}>
                  {feedback.msg}
                </div>
              )}

              {/* Submit Action Button */}
              {!user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>You must be signed in to execute orders and log trades into your portfolio.</span>
                  </div>
                  <a
                    href={`/login?redirect=${encodeURIComponent('/company/' + stock.symbol)}`}
                    className="w-full py-3 rounded-xl text-white font-bold text-xs tracking-wide shadow-xs bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Place {action} Order</span>
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleExecute}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 ${
                    isBuy 
                      ? 'bg-[#00965e] hover:bg-[#007f50] active:scale-[0.99]' 
                      : 'bg-[#df1d44] hover:bg-[#c21437] active:scale-[0.99]'
                  }`}
                >
                  {executionMode === 'DEMO' ? (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        {submitting ? 'Executing Demo Trade...' : `Execute Demo ${action} (₹${Number(estimatedOrderValue).toLocaleString('en-IN')})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{submitting ? 'Saving & Opening Kite...' : 'Send to Zerodha Kite & Track'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
