import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await supabase.from("support_messages").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-3">
      <h2 className="text-lg font-bold">Support messages</h2>
      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && messages.length === 0 && <p className="text-sm text-ink/40">No messages yet.</p>}
      {messages.map((m) => (
        <div key={m.id} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-ink">{m.subject}</p>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.status === "open" ? "bg-[#FFF6DD] text-[#D69E00]" : "bg-[#E6F7EF] text-[#0E9F6E]"}`}>
              {m.status}
            </span>
          </div>
          <p className="text-xs text-ink/50 mb-2">{m.email} · {new Date(m.created_at).toLocaleString()}</p>
          <p className="text-sm text-ink/80 whitespace-pre-wrap">{m.message}</p>
          <div className="flex gap-3 mt-3">
            <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="text-xs font-semibold text-royal">Reply by email</a>
            {m.status === "open"
              ? <button onClick={() => setStatus(m.id, "resolved")} className="text-xs font-semibold text-ink/60">Mark resolved</button>
              : <button onClick={() => setStatus(m.id, "open")} className="text-xs font-semibold text-ink/60">Reopen</button>}
          </div>
        </div>
      ))}
    </div>
  );
}