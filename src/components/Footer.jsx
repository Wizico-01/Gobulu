import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Footer() {
  const { user, isSubscribed } = useAuth();

  return (
    <footer className="border-t border-line bg-mist">
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <Logo size="sm" />
        <div className="flex gap-6 text-sm font-medium text-ink/60">
          <Link to="/how-it-works" className="hover:text-ink transition-colors">How it works</Link>
          {!isSubscribed && <Link to="/pricing" className="hover:text-ink transition-colors">Pricing</Link>}
          {!user && <Link to="/login" className="hover:text-ink transition-colors">Log in</Link>}
        </div>
        <p className="text-xs text-ink/40">© {new Date().getFullYear()} Gobulu. Not investment advice.</p>
      </div>
    </footer>
  );
}