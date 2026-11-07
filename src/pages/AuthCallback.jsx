import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let finished = false;

    const finish = (s, msg = "") => {
      if (finished) return;
      finished = true;
      setStatus(s);
      setErrorMessage(msg);
      if (s === "success") {
        setTimeout(() => window.location.replace("/#/login"), 1500);
      }
    };

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);

    // Supabase puts expired/used-link errors in the URL
    const urlError = hashParams.get("error_description") || queryParams.get("error_description");
    if (urlError) {
      finish("error", `${urlError.replace(/\+/g, " ")}. If you already tapped this link once, your account may already be confirmed. Try logging in.`);
      return;
    }

    // Listen first so the sign-in event is never missed
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) finish("success");
    });

    (async () => {
      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return error ? finish("error", error.message) : finish("success");
      }
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) return finish("error", error.message);
      if (session) finish("success");
    })();

    // Never spin forever
    const timer = setTimeout(
      () => finish("error", "We couldn't confirm this link. It may have expired or already been used. Try logging in, or sign up again."),
      10000
    );

    return () => {
      clearTimeout(timer);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === "verifying" && (
          <div>
            <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink">Verifying your email...</h2>
            <p className="text-sm text-ink/50 mt-2">
              Please wait a moment while we confirm your account details.
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
              <a
                href="/#/login"
                className="inline-block bg-royal text-white font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Log In to Your Account
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 className="text-xl font-bold text-bear mb-2">Verification Failed</h2>
            <p className="text-sm text-ink/50 mb-6">{errorMessage}</p>
            <a
              href="/#/login"
              className="inline-block bg-royal text-white font-bold text-sm px-6 py-2.5 rounded-xl"
            >
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}