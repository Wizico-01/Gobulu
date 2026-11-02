import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Catch auth state change from verification link token
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || session) {
          setStatus("success");
        }
      }
    );

    // Fallback session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else if (session) {
        setStatus("success");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === "verifying" && (
          <div>
            <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink">Verifying your email...</h2>
            <p className="text-sm text-ink/50 mt-2">
              Please wait a moment while we confirm your email address.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-ink">Congratulations!</h1>
            <p className="text-base text-ink/70">
              Your email has been successfully verified, and your Gobulu account is officially active.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-block bg-royal text-white font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Log In to Your Account
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 className="text-xl font-bold text-bear mb-2">Verification Failed</h2>
            <p className="text-sm text-ink/50 mb-6">{errorMessage}</p>
            <Link
              to="/login"
              className="inline-block bg-royal text-white font-bold text-sm px-6 py-2.5 rounded-xl"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}