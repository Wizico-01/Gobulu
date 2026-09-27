import React, { useState } from "react";

const SECURITY_QUESTION = "What is your fathers name?"; // change to your own question
const SECURITY_ANSWER = "Godswill"; // change to your real answer, lowercase

export default function SecurityGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === SECURITY_ANSWER.toLowerCase()) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect answer. Try again.");
    }
  };

  if (unlocked) return children;

  return (
    <div className="max-w-sm mx-auto p-6 mt-16">
      <h2 className="text-lg font-bold mb-1">Security check</h2>
      <p className="text-sm text-ink/50 mb-4">Answer this to continue to the admin page.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm font-semibold">{SECURITY_QUESTION}</p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full border rounded-lg p-2"
          autoFocus
        />
        {error && <p className="text-xs text-bear">{error}</p>}
        <button type="submit" className="w-full bg-royal text-white font-bold py-3 rounded-lg">
          Continue
        </button>
      </form>
    </div>
  );
}