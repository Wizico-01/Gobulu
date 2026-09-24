import React from "react";

const AXIS_W = 42;
const CHART_H = 76;
const PAD_X = 4;
const PAD_Y = 6;

// Renders an actual candlestick chart with a price axis, gridlines,
// support/resistance level lines, and a live current-price marker.
// If real OHLC candles exist for this tier (live data), draws them
// directly. If only swing points exist (demo data), synthesizes a
// plausible candle sequence between them.
export default function CandlestickChart({ candles, labeled, trend, decimals = 4 }) {
  const bars = candles?.length ? candles : synthesizeCandles(labeled);
  if (!bars.length) return <div className="h-16" />;

  const levelPrices = (labeled ?? []).map((p) => p.price);
  const currentPrice = bars[bars.length - 1].close;

  const allPrices = [...bars.map((b) => b.high), ...bars.map((b) => b.low), ...levelPrices, currentPrice];
  const max = Math.max(...allPrices);
  const min = Math.min(...allPrices);
  const range = max - min || 1;

  const plotW = 280;
  const w = plotW + AXIS_W;
  const h = CHART_H;
  const barW = (plotW - PAD_X * 2) / bars.length;
  const y = (price) => h - PAD_Y - ((price - min) / range) * (h - PAD_Y * 2);

  const gridCount = 3;
  const gridLines = Array.from({ length: gridCount }, (_, i) => min + (range * i) / (gridCount - 1));
  const fmt = (p) => p.toFixed(decimals);

  const upColor = "#0E9F6E";
  const downColor = "#E11D48";
  const trendColor = trend === "downtrend" ? downColor : trend === "uptrend" ? upColor : "#1E3A8A";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      {/* Gridlines + axis price labels */}
      {gridLines.map((price, i) => (
        <g key={`grid-${i}`}>
          <line x1={0} x2={plotW} y1={y(price)} y2={y(price)} stroke="#EEF0F7" strokeWidth="1" strokeDasharray="2,2" />
          <text x={plotW + 4} y={y(price) + 2.5} fontSize="7" fill="#9AA1C4">{fmt(price)}</text>
        </g>
      ))}

      {/* Support/resistance level lines from swing points */}
      {(labeled ?? []).slice(-4).map((p, i) => (
        <g key={`lvl-${i}`}>
          <line
            x1={0} x2={plotW} y1={y(p.price)} y2={y(p.price)}
            stroke={p.type === "high" ? downColor : upColor}
            strokeWidth="1"
            strokeDasharray="3,2"
            opacity="0.45"
          />
          <text x={2} y={y(p.price) - 2} fontSize="6.5" fill={p.type === "high" ? downColor : upColor} opacity="0.85">
            {fmt(p.price)}
          </text>
        </g>
      ))}

      {/* Candlesticks */}
      {bars.map((b, i) => {
        const bullish = b.close >= b.open;
        const color = bullish ? upColor : downColor;
        const cx = PAD_X + i * barW + barW / 2;
        const bodyTop = y(Math.max(b.open, b.close));
        const bodyBottom = y(Math.min(b.open, b.close));
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(b.high)} y2={y(b.low)} stroke={color} strokeWidth="1" />
            <rect
              x={cx - barW * 0.32} y={Math.min(bodyTop, bodyBottom)}
              width={barW * 0.64} height={Math.max(1, Math.abs(bodyBottom - bodyTop))}
              fill={color}
            />
          </g>
        );
      })}

      {/* Live current price line + label */}
      <line x1={0} x2={plotW} y1={y(currentPrice)} y2={y(currentPrice)} stroke={trendColor} strokeWidth="1" strokeDasharray="1,2" />
      <rect x={plotW + 1} y={y(currentPrice) - 5} width={AXIS_W - 2} height="10" fill={trendColor} rx="2" />
      <text x={plotW + 4} y={y(currentPrice) + 2.5} fontSize="7" fill="#FFFFFF" fontWeight="700">{fmt(currentPrice)}</text>
    </svg>
  );
}

// Builds a rough OHLC sequence between swing points purely for visual
// purposes when no real candles exist yet (demo forex data).
function synthesizeCandles(labeled) {
  if (!labeled?.length) return [];
  const bars = [];
  for (let i = 0; i < labeled.length - 1; i++) {
    const from = labeled[i].price, to = labeled[i + 1].price;
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      const open = from + (to - from) * t0;
      const close = from + (to - from) * t1;
      const wiggle = Math.abs(to - from) * 0.15;
      bars.push({
        open, close,
        high: Math.max(open, close) + wiggle * Math.random(),
        low: Math.min(open, close) - wiggle * Math.random(),
      });
    }
  }
  return bars;
}