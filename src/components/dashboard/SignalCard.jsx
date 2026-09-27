import React from "react";
import { fmtPrice } from "../../engine/symbols.js";

const STATUS_STYLES = {
  active: { bg: "#EEF0F7", fg: "#1E3A8A", label: "Active" },
  hit_tp: { bg: "#E6F7EF", fg: "#0E9F6E", label: "Hit TP ✓" },
  hit_sl: { bg: "#FDECEF", fg: "#E11D48", label: "Hit SL" },
  invalidated: { bg: "#F1F2F8", fg: "#7B84B5", label: "Invalidated" },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SignalCard({ signal, symbol }) {
  const statusStyle = STATUS_STYLES[signal.status];
  const postedTime = new Date(signal.posted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (signal.direction === "no_trade") {
    return (
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40">No trade</p>
          <p className="text-[10px] text-ink/30">{postedTime} · {timeAgo(signal.posted_at)}</p>
        </div>
        <p className="text-sm text-ink/50">No signal for {symbol} at this time.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-ink/40 font-semibold">Posted {postedTime} · <span className="text-ink/60">{timeAgo(signal.posted_at)}</span></p>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.fg }}>
          {statusStyle.label}
        </span>
      </div>

      <p className="text-sm font-bold text-ink mb-2">
        {signal.direction === "buy" ? "Buy" : "Sell"} {symbol}
        {signal.strength && <span className="text-ink/40 font-medium"> · {signal.strength} setup</span>}
      </p>

      <div className="space-y-1.5 text-xs mb-3">
        <div className="flex justify-between"><span className="text-ink/50">Entry</span><span className="font-bold font-nums">{fmtPrice(symbol, signal.entry_price)}</span></div>
        <div className="flex justify-between"><span className="text-ink/50">Stop loss</span><span className="font-bold font-nums text-bear">{fmtPrice(symbol, signal.stop_loss)}</span></div>
        <div className="flex justify-between"><span className="text-ink/50">Take profit</span><span className="font-bold font-nums text-bull">{fmtPrice(symbol, signal.take_profit)}</span></div>
      </div>

      {signal.reasoning && (
        <div className="rounded-lg bg-mist px-3 py-2 text-xs text-ink/70">{signal.reasoning}</div>
      )}
    </div>
  );
}