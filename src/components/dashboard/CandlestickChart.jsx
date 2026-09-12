import React from "react";

// Renders a candlestick chart with a right-side price axis, current live price badge,
// and horizontal line marking entry / target price levels.
export default function CandlestickChart({
  candles,
  labeled,
  trend,
  decimals = 5,
  levelPrice,
  levelLabel = "Entry",
}) {
  const bars = candles?.length ? candles : synthesizeCandles(labeled);
  if (!bars.length) return <div className="h-20" />;

  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const lastBar = bars[bars.length - 1];
  const livePrice = lastBar ? lastBar.close : null;

  let max = Math.max(...highs);
  let min = Math.min(...lows);

  // Fit both live price and signal level inside the chart bounds
  if (levelPrice != null) {
    max = Math.max(max, levelPrice);
    min = Math.min(min, levelPrice);
  }
  if (livePrice != null) {
    max = Math.max(max, livePrice);
    min = Math.min(min, livePrice);
  }

  const padAmount = (max - min || max * 0.001) * 0.08;
  max += padAmount;
  min -= padAmount;
  const range = max - min || 1;

  const w = 340,
    h = 90,
    padL = 4,
    padR = 64,
    padY = 8;
  const chartW = w - padL - padR;
  const barW = chartW / bars.length;

  const y = (price) => padY + (h - padY * 2) * (1 - (price - min) / range);

  // Format helper to format prices accurately
  const formatP = (val) => {
    if (val == null || isNaN(val)) return "";
    return Number(val).toFixed(val > 500 ? 2 : decimals);
  };

  const priceLabels = [max, min + range * 0.5, min].map((p) => ({
    price: p,
    yPos: y(p),
  }));

  const liveY = livePrice != null ? y(livePrice) : null;
  const levelY = levelPrice != null ? y(levelPrice) : null;
  const isBullishCurrent = lastBar ? lastBar.close >= lastBar.open : true;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 overflow-visible">
      {/* Background Grid Lines */}
      {priceLabels.map((l, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={w - padR}
            y1={l.yPos}
            y2={l.yPos}
            stroke="#E2E8F0"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          <text
            x={w - padR + 6}
            y={l.yPos + 3}
            fontSize="8"
            fill="#94A3B8"
            fontWeight="500"
          >
            {formatP(l.price)}
          </text>
        </g>
      ))}

      {/* Candlesticks */}
      {bars.map((b, i) => {
        const bullish = b.close >= b.open;
        const color = bullish ? "#0E9F6E" : "#E11D48";
        const cx = padL + i * barW + barW / 2;
        const bodyTop = y(Math.max(b.open, b.close));
        const bodyBottom = y(Math.min(b.open, b.close));
        return (
          <g key={i}>
            <line
              x1={cx}
              x2={cx}
              y1={y(b.high)}
              y2={y(b.low)}
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x={cx - barW * 0.32}
              y={Math.min(bodyTop, bodyBottom)}
              width={barW * 0.64}
              height={Math.max(1, Math.abs(bodyBottom - bodyTop))}
              fill={color}
            />
          </g>
        );
      })}

      {/* Live Market Price Horizontal Line & Badge */}
      {liveY != null && (
        <g>
          <line
            x1={padL}
            x2={w - padR}
            y1={liveY}
            y2={liveY}
            stroke={isBullishCurrent ? "#0E9F6E" : "#E11D48"}
            strokeWidth="1"
          />
          <rect
            x={w - padR + 2}
            y={liveY - 7}
            width={padR - 4}
            height={14}
            rx="3"
            fill={isBullishCurrent ? "#0E9F6E" : "#E11D48"}
          />
          <text
            x={w - padR + (padR - 4) / 2 + 2}
            y={liveY + 3.5}
            fontSize="7.5"
            fill="#FFFFFF"
            fontWeight="700"
            textAnchor="middle"
          >
            {formatP(livePrice)}
          </text>
        </g>
      )}

      {/* Signal / Trade Entry Level Line & Badge */}
      {levelY != null && (
        <g>
          <line
            x1={padL}
            x2={w - padR}
            y1={levelY}
            y2={levelY}
            stroke="#7C3AED"
            strokeWidth="1.2"
            strokeDasharray="3,2"
          />
          <rect
            x={w - padR + 2}
            y={levelY - 7}
            width={padR - 4}
            height={14}
            rx="3"
            fill="#7C3AED"
          />
          <text
            x={w - padR + (padR - 4) / 2 + 2}
            y={levelY + 3.5}
            fontSize="7"
            fill="#FFFFFF"
            fontWeight="800"
            textAnchor="middle"
          >
            {`${levelLabel}: ${formatP(levelPrice)}`}
          </text>
        </g>
      )}
    </svg>
  );
}

function synthesizeCandles(labeled) {
  if (!labeled?.length) return [];
  const bars = [];
  for (let i = 0; i < labeled.length - 1; i++) {
    const from = labeled[i].price,
      to = labeled[i + 1].price;
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps,
        t1 = (s + 1) / steps;
      const open = from + (to - from) * t0;
      const close = from + (to - from) * t1;
      const wiggle = Math.abs(to - from) * 0.15;
      bars.push({
        open,
        close,
        high: Math.max(open, close) + wiggle * Math.random(),
        low: Math.min(open, close) - wiggle * Math.random(),
      });
    }
  }
  return bars;
}