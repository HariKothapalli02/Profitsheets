import axios from 'axios';

// Map of common symbols to BSE scrip codes
export const BSE_SCRIP_CODES = {
  'LALITHAA': '544879',
  'RELIANCE': '500325',
  'TCS': '532540',
  'INFY': '500209',
  'HDFCBANK': '500180',
  'ICICIBANK': '532174',
  'TATAMOTORS': '500570',
  'SBIN': '500112',
  'ITC': '500875',
  'BHARTIARTL': '532454',
  'LT': '500510',
  'TATASTEEL': '500470',
  'BAJFINANCE': '500034',
  'ASIANPAINT': '500820',
  'MARUTI': '532500',
  'HINDUNILVR': '500696',
  'WIPRO': '507685',
  'AXISBANK': '532215',
  'KOTAKBANK': '500247',
  'HCLTECH': '532281',
  'SUNPHARMA': '524715',
  'TITAN': '500114',
  'AVANTEL': '532406',
  'COASTCORP': '501831',
  'FRONTIER': '500241',
  'GPIL': '532734',
  'GRAND': '543248',
  'HBLPOWER': '517271',
  'PIXTRANS': '500333',
  'RACLGEAR': '520073',
  'SANDUMA': '504918',
  'SBCL': '513097',
  'VTM': '526519'
};

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

export function getBseScripCode(symbol) {
  if (!symbol) return null;
  const clean = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  return BSE_SCRIP_CODES[clean] || null;
}

export async function fetchBseCorporateAnnouncements(symbol) {
  const cleanSym = (symbol || '').trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  const scripCode = getBseScripCode(cleanSym);

  if (!scripCode) {
    return [];
  }

  const cached = cache.get(scripCode);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const d = new Date();
    const toDate = d.toISOString().slice(0, 10).replace(/-/g, '');
    const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Past 365 days
    const fromDate = past.toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=${fromDate}&strScrip=${scripCode}&strSearch=P&strToDate=${toDate}&strType=C&subcategory=`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bseindia.com/'
      }
    });

    if (!res.ok) {
      console.warn(`BSE returned HTTP ${res.status} for ${scripCode}`);
      return [];
    }

    const json = await res.json();
    const rows = json.Table || [];

    const formatted = rows.map((item, idx) => {
      const headline = item.HEADLINE || item.NEWSSUB || 'Corporate Filing';
      const cat = (item.CATEGORYNAME || item.NEWS_SUB || '').trim();
      const attachment = item.ATTACHMENTNAME ? item.ATTACHMENTNAME.trim() : null;

      // Classify type
      let type = 'Announcement';
      const lower = headline.toLowerCase();
      if (lower.includes('investor presentation') || lower.includes('presentation')) {
        type = 'Investor Presentation';
      } else if (lower.includes('concall') || lower.includes('earnings call') || lower.includes('transcript')) {
        type = 'Concall Transcript';
      } else if (lower.includes('financial result') || lower.includes('quarter') || lower.includes('half year') || lower.includes('annual result')) {
        type = 'Financial Results';
      } else if (lower.includes('board meeting') || lower.includes('outcome of board')) {
        type = 'Board Meeting';
      } else if (lower.includes('dividend') || lower.includes('bonus') || lower.includes('split') || lower.includes('record date')) {
        type = 'Corporate Action';
      }

      // Format Date
      let dateFormatted = '';
      if (item.DT_TM) {
        try {
          const dt = new Date(item.DT_TM);
          dateFormatted = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
          dateFormatted = item.DT_TM;
        }
      }

      const pdfUrl = attachment ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${attachment}` : null;
      const archiveUrl = `https://www.bseindia.com/corporates/anndet_new.aspx?origid=${encodeURIComponent(item.NEWSID || item.SCRIP_CD)}`;

      return {
        id: item.NEWSID || `bse_${idx}_${Date.now()}`,
        scripCode: item.SCRIP_CD,
        symbol: cleanSym,
        companyName: item.SLONGNAME || cleanSym,
        headline,
        summary: item.MORE ? item.MORE.replace(/<[^>]*>?/gm, '').trim() : '',
        category: cat || 'Regulatory Filing',
        type,
        date: dateFormatted || item.DT_TM,
        timestamp: item.DT_TM,
        hasPdf: Boolean(attachment),
        pdfUrl,
        bseUrl: pdfUrl || archiveUrl
      };
    });

    cache.set(scripCode, { data: formatted, ts: Date.now() });
    return formatted;
  } catch (err) {
    console.warn(`BSE Announcements fetch error for ${cleanSym} (${scripCode}):`, err.message);
    return [];
  }
}

let marketWideCache = null;
let lastMarketWideFetch = 0;
const MARKET_WIDE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

export async function fetchMarketWideBseAnnouncements(limit = 12) {
  if (marketWideCache && (Date.now() - lastMarketWideFetch < MARKET_WIDE_CACHE_TTL)) {
    return marketWideCache.slice(0, limit);
  }

  // Cross-sector representative market leaders with active BSE filings
  const coreWatch = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 
    'SBIN', 'ICICIBANK', 'ITC', 'BHARTIARTL', 'LT', 
    'HBLPOWER', 'BAJFINANCE', 'MARUTI', 'LALITHAA'
  ];

  try {
    const results = await Promise.all(
      coreWatch.map(sym => fetchBseCorporateAnnouncements(sym).catch(() => []))
    );
    const combined = results.flat();

    // Sort by chronological filing timestamp descending
    combined.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

    if (combined.length > 0) {
      marketWideCache = combined;
      lastMarketWideFetch = Date.now();
    }

    return (marketWideCache || []).slice(0, limit);
  } catch (err) {
    console.warn('Market-wide BSE announcements fetch error:', err.message);
    return marketWideCache ? marketWideCache.slice(0, limit) : [];
  }
}
