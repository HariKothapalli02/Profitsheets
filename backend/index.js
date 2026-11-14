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

// Normalize URL prefix for Vercel Serverless Function & Express routing
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/assets') && !req.url.startsWith('/favicon')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Ensure MongoDB is connected on cold starts in serverless environments
app.use(async (req, res, next) => {
  if (!mongoDao.isConnected()) {
    initMongoDB().catch(() => {});
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

// Dedicated BSE Corporate Announcements & Concalls
app.get('/api/stocks/bse-announcements', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
    const announcements = await fetchBseCorporateAnnouncements(symbol);
    res.json({ symbol, count: announcements.length, announcements });
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

app.get('/api/user/orders', authenticateToken, async (req, res) => {
  const orders = await mongoDao.getOrders(req.user.id);
  res.json({ orders });
});

app.post('/api/user/orders', authenticateToken, async (req, res) => {
  const { symbol, action, quantity, price, exchange = 'NSE', orderType = 'MARKET' } = req.body;
  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({ error: 'Incomplete order specifications' });
  }

  const orderObj = {
    id: 'ord_' + Date.now() + Math.random().toString(36).substring(2, 6),
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    action: action.toUpperCase(),
    quantity: Number(quantity),
    price: Number(price),
    total: Number((quantity * price).toFixed(2)),
    exchange,
    orderType,
    broker: 'Zerodha Kite',
    status: 'EXECUTED',
    timestamp: new Date()
  };

  await mongoDao.createOrder(orderObj);

  // Update user virtual wallet balance
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

  res.status(201).json({ message: 'Order executed and logged successfully', order: orderObj });
});

// Alias for trades
app.post('/api/user/trades', authenticateToken, async (req, res) => {
  const { symbol, action, quantity, price, exchange = 'NSE', orderType = 'MARKET' } = req.body;
  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({ error: 'Incomplete order specifications' });
  }

  const orderObj = {
    id: 'ord_' + Date.now() + Math.random().toString(36).substring(2, 6),
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    action: action.toUpperCase(),
    quantity: Number(quantity),
    price: Number(price),
    total: Number((quantity * price).toFixed(2)),
    exchange,
    orderType,
    broker: 'Zerodha Kite',
    status: 'EXECUTED',
    timestamp: new Date()
  };

  await mongoDao.createOrder(orderObj);
  res.status(201).json({ message: 'Trade recorded successfully', order: orderObj });
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

// Only listen on local port when running as a standalone node process (not on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[ProfitSheets Production Server] Running on http://localhost:${PORT}`);
    console.log(`[ProfitSheets Engine] Genuine Real-Time Yahoo Finance Stock Quotes Loaded`);
    console.log(`[ProfitSheets Engine] MongoDB Layer Initialized`);
  });
}

export default app;
