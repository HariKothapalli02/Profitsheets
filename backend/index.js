import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

import { initMongoDB, mongoDao } from './mongo.js';
import { POPULAR_SYMBOLS, fetchLiveQuote, fetchLiveCandles, searchStocks } from './yahooData.js';
import { getCompanyFinancials } from './financialData.js';
import { fetchBseCorporateAnnouncements } from './bseAnnouncements.js';
import { ANGEL_API_KEY, fetchAngelMarketQuote, fetchAngelCandles, setAngelSession, getAngelSession } from './angelData.js';
import { fetchCompanySpecificNews } from './companyNews.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '..', 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'profitsheets_jwt_secret_default_key_2026';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || 'dbrlm59r01qvp4idnnn0dbrlm59r01qvp4idnnng';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure MongoDB is connected on cold starts in serverless environments
app.use(async (req, res, next) => {
  if (!mongoDao.isConnected()) {
    initMongoDB().catch(() => { });
  }
  next();
});

// Serve static frontend files if built
app.use(express.static(DIST_PATH));

// Initialize MongoDB on startup
initMongoDB();

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES (MONGODB)
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await mongoDao.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6);

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      walletBalance: 500000.00,
      watchlist: [],
      createdAt: new Date()
    };

    await mongoDao.createUser(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, walletBalance: newUser.walletBalance }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await mongoDao.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, walletBalance: user.walletBalance || 500000.00 }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await mongoDao.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance || 500000.00,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// -------------------------------------------------------------
// LIVE 100% ACCURATE REAL-TIME STOCK MARKET DATA (YAHOO FINANCE)
// -------------------------------------------------------------

// Popular Stocks with Real-Time Pricing
app.get('/api/stocks/popular', async (req, res) => {
  try {
    const quotes = await Promise.all(
      POPULAR_SYMBOLS.map(async (item) => {
        try {
          const q = await fetchLiveQuote(item.yahoo);
          return {
            ...q,
            symbol: item.symbol,
            name: item.name,
            sector: item.sector,
            exchange: item.exchange
          };
        } catch (err) {
          return null;
        }
      })
    );
    res.json(quotes.filter(Boolean));
  } catch (err) {
    console.error('Error fetching popular quotes:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Single Live Quote
app.get('/api/stocks/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol parameter is required' });

  try {
    const quote = await fetchLiveQuote(symbol);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch quote for ${symbol}` });
  }
});

// Search Any Stock in the World (NSE, BSE, US)
app.get('/api/stocks/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) return res.json([]);

  try {
    const results = await searchStocks(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Real Candlestick Chart Data (1D, 1W, 1M, 1Y, 5Y)
app.get('/api/stocks/candles', async (req, res) => {
  const { symbol, timeframe = '1M' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const candles = await fetchLiveCandles(symbol, timeframe);
    res.json({ symbol, timeframe, candles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candles' });
  }
});

// Complete Fundamental Financials (Powered by Clean API & Audited Datastore)
app.get('/api/stocks/fundamentals', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const data = await getCompanyFinancials(symbol);
    res.json(data);
  } catch (err) {
    console.error('Fundamentals fetch error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve fundamentals' });
  }
});

// -------------------------------------------------------------
// COMPANY FINANCIAL STATEMENTS (QUARTERS, P&L, BALANCE SHEET, RATIOS)
// -------------------------------------------------------------
app.get('/api/stocks/financials', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
    const eodhdKey = await mongoDao.getSetting('eodhd_api_key', process.env.EODHD_API_KEY || '');
    const financials = await getCompanyFinancials(symbol, eodhdKey);
    res.json(financials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

// Dedicated BSE Corporate Announcements & Concalls (with MongoDB Atlas 24h cache)
app.get('/api/stocks/bse-announcements', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    // Check MongoDB Atlas cache first
    const cached = await mongoDao.getCachedFinancials(symbol);
    if (cached && cached.data?.bseAnnouncements?.length > 0) {
      return res.json({
        symbol,
        count: cached.data.bseAnnouncements.length,
        announcements: cached.data.bseAnnouncements,
        cached: true,
        source: cached.source,
        cachedAt: cached.updatedAt
      });
    }

    const announcements = await fetchBseCorporateAnnouncements(symbol);
    res.json({ symbol, count: announcements.length, announcements, cached: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch BSE announcements' });
  }
});

// Provider status & configuration
app.get('/api/config/providers', async (req, res) => {
  const eodhdKey = await mongoDao.getSetting('eodhd_api_key', process.env.EODHD_API_KEY || '');
  res.json({
    bseAnnouncements: { active: true, source: 'Official BSE India Corporate API (Free)' },
    zeroCostEngine: { active: true, source: 'Yahoo Finance 4-Yr Statements + BSE Bhavcopy Analytics (Free)' },
    eodhd: { isConfigured: Boolean(eodhdKey && eodhdKey.length > 0), maskedKey: eodhdKey ? '••••••••' + eodhdKey.slice(-4) : null }
  });
});

app.post('/api/config/eodhd', async (req, res) => {
  const { eodhd_api_key } = req.body;
  const clean = (eodhd_api_key || '').trim();
  await mongoDao.setSetting('eodhd_api_key', clean);
  res.json({ message: 'EODHD API Key saved successfully', isConfigured: Boolean(clean.length > 0) });
});

// -------------------------------------------------------------
// STOCK & MARKET NEWS (FINNHUB)
// -------------------------------------------------------------
let cachedMarketNews = null;
let lastNewsFetch = 0;

app.get('/api/news/market', async (req, res) => {
  if (cachedMarketNews && (Date.now() - lastNewsFetch < 2 * 60 * 1000)) {
    return res.json(cachedMarketNews);
  }

  try {
    const resp = await axios.get(`https://finnhub.io/api/v1/news`, {
      params: { category: 'general', token: FINNHUB_KEY },
      timeout: 5000
    });

    const articles = (resp.data || []).slice(0, 30).map(item => ({
      id: item.id,
      category: item.category || 'Market Pulse',
      datetime: item.datetime * 1000,
      headline: item.headline,
      image: item.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      source: item.source,
      summary: item.summary,
      url: item.url
    }));

    cachedMarketNews = articles;
    lastNewsFetch = Date.now();
    res.json(articles);
  } catch (err) {
    console.error('Market news error:', err.message);
    res.json(cachedMarketNews || []);
  }
});

