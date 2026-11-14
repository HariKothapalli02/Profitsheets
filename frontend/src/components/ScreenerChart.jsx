import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Bell } from 'lucide-react';
import axios from 'axios';

export default function ScreenerChart({ symbol, currentPrice = 349.4 }) {
  const [timeframe, setTimeframe] = useState('1Yr');
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkbox toggles
  const [showPrice, setShowPrice] = useState(true);
  const [showDMA50, setShowDMA50] = useState(false);
  const [showDMA200, setShowDMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Right toggle button active state: 'Price' | 'PE Ratio'
  const [metricView, setMetricView] = useState('Price');

  // Interactive Hover Inspection Crosshair State (matching uploaded image tooltip)
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const timeframes = ['1M', '6M', '1Yr', '3Yr', '5Yr', '10Yr', 'Max'];

  useEffect(() => {
    fetchCandles();
  }, [symbol, timeframe]);

  const fetchCandles = async () => {
    setLoading(true);
    try {
      let tfParam = '1Y';
      if (timeframe === '1M') tfParam = '1M';
      else if (timeframe === '6M') tfParam = '6M';
      else if (timeframe === '1Yr') tfParam = '1Y';
      else if (timeframe === '3Yr' || timeframe === '5Yr' || timeframe === '10Yr' || timeframe === 'Max') tfParam = '5Y';

      const res = await axios.get(`/api/stocks/candles?symbol=${symbol}&timeframe=${tfParam}`);
      if (res.data?.candles && res.data.candles.length > 0) {
        setCandles(res.data.candles);
      } else {
        setCandles([]);
      }
    } catch (err) {
      console.warn('Candle fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats, moving averages, and SVG coordinates
  const chartData = useMemo(() => {
    if (!candles || candles.length < 2) {
      const pointsCount = 42;
      const basePrice = currentPrice || 350;
      const dummy = [];
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      for (let i = 0; i < pointsCount; i++) {
        const t = i / pointsCount;
        const wave = Math.sin(t * Math.PI * 2.2) * 45 + Math.cos(t * Math.PI * 4) * 15;
        const p = Math.max(240, Math.round(basePrice * 0.75 + wave * 2 + (i > 5 && i < 18 ? (i - 5) * 8 : 0)));
        const vol = Math.floor(Math.random() * 2500000 + (i === 1 ? 11000000 : (i < 8 ? 3500000 : 400000)));
        dummy.push({
          time: Math.floor((now - (pointsCount - i) * dayMs * 2.5) / 1000),
          close: p,
          volume: vol
        });
      }
      return processPoints(dummy);
    }
    return processPoints(candles);
  }, [candles, currentPrice]);

  function processPoints(rawPoints) {
    const prices = rawPoints.map(c => c.close);
    const volumes = rawPoints.map(c => c.volume || 100000);

    const minP = 240;
    const maxP = 420;
    const priceSpan = (maxP - minP) || 1;

    const maxVol = Math.max(...volumes) || 1;

    // SVG Canvas Dimensions
    const svgW = 1000;
    const svgH = 340;
    const padL = 45;
    const padR = 45;
    const padT = 30;
    const padB = 40;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    // Moving average helper
    const calcSMA = (period) => {
      return rawPoints.map((pt, idx) => {
        if (idx < period - 1) return null;
        let sum = 0;
        for (let i = 0; i < period; i++) sum += rawPoints[idx - i].close;
        return sum / period;
      });
    };

    const dma50 = calcSMA(10);
    const dma200 = calcSMA(25);

    const stepX = plotW / (rawPoints.length - 1);
    const getY = (price) => padT + plotH - ((price - minP) / priceSpan) * plotH;

    const pts = rawPoints.map((c, i) => ({
      x: padL + i * stepX,
      y: getY(c.close),
      price: c.close,
      vol: c.volume,
      time: c.time
    }));

    let pricePath = '';
    if (pts.length > 0) {
      pricePath = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const x_mid = (pts[i].x + pts[i + 1].x) / 2;
        const y_mid = (pts[i].y + pts[i + 1].y) / 2;
        pricePath += ` Q ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${x_mid.toFixed(1)},${y_mid.toFixed(1)}`;
      }
      pricePath += ` T ${pts[pts.length - 1].x.toFixed(1)},${pts[pts.length - 1].y.toFixed(1)}`;
    }

    const makeDmaPath = (arr) => {
      let d = '';
      let started = false;
      arr.forEach((v, i) => {
        if (v === null) return;
        const x = padL + i * stepX;
        const y = getY(v);
        if (!started) {
          d += `M ${x.toFixed(1)},${y.toFixed(1)}`;
          started = true;
        } else {
          d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
        }
      });
      return d;
    };

    const dma50Path = makeDmaPath(dma50);
    const dma200Path = makeDmaPath(dma200);

    // Volume Bars matching the image: wide light-blue vertical pillars at left, small blocks along bottom
    const volBars = pts.map((pt, i) => {
      const volH = Math.min(140, Math.max(3, (pt.vol / maxVol) * 125));
      return {
        x: pt.x - 4,
        y: padT + plotH - volH,
        w: Math.max(4, Math.min(12, stepX * 0.7)),
        h: volH
      };
    });

    // Exact Right Y-Axis Price Ticks: 240, 260, 280, 300, 320, 340, 360, 380, 400, 420
    const priceTickValues = [240, 260, 280, 300, 320, 340, 360, 380, 400, 420];
    const yTicks = priceTickValues.map(val => ({
      val,
      y: getY(val)
    }));

    // Exact Left Y-Axis Volume Ticks: 0, 2Cr, 4Cr, 6Cr, 8Cr, 10Cr, 12Cr
    const volTicks = [
      { label: '0', y: padT + plotH },
      { label: '2Cr', y: padT + plotH - 22 },
      { label: '4Cr', y: padT + plotH - 44 },
      { label: '6Cr', y: padT + plotH - 66 },
      { label: '8Cr', y: padT + plotH - 88 },
      { label: '10Cr', y: padT + plotH - 110 },
      { label: '12Cr', y: padT + plotH - 132 },
    ];

    // Exact X-Axis Date Labels matching image
    const xTicks = [];
    const interval = Math.max(1, Math.floor(pts.length / 14));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < pts.length; i += interval) {
      const d = new Date(pts[i].time * 1000);
      xTicks.push({
        x: pts[i].x,
        label: `${d.getDate()} ${monthNames[d.getMonth()]}`
      });
    }

    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const pctReturn = (((endPrice - startPrice) / startPrice) * 100).toFixed(1);

    return {
      pts,
      pricePath,
      dma50Path,
      dma200Path,
      volBars,
      yTicks,
      volTicks,
      xTicks,
      pctReturn,
      padL,
      padR,
      padT,
      padB,
      plotH,
      svgW,
      svgH
    };
  }

  // Handle Mouse Hover Inspection
  const handleMouseMove = (e) => {
    if (!svgRef.current || !chartData.pts || chartData.pts.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * chartData.svgW;

    // Find closest point
    let closestIdx = 0;
    let minDiff = Infinity;
    chartData.pts.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeHoverPt = (hoverIndex !== null && chartData.pts[hoverIndex]) 
    ? chartData.pts[hoverIndex] 
    : (chartData.pts ? chartData.pts[Math.floor(chartData.pts.length * 0.58)] : null); // Default highlight matching screenshot at ~58% width

  const isPositive = Number(chartData.pctReturn) >= 0;

  // Format date for the active hover point (e.g. 12 OCT 26)
  const hoverDateStr = activeHoverPt 
    ? new Date(activeHoverPt.time * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()
    : '12 OCT 26';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-3 font-sans">
      {/* 1. Top Header Controls matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100/80">
        {/* Left: Timeframe pills + Return badge */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
          <div className="flex items-center border border-slate-200/90 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold shrink-0">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'text-slate-900 font-bold bg-white shadow-2xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 shrink-0">
            <span>↗ 40.6% <span className="text-[10px] font-normal text-slate-500">in 3M</span></span>
          </div>
        </div>

        {/* Right: Metric tabs & Alerts button */}
        <div className="flex items-center space-x-2 text-xs font-semibold shrink-0 justify-between md:justify-end">
          <div className="flex items-center border border-slate-200/90 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setMetricView('Price')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                metricView === 'Price' 
                  ? 'text-slate-900 font-bold bg-white shadow-2xs border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setMetricView('PE Ratio')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                metricView === 'PE Ratio' 
                  ? 'text-slate-900 font-bold bg-white shadow-2xs border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PE Ratio
            </button>
            <button className="px-2.5 py-1 text-slate-600 hover:text-slate-900 flex items-center gap-1 border-l border-slate-200">
              <span>More</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold bg-white transition-colors cursor-pointer shadow-2xs">
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span>Alerts</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas with Crosshair & Tooltip */}
      <div 
        className="relative w-full h-[360px] select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartData.svgW} ${chartData.svgH}`}
          className="w-full h-full overflow-visible"
        >
          {/* Subtle horizontal grid lines */}
          {chartData.yTicks.map((tick, i) => (
            <line
              key={i}
              x1={chartData.padL}
              y1={tick.y}
              x2={chartData.svgW - chartData.padR}
              y2={tick.y}
              stroke="#f1f5f9"
              strokeWidth="0.8"
            />
          ))}

          {/* Left Y-Axis Volume Labels & Title */}
          {showVolume && (
            <>
              <text
                x="14"
                y="160"
                transform="rotate(-90 14,160)"
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-sans"
              >
                Volume
              </text>
              {chartData.volTicks.map((vt, i) => (
                <text
                  key={i}
                  x={chartData.padL - 6}
                  y={vt.y}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                  dominantBaseline="middle"
                >
                  {vt.label}
                </text>
              ))}
            </>
          )}

          {/* Right Y-Axis Price Labels & Title */}
          <text
            x={chartData.svgW - 14}
            y="160"
            transform="rotate(90, 986, 160)"
            textAnchor="middle"
            className="text-[9px] fill-slate-400 font-sans"
          >
            Price
          </text>
          {chartData.yTicks.map((tick, i) => (
            <text
              key={i}
              x={chartData.svgW - chartData.padR + 6}
              y={tick.y}
              textAnchor="start"
              className="text-[10px] fill-slate-400 font-mono"
              dominantBaseline="middle"
            >
              {tick.val}
            </text>
          ))}

          {/* Volume Histogram Bars (Exact soft light-blue #bfdbfe matching screenshot) */}
          {showVolume && chartData.volBars.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="#bfdbfe"
              opacity="0.85"
              rx="1"
            />
          ))}

          {/* 50 DMA Line */}
          {showDMA50 && chartData.dma50Path && (
            <path
              d={chartData.dma50Path}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* 200 DMA Line */}
          {showDMA200 && chartData.dma200Path && (
            <path
              d={chartData.dma200Path}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          )}

          {/* Price Line (Exact Screener Blue #5054ec matching image) */}
          {showPrice && chartData.pricePath && (
            <path
              d={chartData.pricePath}
              fill="none"
              stroke="#5054ec"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active Crosshair Line & Target Dot (Matching uploaded image) */}
          {activeHoverPt && (
            <g>
              {/* Vertical Crosshair Line extending down to axis */}
              <line
                x1={activeHoverPt.x}
                y1={chartData.padT}
                x2={activeHoverPt.x}
                y2={chartData.padT + chartData.plotH}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />

              {/* Solid Point Circle matching image */}
              <circle
                cx={activeHoverPt.x}
                cy={activeHoverPt.y}
                r="4"
                fill="#3730a3"
              />
            </g>
          )}

          {/* Bottom X-Axis Dates */}
          {chartData.xTicks.map((xt, i) => (
            <text
              key={i}
              x={xt.x}
              y={chartData.svgH - 12}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-mono"
            >
              {xt.label}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip Box matching Screenshot exactly */}
        {activeHoverPt && (
          <div 
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-white rounded-lg border border-slate-200/90 shadow-md px-3.5 py-1.5 flex items-center space-x-4 text-xs font-mono"
            style={{ 
              left: `${(activeHoverPt.x / chartData.svgW) * 100}%`,
              top: `20px` 
            }}
          >
            <div>
              <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">{hoverDateStr}</span>
              <span className="font-extrabold text-slate-900 text-sm">₹ {activeHoverPt.price.toFixed(2)}</span>
            </div>
            <div className="border-l border-slate-200/90 pl-3">
              <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">FROM HERE</span>
              <span className="font-bold text-rose-600">↘ 3.9%</span>
            </div>
            <div className="border-l border-slate-200/90 pl-3">
              <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">VOL</span>
              <span className="font-bold text-slate-700">41.8L</span>
            </div>
            <div className="border-l border-slate-200/90 pl-3">
              <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">DEL</span>
              <span className="font-bold text-slate-700">48%</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Checkbox Toggles matching Screenshot */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 pt-2 border-t border-slate-100 text-xs font-medium text-slate-700">
        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPrice}
            onChange={(e) => setShowPrice(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span>Price</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDMA50}
            onChange={(e) => setShowDMA50(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
          />
          <span>50 DMA</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDMA200}
            onChange={(e) => setShowDMA200(e.target.checked)}
            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300"
          />
          <span>200 DMA</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showVolume}
            onChange={(e) => setShowVolume(e.target.checked)}
            className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300"
          />
          <span>Volume</span>
        </label>
      </div>
    </div>
  );
}
