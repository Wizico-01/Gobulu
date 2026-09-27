import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { FOREX_SYMBOLS } from "../engine/symbols.js";

export default function AdminSignals() {
  const [form, setForm] = useState({
    symbol: "EURUSD",
    direction: "buy",
    entry_price: "",
    stop_loss: "",
    take_profit: "",
    reasoning: "",
    strength: "strong",
  });
  const [status, setStatus] = useState("");

  const submit = async () => {
    setStatus("Posting...");
    const { error } = await supabase.from("signals").insert({
      symbol: form.symbol,
      direction: form.direction,
      entry_price: form.entry_price ? +form.entry_price : null,
      stop_loss: form.stop_loss ? +form.stop_loss : null,
      take_profit: form.take_profit ? +form.take_profit : null,
      reasoning: form.reasoning || null,
      strength: form.strength,
    });
    setStatus(error ? `Error: ${error.message}` : "Signal posted ✓");
    if (!error) {
      setForm({ symbol: form.symbol, direction: "buy", entry_price: "", stop_loss: "", take_profit: "", reasoning: "", strength: "strong" });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-5 space-y-3">
      <h2 className="text-lg font-bold">Post signal</h2>

      <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="w-full border rounded-lg p-2">
        {FOREX_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="w-full border rounded-lg p-2">
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
        <option value="no_trade">No trade</option>
      </select>

      <input placeholder="Entry price" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} className="w-full border rounded-lg p-2" />
      <input placeholder="Stop loss" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} className="w-full border rounded-lg p-2" />
      <input placeholder="Take profit" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} className="w-full border rounded-lg p-2" />

      <select value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className="w-full border rounded-lg p-2">
        <option value="strong">Strong</option>
        <option value="moderate">Moderate</option>
        <option value="weak">Weak</option>
      </select>

      <textarea
        placeholder="Reasoning (e.g. Daily uptrend, pulled back to 1.3250 support, bullish engulfing confirmed)"
        value={form.reasoning}
        onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
        className="w-full border rounded-lg p-2 h-24"
      />

      <button onClick={submit} className="w-full bg-royal text-white font-bold py-3 rounded-lg">Post signal</button>
      {status && <p className="text-sm text-center">{status}</p>}
    </div>
  );
}