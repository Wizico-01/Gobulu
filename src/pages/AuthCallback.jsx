import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Supabase automatically parses the token hash in the URL on load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else if (session) {
        setStatus("success");
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        // Fallback if no session was created
        navigate("/login");
      }
    });
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      {status === "verifying" && (
        <div>
          <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-ink">Verifying your email...</h2>
          <p className="text-sm text-ink/50 mt-2">
            Please wait while we confirm your account details.
          </p>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-ink">Email Confirmed!</h2>
          <p className="text-sm text-ink/50 mt-2">
            Your account is ready. Redirecting to your dashboard...
          </p>
        </div>
      )}

      {status === "error" && (
        <div>
          <h2 className="text-xl font-bold text-bear mb-2">Verification Failed</h2>
          <p className="text-sm text-ink/50 mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-royal text-white font-bold text-sm px-6 py-2.5 rounded-xl"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}