// Company-Specific Real Financial News (Google News Live Indian Exchange Feed)
app.get('/api/stocks/news', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const articles = await fetchCompanySpecificNews(symbol);
    res.json(articles);
  } catch (err) {
    console.error('Company news error:', err.message);
    res.json([]);
  }
});

// -------------------------------------------------------------
// USER WATCHLIST & TRADES (MONGODB)
// -------------------------------------------------------------
app.get('/api/user/watchlist', authenticateToken, async (req, res) => {
  const list = await mongoDao.getWatchlist(req.user.id);
  res.json({ watchlist: list });
});

app.get('/api/user/watchlist/details', authenticateToken, async (req, res) => {
  try {
    const list = await mongoDao.getWatchlist(req.user.id);
    const quotes = await Promise.all(
      (list || []).map(async (sym) => {
        try {
          const fin = await getCompanyFinancials(sym);
          return {
            symbol: sym,
            name: fin.name || sym,
            currentPrice: fin.currentPrice || 0,
            change: fin.change || 0,
            changePercent: fin.changePercent || 0,
            exchange: fin.exchange || 'NSE',
            high: fin.high || 0,
            low: fin.low || 0,
            volume: fin.volume || 0,
            sector: fin.sector || 'Equities'
          };
        } catch (e) {
          return { symbol: sym, name: sym, currentPrice: 0, change: 0, changePercent: 0, exchange: 'NSE' };
        }
      })
    );
    res.json({ watchlist: quotes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist details' });
  }
});

// Batch quotes for symbols (public or guest)
app.post('/api/stocks/batch', async (req, res) => {
  try {
    const { symbols = [] } = req.body;
    if (!Array.isArray(symbols) || symbols.length === 0) return res.json({ stocks: [] });

    const quotes = await Promise.all(
      symbols.slice(0, 30).map(async (sym) => {
        try {
          const cleanSym = String(sym).trim().toUpperCase();
          const fin = await getCompanyFinancials(cleanSym);
          return {
            symbol: cleanSym,
            name: fin.name || cleanSym,
            currentPrice: fin.currentPrice || 0,
            change: fin.change || 0,
            changePercent: fin.changePercent || 0,
            exchange: fin.exchange || 'NSE',
            high: fin.high || 0,
            low: fin.low || 0,
            volume: fin.volume || 0,
            highLow: fin.highLow || '-'
          };
        } catch (e) {
          return null;
        }
      })
    );
    res.json({ stocks: quotes.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch batch quotes' });
  }
});

app.post('/api/user/watchlist', authenticateToken, async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  const clean = symbol.trim().toUpperCase();
  const current = await mongoDao.getWatchlist(req.user.id);
  if (!current.includes(clean)) {
    current.push(clean);
    await mongoDao.updateWatchlist(req.user.id, current);
  }
  res.json({ watchlist: current });
});

app.delete('/api/user/watchlist/:symbol', authenticateToken, async (req, res) => {
  const clean = req.params.symbol.trim().toUpperCase();
  let current = await mongoDao.getWatchlist(req.user.id);
  current = current.filter(s => s !== clean);
  await mongoDao.updateWatchlist(req.user.id, current);
  res.json({ watchlist: current });
});

// GET all orders for the current user
app.get('/api/user/orders', authenticateToken, async (req, res) => {
  const orders = await mongoDao.getOrders(req.user.id);
  res.json({ orders });
});

// GET single order tracking detail
app.get('/api/user/orders/:id/track', authenticateToken, async (req, res) => {
  const order = await mongoDao.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this order' });
  }
  res.json({ order });
});

// POST Create new order (Virtual Demo or Zerodha Kite gateway dispatch)
app.post('/api/user/orders', authenticateToken, async (req, res) => {
  const {
    symbol,
    action,
    quantity,
    price,
    exchange = 'NSE',
    orderType = 'MARKET',
    product = 'CNC',
    validity = 'DAY',
    broker = 'Zerodha Kite',
    tag,
    isDemo = false
  } = req.body;

  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({ error: 'Incomplete order specifications' });
  }

  const actionUpper = String(action).toUpperCase();
  const qty = Number(quantity);
  const unitPrice = Number(price);
  const totalVal = Number((qty * unitPrice).toFixed(2));
  const isVirtualDemo = isDemo || broker.toLowerCase().includes('demo') || broker.toLowerCase().includes('virtual');

  // Generate unique Kite-compliant reference tag (alphanumeric up to 20 chars)
  const orderTag = (tag || ('PS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase())).substring(0, 20);

  // Exact lifecycle tracking:
  // Virtual Demo orders execute immediately.
  // Real Zerodha Kite orders start in PENDING status until confirmed complete!
  const status = isVirtualDemo ? 'COMPLETE' : 'PENDING';
  const balanceApplied = isVirtualDemo;
  const statusMessage = isVirtualDemo
    ? 'Executed instantly via Virtual Demo Trading Engine'
    : 'Dispatched to Zerodha Kite basket. Awaiting execution confirmation.';

  const orderObj = {
    id: 'ord_' + Date.now() + Math.random().toString(36).substring(2, 6),
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    action: actionUpper,
    quantity: qty,
    price: unitPrice,
    total: totalVal,
    exchange: exchange.toUpperCase(),
    orderType: orderType.toUpperCase(),
    product: product.toUpperCase(),
    validity: validity.toUpperCase(),
    broker: isVirtualDemo ? 'Virtual Demo' : 'Zerodha Kite',
    status: status,
    tag: orderTag,
    kiteOrderId: req.body.kiteOrderId || null,
    exchangeOrderId: null,
    statusMessage,
    executedPrice: isVirtualDemo ? unitPrice : null,
    filledQuantity: isVirtualDemo ? qty : 0,
    pendingQuantity: isVirtualDemo ? 0 : qty,
    balanceApplied: balanceApplied,
    timestamp: new Date(),
    updatedAt: new Date()
  };

  await mongoDao.createOrder(orderObj);

  // Update user virtual wallet balance ONLY if order is confirmed/executed (Virtual Demo)
  if (balanceApplied) {
    const user = await mongoDao.findUserById(req.user.id);
    if (user) {
      let currentBalance = user.walletBalance || 500000;
      if (orderObj.action === 'BUY') {
        currentBalance = Math.max(0, currentBalance - orderObj.total);
      } else {
        currentBalance += orderObj.total;
      }
      await mongoDao.updateUserBalance(req.user.id, Number(currentBalance.toFixed(2)));
    }
  }

  res.status(201).json({
    message: isVirtualDemo
      ? 'Demo order executed successfully'
      : 'Kite order recorded as PENDING. Awaiting execution confirmation.',
    order: orderObj
  });
});

// PATCH / PUT update order status upon execution confirmation in Kite
const handleOrderStatusUpdate = async (req, res) => {
  const { status, kiteOrderId, executedPrice, filledQuantity, statusMessage } = req.body;
  const order = await mongoDao.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to modify this order' });
  }

  const validStatuses = ['PENDING', 'COMPLETE', 'EXECUTED', 'REJECTED', 'CANCELLED', 'OPEN'];
  const reqStatus = (status || '').toUpperCase();
  const normalizedStatus = (reqStatus === 'EXECUTED' || reqStatus === 'COMPLETE') ? 'COMPLETE' : reqStatus;

  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updates = {
    status: normalizedStatus,
    updatedAt: new Date()
  };

  if (kiteOrderId) updates.kiteOrderId = String(kiteOrderId).trim();
  if (executedPrice !== undefined && executedPrice !== null && !isNaN(executedPrice)) {
    updates.executedPrice = Number(executedPrice);
  }
  if (filledQuantity !== undefined && filledQuantity !== null && !isNaN(filledQuantity)) {
    updates.filledQuantity = Number(filledQuantity);
    updates.pendingQuantity = Math.max(0, order.quantity - Number(filledQuantity));
  }
  if (statusMessage) updates.statusMessage = String(statusMessage).trim();

  // Determine final price and total when marked COMPLETE
  if (normalizedStatus === 'COMPLETE') {
    const effectivePrice = updates.executedPrice || order.executedPrice || order.price;
    const effectiveQty = updates.filledQuantity !== undefined ? updates.filledQuantity : (order.filledQuantity || order.quantity);
    updates.executedPrice = effectivePrice;
    updates.filledQuantity = effectiveQty;
    updates.pendingQuantity = 0;
    updates.total = Number((effectivePrice * effectiveQty).toFixed(2));
    if (!updates.statusMessage) updates.statusMessage = 'Executed in Kite. Execution confirmed.';
  } else if (normalizedStatus === 'REJECTED' || normalizedStatus === 'CANCELLED') {
    if (!updates.statusMessage) updates.statusMessage = `Order ${normalizedStatus.toLowerCase()} on Kite.`;
  }

  // Exact wallet balance synchronization:
  const user = await mongoDao.findUserById(req.user.id);
  let updatedWalletBalance = user?.walletBalance || 500000;

  if (normalizedStatus === 'COMPLETE' && !order.balanceApplied) {
    updates.balanceApplied = true;
    if (user) {
      if (order.action === 'BUY') {
        updatedWalletBalance = Math.max(0, updatedWalletBalance - updates.total);
      } else {
        updatedWalletBalance = updatedWalletBalance + updates.total;
      }
      await mongoDao.updateUserBalance(req.user.id, Number(updatedWalletBalance.toFixed(2)));
    }
  } else if ((normalizedStatus === 'CANCELLED' || normalizedStatus === 'REJECTED') && order.balanceApplied) {
    // If order was previously marked complete and is later cancelled/rejected, reverse deduction
    updates.balanceApplied = false;
    if (user) {
      if (order.action === 'BUY') {
        updatedWalletBalance = updatedWalletBalance + order.total;
      } else {
        updatedWalletBalance = Math.max(0, updatedWalletBalance - order.total);
      }
      await mongoDao.updateUserBalance(req.user.id, Number(updatedWalletBalance.toFixed(2)));
    }
  }

  const updatedOrder = await mongoDao.updateOrder(order.id, updates);

  res.json({
    message: `Order status updated to ${normalizedStatus}`,
    order: updatedOrder,
    walletBalance: Number(updatedWalletBalance.toFixed(2))
  });
};

app.patch('/api/user/orders/:id/status', authenticateToken, handleOrderStatusUpdate);
app.put('/api/user/orders/:id/status', authenticateToken, handleOrderStatusUpdate);

// Zerodha Kite Connect Postback Webhook Endpoint
// Official Kite Connect postback receiver (receives real-time execution updates)
app.post('/api/kite/postback', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[Kite Postback Webhook] Received event:', JSON.stringify(payload));

    const orderId = payload.order_id || payload.orderId;
    const tag = payload.tag;
    const rawStatus = (payload.status || '').toUpperCase();
    const normalizedStatus = (rawStatus === 'EXECUTED' || rawStatus === 'COMPLETE') ? 'COMPLETE' : rawStatus;
    const avgPrice = payload.average_price || payload.averagePrice || payload.price;
    const filledQty = payload.filled_quantity !== undefined ? payload.filled_quantity : payload.quantity;
    const pendingQty = payload.pending_quantity;
    const statusMsg = payload.status_message || payload.status_message_raw || `Kite Postback: ${normalizedStatus}`;
    const exchangeOrderId = payload.exchange_order_id;

    if (!orderId && !tag) {
      return res.status(400).json({ error: 'Missing order_id or tag in postback payload' });
    }

    const order = await mongoDao.findOrderByTagOrKiteId(tag || orderId);
    if (!order) {
      console.warn(`[Kite Postback] No order found in database matching tag: ${tag} or orderId: ${orderId}`);
      return res.status(200).json({ status: 'ignored', message: 'Order not found in ProfitSheets' });
    }

    const updates = {
      status: normalizedStatus,
      kiteOrderId: orderId || order.kiteOrderId,
      exchangeOrderId: exchangeOrderId || order.exchangeOrderId,
      statusMessage: statusMsg,
      updatedAt: new Date()
    };

    if (avgPrice && !isNaN(avgPrice)) updates.executedPrice = Number(avgPrice);
    if (filledQty !== undefined && !isNaN(filledQty)) updates.filledQuantity = Number(filledQty);
    if (pendingQty !== undefined && !isNaN(pendingQty)) updates.pendingQuantity = Number(pendingQty);

    if (normalizedStatus === 'COMPLETE') {
      const effectivePrice = updates.executedPrice || order.executedPrice || order.price;
      const effectiveQty = updates.filledQuantity || order.quantity;
      updates.executedPrice = effectivePrice;
      updates.filledQuantity = effectiveQty;
      updates.pendingQuantity = 0;
      updates.total = Number((effectivePrice * effectiveQty).toFixed(2));

      if (!order.balanceApplied) {
        updates.balanceApplied = true;
        const user = await mongoDao.findUserById(order.userId);
        if (user) {
          let currentBalance = user.walletBalance || 500000;
          if (order.action === 'BUY') {
            currentBalance = Math.max(0, currentBalance - updates.total);
          } else {
            currentBalance += updates.total;
          }
          await mongoDao.updateUserBalance(order.userId, Number(currentBalance.toFixed(2)));
        }
      }
    }

    const updated = await mongoDao.updateOrder(order.id, updates);
    console.log(`[Kite Postback] Order ${order.id} (${order.symbol}) successfully updated to ${normalizedStatus}`);
    return res.status(200).json({ status: 'success', message: `Order updated to ${normalizedStatus}`, order: updated });
  } catch (err) {
    console.error('[Kite Postback Error]:', err);
    return res.status(500).json({ error: 'Internal error processing postback' });
  }
});

