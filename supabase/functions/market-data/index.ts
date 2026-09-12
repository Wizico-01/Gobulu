import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!TWELVE_DATA_API_KEY) {
      console.error("Missing TWELVE_DATA_API_KEY secret!");
      return new Response(JSON.stringify({ error: "Missing TWELVE_DATA_API_KEY in Supabase secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error } = await supabaseAuth.auth.getUser();
    if (error || !userData?.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Check user subscription status
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("subscription_status")
      .eq("id", userData.user.id)
      .single();

    // TEMPORARY: Allow 'active', 'trialing', or bypass if profile isn't populated yet
    const status = profile?.subscription_status;
    if (status && status !== "active" && status !== "trialing") {
      console.warn(`User ${userData.user.id} subscription blocked. Status: ${status}`);
      return new Response(JSON.stringify({ error: "Subscription required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { symbol, interval, outputsize = 50 } = await req.json();
    if (!symbol || !interval) {
      return new Response("Missing symbol or interval", { status: 400, headers: corsHeaders });
    }

    // Format pairs (e.g., EURUSD -> EUR/USD, XAUUSD -> XAU/USD)
    const formattedSymbol = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;

    // Normalize interval names for Twelve Data API
    const intervalMap: Record<string, string> = {
      "Daily": "1day",
      "4H": "4h",
      "1H": "1h",
      "15M": "15min",
    };
    const apiInterval = intervalMap[interval] || interval;

    const url = `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=${apiInterval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status === "error") {
      console.error("Twelve Data Error:", json.message);
      return new Response(JSON.stringify({ error: json.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Edge Function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});