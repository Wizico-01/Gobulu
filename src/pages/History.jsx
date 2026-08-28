import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return setLoading(false);
    const { data } = await supabase
      .from("analysis_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Your analysis history</h1>
        <Link to="/analyze" className="text-sm font-bold px-4 py-2 rounded-lg bg-royal text-white">Analyze Now</Link>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-10 text-center">
          <p className="text-sm text-ink/50">You haven't analyzed any pairs yet.</p>
          <Link to="/analyze" className="inline-block mt-4 text-sm font-bold text-royal">Run your first analysis →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-ink">{h.symbol}</span>
                <span className="text-xs text-ink/40">{new Date(h.created_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-mist text-ink/70 font-medium capitalize">{h.trading_style} · {h.entry_timeframe}</span>
                <span className="px-2.5 py-1 rounded-full bg-mist text-ink/70 font-medium capitalize">{h.trend ?? "—"}</span>
                {h.pattern_name && <span className="px-2.5 py-1 rounded-full bg-mist text-ink/70 font-medium">{h.pattern_name}</span>}
                {h.direction && (
                  <span className={`px-2.5 py-1 rounded-full font-bold ${h.direction === "buy" ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
                    {h.direction.toUpperCase()}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-royal/10 text-royal font-bold">{h.score}/9 · {h.strength}</span>
                {h.entry_price && <span className="px-2.5 py-1 rounded-full bg-mist text-ink/70 font-medium">Entry {h.entry_price}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}