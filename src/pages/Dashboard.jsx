import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SignalCard from "../components/dashboard/SignalCard.jsx";
import TradingViewChart from "../components/dashboard/TradingViewChart.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { FOREX_SYMBOLS } from "../engine/symbols.js";
import { GitBranch, Target, Activity } from "lucide-react";

const PAGE_LOAD_MS = 7000;
const ANALYZE_MS = 3000;

const LOAD_SLIDES = [
  { icon: GitBranch, title: "Setting up your cascade", desc: "Preparing today's markets and signals." },
  { icon: Activity, title: "Connecting to live charts", desc: "Loading TradingView data." },
  { icon: Target, title: "Almost ready", desc: "Getting your trading dashboard in place." },
];

const ANALYZE_SLIDES = [
  { icon: GitBranch, title: "Checking today's signals", desc: "Looking for a posted call on this pair." },
  { icon: Activity, title: "Pulling live chart", desc: "Loading the current TradingView data." },
  { icon: Target, title: "Preparing your trade plan", desc: "Entry, stop loss, and take profit." },
];

function SpinnerSplash({ slides, index, subtitle }) {
  const slide = slides[index % slides.length];
  const Icon = slide.icon;
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-royal-deep px-6">
      <div className="text-center max-w-xs">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" />
          <div key={index} className="absolute inset-0 flex items-center justify-center">
            <Icon size={32} className="text-white" />
          </div>
        </div>
        {subtitle && <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">{subtitle}</p>}
        <p className="text-white font-bold text-base">{slide.title}</p>
        <p className="text-white/60 text-sm mt-2">{slide.desc}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadIndex, setLoadIndex] = useState(0);

  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD");
  const [symbol, setSymbol] = useState(null);
  const [signals, setSignals] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeIndex, setAnalyzeIndex] = useState(0);

  // 7-second splash on first load of this page
  useEffect(() => {
    const rotate = setInterval(() => setLoadIndex((i) => i + 1), 1600);
    const done = setTimeout(() => {
      clearInterval(rotate);
      setPageLoading(false);
    }, PAGE_LOAD_MS);
    return () => { clearInterval(rotate); clearTimeout(done); };
  }, []);

  const runAnalysis = async (targetSymbol) => {
    setIsAnalyzing(true);
    setAnalyzeIndex(0);
    const rotate = setInterval(() => setAnalyzeIndex((i) => i + 1), 900);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("signals")
      .select("*")
      .eq("symbol", targetSymbol)
      .gte("posted_at", todayStart.toISOString())
      .order("posted_at", { ascending: false });

    setTimeout(() => {
      clearInterval(rotate);
      setSignals(data ?? []);
      setSymbol(targetSymbol);
      setIsAnalyzing(false);
    }, ANALYZE_MS);
  };

  if (pageLoading) {
    return <SpinnerSplash slides={LOAD_SLIDES} index={loadIndex} subtitle="Welcome to Gobulu" />;
  }

  if (isAnalyzing) {
    return <SpinnerSplash slides={ANALYZE_SLIDES} index={analyzeIndex} subtitle={`Analysing ${selectedSymbol}`} />;
  }

  return (
    <div className="bg-mist min-h-[80vh] pb-10">
      <div className="bg-royal">
        <div className="max-w-3xl mx-auto px-5 pt-8 pb-6">
          <span className="text-white font-display font-bold text-lg block mb-4">Daily signals</span>

          <label className="text-white/50 text-[10px] font-bold uppercase tracking-wide mb-1.5 block">Market</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full mb-3 rounded-xl bg-white/15 text-white text-sm font-bold px-3.5 py-2.5 outline-none border border-white/20"
          >
            {FOREX_SYMBOLS.map((s) => <option key={s} value={s} className="text-ink">{s}</option>)}
          </select>

          <button
            onClick={() => runAnalysis(selectedSymbol)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-royal font-bold text-sm py-3 transition-transform active:scale-[0.99]"
          >
            <Search size={16} /> Analyze {selectedSymbol}
          </button>
        </div>
      </div>

      {!symbol ? (
        <div className="max-w-3xl mx-auto px-5 mt-8 text-center">
          <p className="text-sm text-ink/50">Pick a market above and tap Analyze to see today's signals.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-5 mt-5 space-y-5">
          <TradingViewChart symbol={symbol} />

          {signals.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-4 text-sm text-ink/40 text-center">
              No signal posted for {symbol} today yet.
            </div>
          ) : (
            signals.map((s) => <SignalCard key={s.id} signal={s} symbol={symbol} />)
          )}
        </div>
      )}
    </div>
  );
}