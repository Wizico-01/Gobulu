import React from "react";
import CandlestickChart from "./CandlestickChart.jsx";
import TrendBadge from "./TrendBadge.jsx";

export default function TierCard({ tier = {}, decimals = 5, levelPrice, levelLabel }) {
  // Safe lookup using optional chaining
  const sourceBadge = tier?.source
    ? {
        photo: { label: "From photo", bg: "#FFF6DD", fg: "#D69E00" },
        missing: { label: "No data yet", bg: "#F1F2F8", fg: "#7B84B5" },
      }[tier.source]
    : null;

  // Extract latest price safely
  const latestPrice =
    tier?.candles?.length > 0
      ? tier.candles[tier.candles.length - 1]?.close
      : tier?.labeled?.length > 0
      ? tier.labeled[tier.labeled.length - 1]?.price
      : null;

  const formatP = (val) => {
    if (val == null || isNaN(val)) return null;
    return Number(val).toFixed(val > 500 ? 2 : decimals || 5);
  };

  return (
    <div className="rounded-xl border border-line bg-white p-3.5">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink/40">
            {tier?.role || "TIMEFRAME"}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ink">{tier?.name || "—"}</p>
            {latestPrice && (
              <span className="text-xs font-semibold text-slate-500">
                ({formatP(latestPrice)})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {sourceBadge && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: sourceBadge.bg, color: sourceBadge.fg }}
            >
              {sourceBadge.label}
            </span>
          )}
          <TrendBadge trend={tier?.trend} />
        </div>
      </div>

      {/* Chart Section */}
      {tier?.labeled?.length > 0 || tier?.candles?.length > 0 ? (
        <CandlestickChart
          candles={tier.candles}
          labeled={tier.labeled}
          trend={tier.trend}
          decimals={decimals}
          levelPrice={levelPrice}
          levelLabel={levelLabel}
        />
      ) : (
        <div className="h-9 flex items-center">
          <p className="text-[11px] text-ink/30">
            {tier?.source === "photo"
              ? tier?.visionNotes?.summary ?? "Read from uploaded chart"
              : "Waiting on data"}
          </p>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex flex-wrap gap-1">
          {tier?.labeled?.slice(-3).map((p, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mist text-royal-dark"
            >
              {p.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {levelPrice && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {levelLabel || "ENTRY"}: {formatP(levelPrice)}
            </span>
          )}

          {tier?.bos?.occurred && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: tier.bos.retestConfirmed ? "#E6F7EF" : "#FFF6DD",
                color: tier.bos.retestConfirmed ? "#0E9F6E" : "#D69E00",
              }}
            >
              BOS {tier.bos.retestConfirmed ? "✓ retested" : "· awaiting retest"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}