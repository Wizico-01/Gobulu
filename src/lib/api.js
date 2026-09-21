import { supabase } from "./supabaseClient.js";

export async function callEdgeFunction(name, body, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userToken = sessionData?.session?.access_token;

  // Fallback to Supabase Anon Key if user is not logged in
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const authHeader = userToken ? `Bearer ${userToken}` : `Bearer ${anonKey}`;

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: {
      Authorization: authHeader,
    },
    signal: options.signal,
  });

  if (error) {
    // Check if Supabase returned a 400 (Bad Request / Limit Exceeded) or 429 (Rate Limit)
    const status = error.status || error.context?.status;
    if (status === 400 || status === 429) {
      console.warn(`[${name}] API limit or Bad Request (${status}). Gracefully stopping execution.`);
      return { values: null, error: "API limit or Bad Request" };
    }

    throw error;
  }

  return data;
}

export async function fetchCandles({ symbol, interval, outputsize = 50, signal }) {
  return callEdgeFunction("market-data", { symbol, interval, outputsize }, { signal });
}

export async function fetchDerivCandles({ derivSymbol, granularitySeconds, count = 60, signal }) {
  return callEdgeFunction("deriv-data", { derivSymbol, granularitySeconds, count }, { signal });
}