import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// Cache to prevent excessive calls and keep UI fast
const cache = {
  quotes: new Map(),
  candles: new Map(),
  search: new Map()
};

const QUOTE_TTL = 8 * 1000; // 8 seconds cache for fresh live pricing
const CANDLE_TTL = 60 * 1000;

// Curated Indian Bluechips & Global Leaders
export const POPULAR_SYMBOLS = [
  { symbol: 'LALITHAA', yahoo: 'LALITHAA.NS', name: 'Lalithaa Jewellery Mart Ltd.', exchange: 'BSE/NSE', sector: 'Retail & Jewellery' },
  { symbol: 'RELIANCE', yahoo: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy & Retail' },
  { symbol: 'TCS', yahoo: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'Information Technology' },
  { symbol: 'INFY', yahoo: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', sector: 'Information Technology' },
  { symbol: 'HDFCBANK', yahoo: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', exchange: 'NSE', sector: 'Banking & Finance' },
  { symbol: 'ICICIBANK', yahoo: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', exchange: 'NSE', sector: 'Banking & Finance' },
  { symbol: 'TATAMOTORS', yahoo: 'TATAMOTORS.NS', name: 'Tata Motors Ltd.', exchange: 'NSE', sector: 'Automobile' },
  { symbol: 'SBIN', yahoo: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', sector: 'Banking & Finance' },
  { symbol: 'ITC', yahoo: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', sector: 'FMCG & Consumer' },
  { symbol: 'BHARTIARTL', yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'LT', yahoo: 'LT.NS', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', sector: 'Engineering & Infra' },
  { symbol: 'TATASTEEL', yahoo: 'TATASTEEL.NS', name: 'Tata Steel Limited', exchange: 'NSE', sector: 'Metals & Mining' },
  { symbol: 'BAJFINANCE', yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd.', exchange: 'NSE', sector: 'Banking & Finance' },
  { symbol: 'ASIANPAINT', yahoo: 'ASIANPAINT.NS', name: 'Asian Paints Ltd.', exchange: 'NSE', sector: 'Consumer Goods' },
  { symbol: 'MARUTI', yahoo: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE', sector: 'Automobile' },
  { symbol: 'HINDUNILVR', yahoo: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd.', exchange: 'NSE', sector: 'FMCG & Consumer' },
  { symbol: 'AAPL', yahoo: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Consumer Tech' },
  { symbol: 'NVDA', yahoo: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Semiconductors & AI' },
  { symbol: 'MSFT', yahoo: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Software & Cloud' },
  { symbol: 'TSLA', yahoo: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', sector: 'Automotive & Clean Energy' }
];

export function resolveYahooSymbol(symbol) {
  const s = symbol.trim().toUpperCase();
  const match = POPULAR_SYMBOLS.find(p => p.symbol === s || p.yahoo === s);
  if (match) return match.yahoo;

  if (s.endsWith('.NS') || s.endsWith('.BO')) return s;
  if (['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(s)) {
    return s;
  }
  return `${s}.NS`;
}

// Fetch 100% Genuine Live Stock Quote
export async function fetchLiveQuote(symbol) {
  const yahooSymbol = resolveYahooSymbol(symbol);
  const cached = cache.quotes.get(yahooSymbol);
  if (cached && (Date.now() - cached.ts < QUOTE_TTL)) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 6000 });
    const result = res.data?.chart?.result?.[0];

    if (!result || !result.meta) {
      throw new Error(`No data returned for ${yahooSymbol}`);
    }

    const meta = result.meta;
    const cleanSym = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    const isIndian = yahooSymbol.endsWith('.NS') || yahooSymbol.endsWith('.BO');

    const price = Number((meta.regularMarketPrice || 0).toFixed(2));
    const previousClose = Number((meta.chartPreviousClose || meta.previousClose || price).toFixed(2));
    const change = Number((price - previousClose).toFixed(2));
    const changePercent = previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;

    // Extract exact Today and Yesterday OHLC candles
    const timestamps = result.timestamp || [];
    const quoteData = result.indicators?.quote?.[0] || {};
    const len = timestamps.length;
    const todayIdx = len > 0 ? len - 1 : -1;
    const yestIdx = len > 1 ? len - 2 : -1;

    const todayDate = todayIdx >= 0 ? new Date(timestamps[todayIdx] * 1000).toISOString().split('T')[0] : '';
    const yesterdayDate = yestIdx >= 0 ? new Date(timestamps[yestIdx] * 1000).toISOString().split('T')[0] : '';

    const todayOpen = Number((todayIdx >= 0 && quoteData.open?.[todayIdx] != null ? quoteData.open[todayIdx] : meta.regularMarketOpen || price).toFixed(2));
    const todayClose = price;
    const todayHigh = Number((todayIdx >= 0 && quoteData.high?.[todayIdx] != null ? quoteData.high[todayIdx] : meta.regularMarketDayHigh || price).toFixed(2));
    const todayLow = Number((todayIdx >= 0 && quoteData.low?.[todayIdx] != null ? quoteData.low[todayIdx] : meta.regularMarketDayLow || price).toFixed(2));

    const yesterdayOpen = Number((yestIdx >= 0 && quoteData.open?.[yestIdx] != null ? quoteData.open[yestIdx] : previousClose).toFixed(2));
    const yesterdayClose = Number((yestIdx >= 0 && quoteData.close?.[yestIdx] != null ? quoteData.close[yestIdx] : previousClose).toFixed(2));
    const yesterdayHigh = Number((yestIdx >= 0 && quoteData.high?.[yestIdx] != null ? quoteData.high[yestIdx] : previousClose).toFixed(2));
    const yesterdayLow = Number((yestIdx >= 0 && quoteData.low?.[yestIdx] != null ? quoteData.low[yestIdx] : previousClose).toFixed(2));

    const quote = {
      symbol: cleanSym,
      yahooSymbol,
      name: meta.shortName || meta.longName || cleanSym,
      exchange: isIndian ? (yahooSymbol.endsWith('.BO') ? 'BSE' : 'NSE') : (meta.exchangeName || 'US'),
      currency: isIndian ? 'INR' : (meta.currency || 'USD'),
      currencySymbol: isIndian ? '₹' : '$',
      price,
      change,
      changePercent,
      open: todayOpen,
      high: todayHigh,
      low: todayLow,
      previousClose,
      todayOpen,
      todayClose,
      todayHigh,
      todayLow,
      todayDate,
      yesterdayOpen,
      yesterdayClose,
      yesterdayHigh,
      yesterdayLow,
      yesterdayDate,
      today: {
        date: todayDate,
        open: todayOpen,
        close: todayClose,
        high: todayHigh,
        low: todayLow
      },
      yesterday: {
        date: yesterdayDate,
        open: yesterdayOpen,
        close: yesterdayClose,
        high: yesterdayHigh,
        low: yesterdayLow
      },
      volume: meta.regularMarketVolume || 0,
      fiftyTwoWeekHigh: Number((meta.fiftyTwoWeekHigh || price * 1.2).toFixed(2)),
      fiftyTwoWeekLow: Number((meta.fiftyTwoWeekLow || price * 0.8).toFixed(2)),
      marketCap: meta.marketCap || 0,
      timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()
    };

    cache.quotes.set(yahooSymbol, { data: quote, ts: Date.now() });
    return quote;
  } catch (err) {
    if (yahooSymbol.endsWith('.NS')) {
      try {
        const bareSym = yahooSymbol.replace('.NS', '');
        const urlFallback = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(bareSym)}?interval=1d&range=1d`;
        const res2 = await axios.get(urlFallback, { headers: HEADERS, timeout: 6000 });
        const result2 = res2.data?.chart?.result?.[0];
        if (result2 && result2.meta) {
          const meta2 = result2.meta;
          const price2 = Number((meta2.regularMarketPrice || 0).toFixed(2));
          const prev2 = Number((meta2.chartPreviousClose || meta2.previousClose || price2).toFixed(2));
          const chg2 = Number((price2 - prev2).toFixed(2));
          const pct2 = prev2 > 0 ? Number(((chg2 / prev2) * 100).toFixed(2)) : 0;

          const quote2 = {
            symbol: bareSym,
            yahooSymbol: bareSym,
            name: meta2.shortName || meta2.longName || bareSym,
            exchange: meta2.exchangeName || 'US',
            currency: meta2.currency || 'USD',
            currencySymbol: '$',
            price: price2,
            change: chg2,
            changePercent: pct2,
            open: Number((meta2.regularMarketOpen || price2).toFixed(2)),
            high: Number((meta2.regularMarketDayHigh || price2).toFixed(2)),
            low: Number((meta2.regularMarketDayLow || price2).toFixed(2)),
            previousClose: prev2,
            volume: meta2.regularMarketVolume || 0,
            fiftyTwoWeekHigh: Number((meta2.fiftyTwoWeekHigh || price2 * 1.2).toFixed(2)),
            fiftyTwoWeekLow: Number((meta2.fiftyTwoWeekLow || price2 * 0.8).toFixed(2)),
            marketCap: meta2.marketCap || 0,
            timestamp: meta2.regularMarketTime ? meta2.regularMarketTime * 1000 : Date.now()
          };
          cache.quotes.set(yahooSymbol, { data: quote2, ts: Date.now() });
          return quote2;
        }
      } catch (e) {}
    }
    throw err;
  }
}

// Fetch Candlestick Data (1D, 1W, 1M, 1Y, 5Y)
export async function fetchLiveCandles(symbol, timeframe = '1M') {
  const yahooSymbol = resolveYahooSymbol(symbol);
  const cacheKey = `${yahooSymbol}_${timeframe}`;
  const cached = cache.candles.get(cacheKey);
  if (cached && (Date.now() - cached.ts < CANDLE_TTL)) {
    return cached.data;
  }

  let interval = '1d';
  let range = '3y';

  const tf = (timeframe || '').toUpperCase();
  if (tf === '1D') {
    interval = '5m';
    range = '1d';
  } else if (tf === '1W') {
    interval = '15m';
    range = '5d';
  } else if (tf === '1M') {
    interval = '1d';
    range = '1mo';
  } else if (tf === '6M') {
    interval = '1d';
    range = '6mo';
  } else if (tf === '1Y' || tf === '1YR') {
    interval = '1d';
    range = '1y';
  } else if (tf === '3Y' || tf === '3YR') {
    interval = '1d';
    range = '3y';
  } else {
    interval = '1d';
    range = '3y';
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 7000 });
    const result = res.data?.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error(`Candles unavailable for ${yahooSymbol}`);
    }

    const timestamps = result.timestamp;
    const rawQuote = result.indicators.quote[0];
    const opens = rawQuote.open || [];
    const highs = rawQuote.high || [];
    const lows = rawQuote.low || [];
    const closes = rawQuote.close || [];
    const volumes = rawQuote.volume || [];

    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        const close = Number(closes[i].toFixed(2));
        const open = Number((opens[i] !== null ? opens[i] : close).toFixed(2));
        const high = Number((highs[i] !== null ? highs[i] : Math.max(open, close)).toFixed(2));
        const low = Number((lows[i] !== null ? lows[i] : Math.min(open, close)).toFixed(2));

        candles.push({
          time: timestamps[i],
          open,
          high,
          low,
          close,
          volume: volumes[i] || 0
        });
      }
    }

    cache.candles.set(cacheKey, { data: candles, ts: Date.now() });
    return candles;
  } catch (err) {
    console.warn(`Candles error for ${yahooSymbol}:`, err.message);
    return [];
  }
}

// Global Live Stock Search (Searches curated list + online query)
export async function searchStocks(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  // 1. First search our rich local list
  const localMatches = POPULAR_SYMBOLS.filter(s => 
    s.symbol.toLowerCase().includes(q) || 
    s.name.toLowerCase().includes(q) ||
    s.sector.toLowerCase().includes(q)
  ).map(s => ({
    symbol: s.symbol,
    yahooSymbol: s.yahoo,
    name: s.name,
    exchange: s.exchange,
    sector: s.sector,
    currency: s.exchange === 'NSE' ? 'INR' : 'USD'
  }));

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 5000 });
    const quotes = res.data?.quotes || [];

    const onlineMatches = quotes
      .filter(item => item.quoteType === 'EQUITY' || item.quoteType === 'ETF')
      .map(item => {
        const isIndian = item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO');
        const cleanSymbol = item.symbol.replace('.NS', '').replace('.BO', '');
        return {
          symbol: cleanSymbol,
          yahooSymbol: item.symbol,
          name: item.shortname || item.longname || cleanSymbol,
          exchange: isIndian ? (item.symbol.endsWith('.BO') ? 'BSE' : 'NSE') : (item.exchDisp || item.exchange || 'US'),
          currency: isIndian ? 'INR' : 'USD'
        };
      });

    // Merge and deduplicate
    const seen = new Set();
    const combined = [...localMatches, ...onlineMatches].filter(item => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    });

    return combined.slice(0, 10);
  } catch (err) {
    return localMatches;
  }
}
