import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function Contact() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const { error } = await supabase.from("support_messages").insert({
      user_id: user.id,
      email: user.email,
      subject: subject.trim(),
      message: message.trim(),
    });
    if (error) {
      setStatus("idle");
      return setError("Couldn't send your message. Please try again.");
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Message sent</h1>
        <p className="text-sm text-ink/60 mt-2">Thanks for reaching out. We'll reply to {user.email} as soon as we can.</p>
      </div>
    );
  }

  const inputClass = "w-full mt-1.5 rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none";
  const labelClass = "text-xs font-bold uppercase tracking-wide text-ink/40";

  return (
    <div className="max-w-sm mx-auto px-5 py-20">
      <h1 className="font-display text-2xl font-bold text-ink">Contact support</h1>
      <p className="text-sm text-ink/50 mt-1.5 mb-8">Having a problem with payment, login or signals? Tell us and we'll help.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Subject</label>
          <input required maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Message</label>
          <textarea required maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} h-32`} />
        </div>
        {error && <p className="text-xs text-bear font-semibold">{error}</p>}
        <button disabled={status === "sending"} className="w-full bg-royal text-white font-bold text-sm py-3 rounded-xl">
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}