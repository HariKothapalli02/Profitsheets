import axios from 'axios';

// Angel One Official Instrument Token Mapping for popular NSE/BSE Equities
export const ANGEL_TOKENS = {
  'RELIANCE': { token: '2885', exchange: 'NSE', name: 'Reliance Industries Ltd' },
  'TCS': { token: '11536', exchange: 'NSE', name: 'Tata Consultancy Services' },
  'INFY': { token: '1594', exchange: 'NSE', name: 'Infosys Limited' },
  'HDFCBANK': { token: '1333', exchange: 'NSE', name: 'HDFC Bank Ltd' },
  'ICICIBANK': { token: '4963', exchange: 'NSE', name: 'ICICI Bank Ltd' },
  'SBIN': { token: '3045', exchange: 'NSE', name: 'State Bank of India' },
  'BHARTIARTL': { token: '10604', exchange: 'NSE', name: 'Bharti Airtel Ltd' },
  'ITC': { token: '1660', exchange: 'NSE', name: 'ITC Limited' },
  'LALITHAA': { token: '544879', exchange: 'BSE', name: 'Lalithaa Jewellery Mart Ltd' },
  'TATAMOTORS': { token: '3456', exchange: 'NSE', name: 'Tata Motors Limited' },
  'WIPRO': { token: '3787', exchange: 'NSE', name: 'Wipro Limited' },
  'AXISBANK': { token: '5900', exchange: 'NSE', name: 'Axis Bank Limited' },
  'KOTAKBANK': { token: '1922', exchange: 'NSE', name: 'Kotak Mahindra Bank' },
  'LT': { token: '11483', exchange: 'NSE', name: 'Larsen & Toubro Ltd' },
  'BAJFINANCE': { token: '317', exchange: 'NSE', name: 'Bajaj Finance Ltd' },
  'MARUTI': { token: '10999', exchange: 'NSE', name: 'Maruti Suzuki India' },
  'ASIANPAINT': { token: '236', exchange: 'NSE', name: 'Asian Paints Ltd' },
  'HCLTECH': { token: '7229', exchange: 'NSE', name: 'HCL Technologies Ltd' },
  'SUNPHARMA': { token: '3351', exchange: 'NSE', name: 'Sun Pharma Ltd' },
  'TITAN': { token: '3506', exchange: 'NSE', name: 'Titan Company Ltd' },
  'HBLPOWER': { token: '517271', exchange: 'BSE', name: 'HBL Power Systems Ltd' },
  'AVANTEL': { token: '532406', exchange: 'BSE', name: 'Avantel Limited' },
  'SANDUMA': { token: '504918', exchange: 'BSE', name: 'The Sandur Manganese & Iron Ores Ltd' },
  'SBCL': { token: '513097', exchange: 'BSE', name: 'Shivalik Bimetal Controls Ltd' }
};

export const ANGEL_API_KEY = process.env.ANGEL_API_KEY || 'o8RqGmQN';

// Store daily JWT access token when authenticated
let angelSession = {
  jwtToken: null,
  refreshToken: null,
  feedToken: null
};

export function setAngelSession(jwtToken, feedToken) {
  angelSession.jwtToken = jwtToken;
  angelSession.feedToken = feedToken;
}

export function getAngelSession() {
  return angelSession;
}

// Fetch live quote using Angel One SmartAPI Market Data endpoint
export async function fetchAngelMarketQuote(symbol) {
  const sym = (symbol || '').trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  const info = ANGEL_TOKENS[sym] || { token: '2885', exchange: 'NSE', name: `${sym} Ltd` };

  // Headers required by Angel One SmartAPI
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '178.93.82.90',
    'X-MACAddress': 'fe80::1',
    'X-PrivateKey': ANGEL_API_KEY
  };

  if (angelSession.jwtToken) {
    headers['Authorization'] = `Bearer ${angelSession.jwtToken}`;
  }

  try {
    const res = await axios.post(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/',
      {
        mode: 'FULL',
        exchangeTokens: {
          [info.exchange]: [info.token]
        }
      },
      { headers, timeout: 4000 }
    );

    if (res.data?.status && res.data?.data?.fetched?.[0]) {
      const q = res.data.data.fetched[0];
      return {
        symbol: sym,
        token: info.token,
        name: info.name,
        exchange: info.exchange,
        price: parseFloat(q.ltp) || 0,
        change: parseFloat(q.netChange) || 0,
        changePercent: parseFloat(q.percentChange) || 0,
        high: parseFloat(q.high) || 0,
        low: parseFloat(q.low) || 0,
        open: parseFloat(q.open) || 0,
        previousClose: parseFloat(q.close) || 0,
        volume: parseInt(q.tradeVolume) || 0,
        fiftyTwoWeekHigh: parseFloat(q.high52) || 0,
        fiftyTwoWeekLow: parseFloat(q.low52) || 0,
        source: 'Angel One SmartAPI'
      };
    }
  } catch (err) {
    // If unauthenticated or token expires, return standardized structure
    // console.warn(`[AngelOne] Direct quote note for ${sym}:`, err.message);
  }

  return null;
}

// Fetch historical candles via Angel One SmartAPI
export async function fetchAngelCandles(symbol, interval = 'ONE_DAY', fromDate, toDate) {
  const sym = (symbol || '').trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  const info = ANGEL_TOKENS[sym] || { token: '2885', exchange: 'NSE' };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '178.93.82.90',
    'X-MACAddress': 'fe80::1',
    'X-PrivateKey': ANGEL_API_KEY
  };

  if (angelSession.jwtToken) {
    headers['Authorization'] = `Bearer ${angelSession.jwtToken}`;
  }

  try {
    const res = await axios.post(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData',
      {
        exchange: info.exchange,
        symboltoken: info.token,
        interval: interval, // 'ONE_MINUTE', 'FIFTEEN_MINUTE', 'ONE_DAY'
        fromdate: fromDate || '2025-01-01 09:15',
        todate: toDate || '2026-11-13 15:30'
      },
      { headers, timeout: 5000 }
    );

    if (res.data?.status && res.data?.data) {
      return res.data.data.map(c => ({
        time: Math.floor(new Date(c[0]).getTime() / 1000),
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5]
      }));
    }
  } catch (e) {
    // console.warn(`[AngelOne] Historical candles error:`, e.message);
  }

  return [];
}
