import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LayoutGrid, Bell, Shield, GitBranch } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { icon: GitBranch, title: "Pure Price Action", body: "Built around market structure, order blocks, SMC, key levels and indicators." },
  { icon: Bell, title: "High-Confluence Signals", body: "Only alerts you when at least 5 confluence agree. If it’s messy, Gobulu stays silent." },
  { icon: Bell, title: "Automated Risk Rules", body: "Gobulu helps you manage your risk and protects your capital with automated lot sizing and pre-calculated risk-to-reward ratios." },
  { icon: Shield, title: "Risk built in", body: "Set your account size and risk appetite once; every setup comes with a ready-to-use lot size." },
];

export default function Home() {
  const { user, isSubscribed } = useAuth();
  return (
    <div>
      {/* Hero Section — Changed bg-royal-deep to bg-ink */}
      <section className="bg-ink">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wide text-white/60 mb-4">
              Multi-timeframe trade analysis
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
              FOREX TRADING ENGINE.
            </h1>
            <p className="text-white/70 mt-5 text-base md:text-lg max-w-md">
              Gobulu runs your top-down analysis across every timeframe automatically,
              and gives you signal when there is enough confluence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isSubscribed ? "/dashboard" : user ? "/pricing" : "/signup"} className="inline-flex items-center gap-1.5 bg-white text-ink font-bold text-sm px-5 py-3 rounded-xl hover:bg-mist transition-colors">
                {isSubscribed ? "Analyze Now" : "Start Analysing"} <ArrowRight size={16} />
              </Link>
              <Link to="/how-it-works" className="inline-flex items-center gap-1.5 text-white font-semibold text-sm px-5 py-3 rounded-xl border border-white/25 hover:bg-white/10 transition-colors">
                See how it works
              </Link>
            </div>
          </div>

          {/* Hero video */}
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <video
              src={`${import.meta.env.BASE_URL}hero.mp4`}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section — Preserves clean white/light styling */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink text-center max-w-xl mx-auto">
          Everything your forex analysis needs, running in the engine.
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line p-6">
              <div className="w-10 h-10 rounded-lg bg-mist flex items-center justify-center mb-4">
                <f.icon size={18} className="text-royal" />
              </div>
              <h3 className="font-bold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-mist border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-ink">Stop spending hour on your screen</h2>
          <p className="text-ink/60 mt-2 max-w-md mx-auto">Let Gobulu analyse the market for you.</p>
          <Link to={isSubscribed ? "/dashboard" : user ? "/pricing" : "/signup"} className="inline-flex items-center gap-1.5 bg-royal text-white font-bold text-sm px-6 py-3 rounded-xl mt-6 hover:bg-royal-dark transition-colors">
            {isSubscribed ? "Analyze Now" : "Start Analysing"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}