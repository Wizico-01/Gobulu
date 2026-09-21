import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY")?.trim();
    if (!TWELVE_DATA_API_KEY) {
      return new Response(
        JSON.stringify({ error: "TWELVE_DATA_API_KEY is not configured on Supabase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { symbol = "EUR/USD", interval = "1day", outputsize = 50 } = await req.json();

    // Ensure clean ticker format (e.g., EURUSD -> EUR/USD)
    let cleanSymbol = String(symbol).trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (cleanSymbol.length === 6 && !cleanSymbol.includes("/")) {
      cleanSymbol = `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`;
    }

    const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
    
    const res = await fetch(url);
    const json = await res.json();

    if (json.status === "error") {
      return new Response(JSON.stringify({ error: json.message }), {
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

    return new Response(
      JSON.stringify({
        ...json,
        values: formattedCandles,
        candles: formattedCandles,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});