import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache to stay under Twelve Data's 8 req/min free limit
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY")?.trim();
    if (!TWELVE_DATA_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* default body */ }

    const { symbol = "EUR/USD", interval = "1day", outputsize = 50 } = body;

    // Normalize symbol format
    const cleanSymbol = symbol.replace("/", "").length === 6 && !symbol.includes("/")
      ? `${symbol.slice(0, 3)}/${symbol.slice(3)}`
      : symbol;

    // Normalize interval format
    const strInterval = String(interval).toLowerCase().trim();
    const intervalMap: Record<string, string> = {
      "daily": "1day",
      "1d": "1day",
      "4h": "4h",
      "1h": "1h",
      "15m": "15min",
      "15min": "15min"
    };
    const apiInterval = intervalMap[strInterval] || strInterval;

    const cacheKey = `${cleanSymbol}-${apiInterval}`;
    const cachedItem = cache.get(cacheKey);

    // Serve from cache if fresh
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL_MS)) {
      console.log(`[Cache Hit] Serving ${cacheKey} from memory`);
      return new Response(JSON.stringify(cachedItem.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${apiInterval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
    
    const res = await fetch(url);
    const json = await res.json();

    if (json.status === "error" || json.code >= 400) {
      console.error(`TwelveData Error for ${cacheKey}:`, json.message);
      
      // If rate limited but we have stale cache, return it as fallback
      if (cachedItem) {
        console.warn(`Rate limited! Returning stale cached data for ${cacheKey}`);
        return new Response(JSON.stringify(cachedItem.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: json.message || "Twelve Data rate limit or parameter error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawValues = json.values || [];
    const formattedCandles = rawValues.map((c: any) => ({
      datetime: c.datetime,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseInt(c.volume || "0", 10),
    })).reverse();

    const responseData = {
      ...json,
      values: formattedCandles,
      candles: formattedCandles,
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: Date.now(), data: responseData });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});