// Alias for legacy /api/user/trades
app.post('/api/user/trades', authenticateToken, async (req, res) => {
  // Delegate directly to /api/user/orders
  req.url = '/api/user/orders';
  return app.handle(req, res);
});

app.post('/api/user/reset-balance', authenticateToken, async (req, res) => {
  const { amount = 500000.00 } = req.body;
  await mongoDao.updateUserBalance(req.user.id, Number(amount));
  res.json({ message: 'Virtual cash balance reset successfully', walletBalance: Number(amount) });
});

app.delete('/api/user/orders', authenticateToken, async (req, res) => {
  await mongoDao.clearOrders(req.user.id);
  res.json({ message: 'Order history cleared successfully' });
});

// -------------------------------------------------------------
// SETTINGS (ANGEL ONE SMARTAPI & KITE PUBLISHER)
// -------------------------------------------------------------
app.get('/api/config/angel', async (req, res) => {
  const key = await mongoDao.getSetting('angel_api_key', process.env.ANGEL_API_KEY || 'o8RqGmQN');
  res.json({
    angel_api_key: key,
    provider: 'Angel One SmartAPI',
    isConfigured: Boolean(key && key.trim().length > 0)
  });
});

app.post('/api/config/angel', async (req, res) => {
  const { angel_api_key, jwt_token, feed_token } = req.body;
  const cleanKey = (angel_api_key || '').trim();
  if (cleanKey) await mongoDao.setSetting('angel_api_key', cleanKey);
  if (jwt_token) setAngelSession(jwt_token, feed_token);

  res.json({
    message: 'Angel One SmartAPI Key & Session updated successfully',
    angel_api_key: cleanKey,
    isConfigured: true
  });
});

app.get('/api/config/kite', async (req, res) => {
  const key = await mongoDao.getSetting('kite_api_key', process.env.KITE_API_KEY || 'pplopxdr29w7pa6u');
  res.json({
    kite_api_key: key,
    isConfigured: Boolean(key && key.trim().length > 0)
  });
});

app.post('/api/config/kite', async (req, res) => {
  const { kite_api_key } = req.body;
  const cleanKey = (kite_api_key || '').trim();
  await mongoDao.setSetting('kite_api_key', cleanKey);

  res.json({
    message: 'Kite API Key updated successfully',
    kite_api_key: cleanKey,
    isConfigured: Boolean(cleanKey.length > 0)
  });
});

// SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ProfitSheets Production Server] Running on port ${PORT}`);
  console.log(`[ProfitSheets Engine] Genuine Real-Time Yahoo Finance Stock Quotes Loaded`);
  console.log(`[ProfitSheets Engine] MongoDB Layer Initialized`);
});

export default app;
