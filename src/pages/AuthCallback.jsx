import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type") || "email";

    if (!token_hash) {
      setStatus("error");
      setErrorMessage("This confirmation link is incomplete. Please sign up again to get a new one.");
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(`${error.message}. If you already confirmed, just log in.`);
      } else {
        setStatus("success");
        setTimeout(() => window.location.replace("/#/login"), 1500);
      }
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === "verifying" && (
          <div>
            <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink">Verifying your email...</h2>
            <p className="text-sm text-ink/50 mt-2">Please wait a moment while we confirm your account details.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
            <h1 className="text-2xl font-bold text-ink">Congratulations!</h1>
            <p className="text-base text-ink/70">Your email has been successfully verified, and your Gobulu account is officially active.</p>
            <div className="pt-4">
              <a href="/#/login" className="inline-block bg-royal text-white font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                Log In to Your Account
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 className="text-xl font-bold text-bear mb-2">Verification Failed</h2>
            <p className="text-sm text-ink/50 mb-6">{errorMessage}</p>
            <a href="/#/login" className="inline-block bg-royal text-white font-bold text-sm px-6 py-2.5 rounded-xl">
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}