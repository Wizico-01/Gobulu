import React, { useEffect, useRef } from "react";

export default function TradingViewChart({ symbol }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          width: "100%",
          height: 420,
          symbol: `FX:${symbol}`,
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0B1637",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          withdateranges: true,
          container_id: "tv_chart_container",
        });
      }
    };
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="rounded-xl overflow-hidden border border-line">
      <div id="tv_chart_container" ref={containerRef} />
    </div>
  );
}