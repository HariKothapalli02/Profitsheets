import React, { useState } from 'react';
import { X, ExternalLink, Zap, Info, Plus, Minus, Wallet, CheckCircle2, Lock } from 'lucide-react';
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

  const priceToUse = orderType === 'MARKET' ? currentPrice : Number(customPrice || currentPrice);
  const estimatedOrderValue = (quantity * priceToUse).toFixed(2);
  const walletBalance = Number(user?.walletBalance || 500000);

  const isBuy = action === 'BUY';
  const themeBgColor = isBuy ? 'bg-[#00965e]' : 'bg-[#df1d44]'; // Authentic Kite Green & Kite Red
  const themeTextColor = isBuy ? 'text-[#00965e]' : 'text-[#df1d44]';
  const themeBorderColor = isBuy ? 'border-[#00965e]' : 'border-[#df1d44]';

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
      // 1. Virtual Cash Demo Trade
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
          product: product
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

    // 2. Zerodha Kite Demat Broker Flow
    const rawKey = (kiteApiKey || '').trim();
    const activeKey = (rawKey && rawKey !== 'pplopxdr29w7pa6u' && rawKey.length > 5) ? rawKey : 'kitefront';

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
        product: product.toUpperCase()
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

    // Persist in ProfitSheets MongoDB Portfolio Journal
    try {
      if (user) {
        await axios.post('/api/user/orders', {
          symbol: stock.symbol,
          action: action,
          quantity: Number(quantity),
          price: priceToUse,
          exchange: exchange,
          orderType: orderType,
          product: product
        });
        await fetchCurrentUser();
        if (onTradeComplete) onTradeComplete();
      }

      setFeedback({
        type: 'success',
        msg: `Order dispatched to Zerodha Kite and logged to your portfolio!`
      });
    } catch (err) {
      console.warn('MongoDB log error:', err);
      setFeedback({
        type: 'info',
        msg: `Order dispatched to Zerodha Kite gateway tab.`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[430px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar matching Screenshot 2 */}
        <div className={`${themeBgColor} text-white px-5 py-3.5 flex items-center justify-between transition-colors duration-200`}>
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="px-2 py-0.5 rounded text-[11px] font-black tracking-wider bg-white/20 uppercase font-mono">
              {action}
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
        <div className="p-5 space-y-4">

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

          {/* Row 4: Estimated Order Value Card */}
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
                <span className="text-slate-400">Delivery Brokerage (Zerodha)</span>
                <span className="font-bold text-[#00965e] font-mono">FREE (₹0)</span>
              </div>
            )}
          </div>

          {/* Info footnote */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {executionMode === 'DEMO'
                ? 'Demo mode executes paper trades instantly using your ₹5,00,000 virtual cash balance. Zero risk, tracked in your History and Profile.'
                : 'Live demat orders are dispatched through Zerodha Broking Limited via Kite Publisher SDK. You will review and authenticate the transaction in Zerodha\'s official interface.'}
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
                  <span>{submitting ? 'Connecting...' : 'Continue to Zerodha'}</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
