import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startFlutterwaveCheckout } from "../lib/flutterwave.js";
import { callEdgeFunction } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const PAYMENT_PLAN_ID = "167686"; // from Step 1

export default function Pricing() {
  const { user, profile, isSubscribed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSubscribed) navigate("/dashboard");
  }, [isSubscribed, navigate]);
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  async function handleSubscribe() {
    if (!user) return navigate("/signup");
    setVerifyError("");
    setLoading(true);
    try {
      await startFlutterwaveCheckout({
        email: user.email,
        name: user.email,
        paymentPlanId: PAYMENT_PLAN_ID,
        onSuccess: async (response) => {
          try {
            await callEdgeFunction("flutterwave-verify", { transactionId: response.transaction_id });
            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            setVerifyError("Payment went through, but we couldn't verify it automatically. Contact support with your transaction ID: " + response.transaction_id);
            setLoading(false);
          }
        },
        onClose: () => setLoading(false),
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <span className="text-xs font-bold uppercase tracking-wide text-royal">Pricing</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-2">Simple monthly billing.</h1>
      <p className="text-ink/60 mt-3">Billed monthly in USD. {profile?.subscription_status === "active" ? "You're currently subscribed." : ""}</p>

      {verifyError && (
        <div className="mt-6 rounded-xl border border-bear/30 bg-bear/5 px-4 py-3 text-left">
          <p className="text-sm text-bear font-medium">{verifyError}</p>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-royal p-8 shadow-xl shadow-royal/10 bg-white">
        <h3 className="font-display text-lg font-bold text-ink">Full Access</h3>
        <p className="text-sm text-ink/60 mt-1">All trading styles, all symbols, full analysis.</p>
        <div className="mt-5 flex items-baseline justify-center gap-1">
          <span className="font-display text-4xl font-bold text-ink">$1</span>
          <span className="text-sm text-ink/50">/ month</span>
        </div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-7 w-full py-3 rounded-xl text-sm font-bold text-white bg-royal"
        >
          {loading ? "Redirecting…" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}