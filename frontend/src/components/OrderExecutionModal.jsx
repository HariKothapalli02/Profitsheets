import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useKite } from '../context/KiteContext';

// Helper: Detect live Indian market session (09:15 AM - 03:30 PM IST, Monday - Friday)
export const getIndianMarketSession = () => {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const isWeekday = day >= 1 && day <= 5;
  // 09:15 AM is 555 mins, 03:30 PM is 930 mins
  const isRegularHours = totalMinutes >= 555 && totalMinutes <= 930;
  const isMarketOpen = isWeekday && isRegularHours;

  return {
    isOpen: isMarketOpen,
    variety: isMarketOpen ? 'regular' : 'amo',
    sessionLabel: isMarketOpen ? 'Regular Market' : 'AMO (After Market Order)',
    notice: isMarketOpen
      ? 'NSE / BSE live trading session active'
      : 'Markets closed. Order will be dispatched as an After Market Order (AMO).'
  };
};

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
  const marketSession = getIndianMarketSession();

  // 'BUY' | 'SELL'
  const [action, setAction] = useState(initialAction);

  // Sync action with initialAction whenever modal opens
  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    }
  }, [initialAction, isOpen]);

  // Lock body & document scroll when modal is active so dark overlay covers full viewport edge-to-edge
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);
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

  const isIndian = stock?.currency === 'INR' || stock?.exchange === 'NSE' || stock?.exchange === 'BSE' || (!['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(stock?.symbol?.toUpperCase()));
  const currencySymbol = stock?.currencySymbol || (isIndian ? '₹' : '$');
  const isUSD = currencySymbol === '$';

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

  const dispatchKiteBasket = (orderTag, targetWindowName) => {
    const rawKey = (kiteApiKey || '').trim();
    // Default to the registered Zerodha Kite App Key (or custom configured key)
    const activeKey = rawKey || 'pplopxdr29w7pa6u';
    const targetName = targetWindowName || ('kite_basket_' + Date.now());

    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://kite.zerodha.com/connect/basket';
      form.target = targetName;

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

      // Automatically assign 'amo' when Indian markets are closed, and 'regular' during market hours
      const basketItem = {
        variety: marketSession.variety,
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

    // CRITICAL POP-UP BLOCKER FIX:
    // Synchronously open the target tab reference during the live user click event!
    // This permanently satisfies modern browser popup blocker security policies (Chrome, Safari, Edge, Firefox, Brave).
    const targetWindowName = 'kite_basket_' + Date.now();
    let preOpenedWindow = null;
    try {
      preOpenedWindow = window.open('about:blank', targetWindowName);
      if (preOpenedWindow && preOpenedWindow.document) {
        preOpenedWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Launching Zerodha Kite...</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; }
                .card { text-align: center; background: white; padding: 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 380px; width: 90%; }
                .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #00965e; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
                h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
                p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
                .badge { display: inline-block; margin-top: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #065f46; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; font-family: monospace; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="spinner"></div>
                <h3>Connecting to Zerodha Kite</h3>
                <p>Preparing ${stock.symbol} ${action} ${marketSession.variety === 'amo' ? '(AMO) ' : ''}basket...</p>
                <div class="badge">${marketSession.sessionLabel.toUpperCase()}</div>
              </div>
            </body>
          </html>
        `);
      }
    } catch (e) {
      console.warn('Pre-open window blocked or failed:', e);
    }

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
        variety: marketSession.variety,
        broker: 'Zerodha Kite',
        isDemo: false,
        tag: orderTag
      });

      const savedOrder = res.data.order;
      setTrackedOrder(savedOrder);
      setManualFillPrice(priceToUse);
      setManualFillQty(Number(quantity));

      // Step B: Submit order form targeting the pre-opened window!
      dispatchKiteBasket(orderTag, targetWindowName);

      if (onTradeComplete) onTradeComplete();

      setFeedback({
        type: 'info',
        msg: `Order basket launched in Zerodha Kite! Order saved as PENDING in database.`
      });
    } catch (err) {
      if (preOpenedWindow) {
        try { preOpenedWindow.close(); } catch (_) {}
      }
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

  const modalContent = (
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className={`${trackedOrder ? 'bg-amber-600' : themeBgColor} text-white px-5 py-3.5 flex items-center justify-between rounded-t-2xl transition-colors duration-200 select-none`}>
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="px-2 py-0.5 rounded text-[11px] font-black tracking-wider bg-black/25 uppercase font-mono">
              {action} ORDER
            </span>
            <span className="font-bold text-sm truncate font-mono tracking-wide">
              {stock.symbol}
            </span>
            <span className="text-xs text-white/85 truncate font-normal hidden sm:inline">
              ({stock.name || stock.companyName || stock.symbol})
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
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
                        Executed Price ({currencySymbol})
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
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Open in Zerodha Kite</span>
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
            /* VIEW B: CLEAN FOCUSED ORDER CONFIGURATION */
            /* ============================================================== */
            <>
              {/* Order Type: MARKET vs LIMIT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ORDER TYPE
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                  {['MARKET', 'LIMIT'].map(ot => (
                    <button
                      key={ot}
                      type="button"
                      onClick={() => setOrderType(ot)}
                      className={`py-1.5 rounded-md transition-all cursor-pointer ${
                        orderType === ot ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity (Shares) & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    QUANTITY
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

                  {/* Quick Quantity Pills */}
                  <div className="flex items-center space-x-1 mt-1.5">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuantity(amt)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PRICE ({currencySymbol}) {orderType === 'MARKET' ? '(MARKET)' : ''}
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
                  <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                    LTP: {currencySymbol}{currentPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Execution Channel: Demo Trading vs Zerodha Kite */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  EXECUTION MODE
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('DEMO')}
                    className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      executionMode === 'DEMO'
                        ? 'bg-[#00965e] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-transparent'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Demo (Virtual Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('ZERODHA')}
                    className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      executionMode === 'ZERODHA'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-transparent'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Zerodha Kite</span>
                  </button>
                </div>
              </div>

              {/* Market Status & AMO Auto-Detection Banner */}
              {isIndian && (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  marketSession.isOpen 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50/90 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {marketSession.isOpen ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold text-[11px] sm:text-xs">
                      {marketSession.isOpen ? 'NSE / BSE Regular Live Session' : 'Market Closed • AMO Auto-Enabled'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    marketSession.isOpen
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    {marketSession.variety.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Order Value & Available Balance Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Order Value</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {currencySymbol}{Number(estimatedOrderValue).toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {executionMode === 'DEMO' && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-600" />
                      <span>Available Virtual Cash</span>
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
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
                        {submitting ? 'Executing Demo Trade...' : `Execute Demo ${action} (${currencySymbol}${Number(estimatedOrderValue).toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {submitting 
                          ? 'Opening Zerodha Kite...' 
                          : !marketSession.isOpen && isIndian 
                          ? 'Send AMO to Zerodha Kite & Track' 
                          : 'Send to Zerodha Kite & Track'}
                      </span>
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

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
