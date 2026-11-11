import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="text-2xl font-extrabold font-nums text-ink mt-1">{value ?? "—"}</p>
    </div>
  );
}

export default function AdminUsers() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [statsRes, listRes] = await Promise.all([
        supabase.rpc("admin_user_stats"),
        supabase.rpc("admin_user_list"),
      ]);
      if (statsRes.error || listRes.error) {
        setError((statsRes.error || listRes.error).message);
      } else {
        setStats(statsRes.data);
        setUsers(listRes.data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Users</h2>
        <Link to="/admin" className="text-sm font-semibold text-royal">← Back to admin</Link>
      </div>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {error && <p className="text-sm text-bear font-semibold">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Registered" value={stats.total_users} />
          <StatCard label="Confirmed email" value={stats.confirmed_users} />
          <StatCard label="Subscribed" value={stats.subscribed} />
          <StatCard label="New (7 days)" value={stats.new_last_7_days} />
        </div>
      )}

      {users.length > 0 && (
        <div className="rounded-xl border border-line bg-white divide-y divide-line">
          {users.map((u) => (
            <div key={u.user_email} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{u.user_name || "No name"}</p>
                <p className="text-xs text-ink/50 truncate">{u.user_email}</p>
                <p className="text-[10px] text-ink/30">Joined {new Date(u.joined_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_subscribed ? "bg-[#E6F7EF] text-[#0E9F6E]" : "bg-mist text-ink/50"}`}>
                  {u.is_subscribed ? "Subscribed" : "Free"}
                </span>
                {!u.is_confirmed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF6DD] text-[#D69E00]">Unconfirmed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}