import axios from 'axios';
import * as cheerio from 'cheerio';

const newsCache = new Map(); // symbol -> { items, ts }
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

// Map symbol to human friendly company search query
const COMPANY_NAMES = {
  'RELIANCE': 'Reliance Industries',
  'TCS': 'Tata Consultancy Services TCS',
  'INFY': 'Infosys',
  'HDFCBANK': 'HDFC Bank',
  'ICICIBANK': 'ICICI Bank',
  'SBIN': 'State Bank of India SBI',
  'BHARTIARTL': 'Bharti Airtel',
  'ITC': 'ITC Limited',
  'LALITHAA': 'Lalithaa Jewellery Mart',
  'TATAMOTORS': 'Tata Motors',
  'WIPRO': 'Wipro',
  'AXISBANK': 'Axis Bank',
  'KOTAKBANK': 'Kotak Mahindra Bank',
  'LT': 'Larsen Toubro LT',
  'BAJFINANCE': 'Bajaj Finance',
  'MARUTI': 'Maruti Suzuki',
  'ASIANPAINT': 'Asian Paints',
  'HCLTECH': 'HCL Technologies',
  'SUNPHARMA': 'Sun Pharma',
  'TITAN': 'Titan Company'
};

export async function fetchCompanySpecificNews(symbol) {
  const sym = (symbol || '').trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  
  const cached = newsCache.get(sym);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
    return cached.items;
  }

  const queryName = COMPANY_NAMES[sym] || sym;
  // Search Google News RSS for Indian financial and corporate stories
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(queryName + ' stock OR share OR business OR quarterly results')}&hl=en-IN&gl=IN&ceid=IN:en`;

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = [];

    $('item').slice(0, 15).each((idx, el) => {
      const rawTitle = $(el).find('title').text();
      const link = $(el).find('link').text();
      const pubDate = $(el).find('pubDate').text();
      const description = $(el).find('description').text();

      // Clean title & source
      let title = rawTitle;
      let source = 'Financial News';
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        source = parts.pop().trim();
        title = parts.join(' - ').trim();
      }

      // Strip HTML tags from description
      const $desc = cheerio.load(description || '');
      const cleanDesc = $desc.text().trim();

      items.push({
        id: `news_${sym}_${idx}`,
        title,
        source,
        url: link,
        datetime: pubDate ? new Date(pubDate).getTime() : Date.now(),
        dateStr: pubDate ? new Date(pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        summary: cleanDesc.length > 20 ? cleanDesc : `${title}. Read full corporate coverage on ${source}.`,
        category: 'Corporate Update'
      });
    });

    newsCache.set(sym, { items, ts: Date.now() });
    return items;
  } catch (err) {
    console.warn(`[CompanyNews] Failed for ${sym}:`, err.message);
    return [];
  }
}
