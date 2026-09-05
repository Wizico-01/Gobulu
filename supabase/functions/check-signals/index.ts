import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:support@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const TF_MAP: Record<string, string> = {
  Monthly: "1month", Weekly: "1week", Daily: "1day",
  "4H": "4h", "1H": "1h", "30M": "30min", "15M": "15min", "1M/5M": "5min",
};
const CASCADES: Record<string, string[]> = {
  swing: ["Monthly", "Weekly", "Daily", "4H"],
  day: ["Daily", "4H", "1H", "15M"],
  scalp: ["1H", "30M", "15M", "1M/5M"],
};

async function fetchCandles(symbol: string, interval: string) {
  const formatted = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
  const url = `https://api.twelvedata.com/time_series?symbol=${formatted}&interval=${interval}&outputsize=60&apikey=${TWELVE_DATA_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.values) return null;
  return json.values.map((v: any) => ({ open: +v.open, high: +v.high, low: +v.low, close: +v.close })).reverse();
}

function detectSwingPoints(candles: any[], w = 2) {
  const points: any[] = [];
  for (let i = w; i < candles.length - w; i++) {
    const win = candles.slice(i - w, i + w + 1);
    const c = candles[i];
    if (win.every((x) => x.high <= c.high)) points.push({ type: "high", price: c.high, index: i });
    else if (win.every((x) => x.low >= c.low)) points.push({ type: "low", price: c.low, index: i });
  }
  return points;
}

function labelAndTrend(points: any[]) {
  let lastHigh: number | null = null, lastLow: number | null = null;
  const labeled = points.map((p) => {
    let label;
    if (p.type === "high") { label = lastHigh === null ? "H" : p.price > lastHigh ? "HH" : "LH"; lastHigh = p.price; }
    else { label = lastLow === null ? "L" : p.price > lastLow ? "HL" : "LL"; lastLow = p.price; }
    return { ...p, label };
  });
  const highs = labeled.filter((p) => p.type === "high").slice(-2).map((p) => p.label);
  const lows = labeled.filter((p) => p.type === "low").slice(-2).map((p) => p.label);
  let trend = "range";
  if (highs.includes("HH") && lows.every((l) => l === "HL")) trend = "uptrend";
  else if (highs.includes("LH") && lows.every((l) => l === "LL")) trend = "downtrend";
  return { labeled, trend };
}

function countRetests(candles: any[], price: number, tol: number) {
  return candles.filter((c) => c.low <= price + tol && c.high >= price - tol).length;
}

function detectPattern(candles: any[]) {
  const n = candles.length;
  if (n < 2) return null;
  const last = candles[n - 1], prev = candles[n - 2];
  const bullish = last.close > last.open, prevBull = prev.close > prev.open;
  const body = Math.abs(last.close - last.open), prevBody = Math.abs(prev.close - prev.open);
  if (!prevBull && bullish && last.open <= prev.close && last.close >= prev.open && body > prevBody * 0.9) return { direction: "bullish" };
  if (prevBull && !bullish && last.open >= prev.close && last.close <= prev.open && body > prevBody * 0.9) return { direction: "bearish" };
  const range = last.high - last.low || 1e-9;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  if (lowerWick > body * 2 && upperWick < body * 0.5) return { direction: "bullish" };
  if (upperWick > body * 2 && lowerWick < body * 0.5) return { direction: "bearish" };
  return null;
}

function psychLevelsNear(symbol: string, price: number) {
  const grid = symbol === "XAUUSD" ? 10 : symbol === "XAGUSD" ? 0.5 : symbol.includes("JPY") ? 0.5 : 0.005;
  const base = Math.floor(price / grid) * grid;
  const levels = [];
  for (let i = -2; i <= 2; i++) levels.push(base + i * grid);
  return levels;
}

// Checks the ESSENTIAL gate that matches the main app's finalAlarmActive:
// clear trend + a strong (2+ retest) level nearby + a confirmed
// trend-following reversal candle at that level.
async function checkSignal(symbol: string, style: string) {
  const tiers = CASCADES[style];
  const entryTF = tiers[tiers.length - 1];
  const candles = await fetchCandles(symbol, TF_MAP[entryTF]);
  if (!candles || candles.length < 12) return null;

  const points = detectSwingPoints(candles);
  const { labeled, trend } = labelAndTrend(points);
  if (trend === "range") return null;

  const direction = trend === "uptrend" ? "buy" : "sell";
  const livePrice = candles[candles.length - 1].close;
  const tolerance = livePrice * 0.0012;

  const strongLevels = [
    ...labeled.map((p: any) => p.price),
    ...psychLevelsNear(symbol, livePrice),
  ].filter((lvl) => countRetests(candles, lvl, tolerance) >= 2);

  const nearLevel = strongLevels.find((lvl) => Math.abs(lvl - livePrice) < tolerance * 0.6);
  if (nearLevel == null) return null;

  const pattern = detectPattern(candles.slice(-3));
  const confirmed = pattern && ((direction === "buy" && pattern.direction === "bullish") || (direction === "sell" && pattern.direction === "bearish"));
  if (!confirmed) return null;

  return { direction, entryPrice: nearLevel, entryTF };
}

Deno.serve(async (_req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: watches } = await admin.from("watchlist").select("*");
  if (!watches) return new Response("no watches");

  for (const w of watches) {
    try {
      const signal = await checkSignal(w.symbol, w.trading_style);
      if (!signal) continue;

      const signature = `${w.symbol}-${signal.entryTF}-${signal.direction}-${signal.entryPrice}`;
      if (signature === w.last_notified_signature) continue; // already notified this exact setup

      const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", w.user_id);
      if (!subs?.length) continue;

      const payload = JSON.stringify({
        title: `${w.symbol}: Strong signal`,
        body: `${signal.direction.toUpperCase()} at ${signal.entryPrice} on ${signal.entryTF}, confirmed and ready to enter.`,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
          );
        } catch (err) {
          console.error("Push send failed for", sub.endpoint, err.message);
        }
      }

      await admin.from("watchlist").update({ last_notified_signature: signature }).eq("id", w.id);
    } catch (err) {
      console.error(`Signal check failed for ${w.symbol}:`, err.message);
    }
  }

  return new Response("done");
});



