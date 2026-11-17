import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchBseCorporateAnnouncements } from './bseAnnouncements.js';

const newsCache = new Map(); // symbol -> { items, ts }
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

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
  'TITAN': 'Titan Company',
  'AVANTEL': 'Avantel Limited',
  'COASTCORP': 'Coastal Corporation',
  'FRONTIER': 'Frontier Springs',
  'GPIL': 'Godawari Power and Ispat',
  'HBLPOWER': 'HBL Power Systems',
  'SANDUMA': 'Sandur Manganese & Iron Ores'
};

const US_STOCKS = new Set(['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC', 'BRK.B', 'JNJ', 'JPM', 'V', 'PG']);

export async function fetchCompanySpecificNews(symbol) {
  const sym = (symbol || '').trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  if (!sym) return [];
  
  const cached = newsCache.get(sym);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
    return cached.items;
  }

  // 1. For US stocks, fetch directly from Yahoo Finance news search
  if (US_STOCKS.has(sym)) {
    try {
      const yRes = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(sym)}&newsCount=10`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 4000
      });
      const yArticles = yRes.data?.news || [];
      if (yArticles.length > 0) {
        const items = yArticles.map((a, idx) => ({
          id: `news_${sym}_${idx}`,
          title: a.title,
          headline: a.title,
          source: a.publisher || 'Financial Press',
          url: a.link, // Direct article link on finance.yahoo.com
          datetime: (a.providerPublishTime || 0) * 1000 || Date.now(),
          dateStr: a.providerPublishTime ? new Date(a.providerPublishTime * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          summary: `${a.title}. Verified corporate financial reporting via ${a.publisher || 'Financial Press'}.`,
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
          category: 'Corporate Update'
        }));
        newsCache.set(sym, { items, ts: Date.now() });
        return items;
      }
    } catch (err) {
      console.warn(`[CompanyNews] Yahoo news failed for ${sym}:`, err.message);
    }
  }

  // 2. For Indian stocks, query Google News RSS with Indian edition
  const queryName = COMPANY_NAMES[sym] || sym;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(queryName + ' stock OR share OR business OR quarterly results')}&hl=en-IN&gl=IN&ceid=IN:en`;

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 5000
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = [];

    $('item').slice(0, 15).each((idx, el) => {
      const rawTitle = $(el).find('title').text();
      const pubDate = $(el).find('pubDate').text();
      const description = $(el).find('description').text();

      // Clean title & source
      let title = rawTitle;
      let source = 'Financial Press';
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        source = parts.pop().trim();
        title = parts.join(' - ').trim();
      }

      // Strip HTML tags from description
      const $desc = cheerio.load(description || '');
      const cleanDesc = $desc.text().trim();

      // SAFE URL: Direct Google Search for the exact headline & source.
      // Raw Google News RSS links (news.google.com/rss/articles/CBMi...) trigger
      // Google's anti-bot "We're sorry... automated queries" block.
      // A clean Google Search link opens the exact article at top of Google search without any bot block.
      const safeUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + source)}`;

      items.push({
        id: `news_${sym}_${idx}`,
        title,
        headline: title,
        source,
        url: safeUrl,
        datetime: pubDate ? new Date(pubDate).getTime() : Date.now(),
        dateStr: pubDate ? new Date(pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        summary: cleanDesc.length > 20 ? cleanDesc : `${title}. Read full corporate coverage on ${source}.`,
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
        category: 'Corporate Update'
      });
    });

    if (items.length > 0) {
      newsCache.set(sym, { items, ts: Date.now() });
      return items;
    }
  } catch (err) {
    console.warn(`[CompanyNews] Google News RSS failed for ${sym}:`, err.message);
  }

  // 3. Fallback: Official BSE India Corporate Announcements
  try {
    const bseAnnouncements = await fetchBseCorporateAnnouncements(sym);
    if (bseAnnouncements && bseAnnouncements.length > 0) {
      const bseNews = bseAnnouncements.slice(0, 10).map((b, idx) => ({
        id: `bse_news_${sym}_${idx}`,
        title: b.headline,
        headline: b.headline,
        source: 'BSE India Official Filing',
        url: b.bseUrl || b.pdfUrl,
        datetime: b.timestamp ? new Date(b.timestamp).getTime() : Date.now(),
        dateStr: b.date || 'Recent',
        summary: b.summary || `${b.headline}. Official regulatory announcement filed under Regulation 30.`,
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
        category: b.type || 'Regulatory Disclosure'
      }));
      newsCache.set(sym, { items: bseNews, ts: Date.now() });
      return bseNews;
    }
  } catch (bseErr) {
    console.warn(`[CompanyNews] BSE fallback failed for ${sym}:`, bseErr.message);
  }

  return [];
}
