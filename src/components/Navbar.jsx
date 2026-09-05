import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const baseLinks = [
  { to: "/how-it-works", label: "How it works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isSubscribed, signOut } = useAuth();
  const navigate = useNavigate();
  const links = isSubscribed ? baseLinks : [...baseLinks, { to: "/pricing", label: "Pricing" }];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-line w-full">
      {/* w-full, px-4, and justify-between guarantee logo left, menu right */}
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Force logo container to align start (left) */}
        <div className="flex justify-start items-center">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? "text-royal" : "text-ink/70 hover:text-ink"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isSubscribed && (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-ink/70 hover:text-ink transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/analyze" className="text-sm font-bold px-4 py-2 rounded-lg bg-royal hover:bg-royal-dark text-white transition-colors shadow-sm">
                    Analyze Now
                  </Link>
                </>
              )}
              <Link to="/account" className="text-sm font-semibold text-ink/70 hover:text-ink transition-colors">
                Account
              </Link>
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="text-sm font-bold px-4 py-2 rounded-lg border border-line text-ink hover:bg-mist transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink/80 hover:text-ink transition-colors">Log in</Link>
              <Link to="/signup" className="text-sm font-bold px-4 py-2 rounded-lg bg-royal hover:bg-royal-dark text-white transition-colors shadow-sm">
                Start analysing
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button className="md:hidden ml-auto" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="md:hidden border-t border-line px-5 py-4 space-y-3 bg-white">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-semibold text-ink">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-3">
            {user ? (
              <>
                {isSubscribed && (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink">
                      Dashboard
                    </Link>
                    <Link to="/analyze" onClick={() => setOpen(false)} className="text-sm font-bold px-4 py-2 rounded-lg bg-royal hover:bg-royal-dark text-white text-center transition-colors">
                      Analyze Now
                    </Link>
                  </>
                )}
                <Link to="/account" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink">
                  Account
                </Link>
                <button
                  onClick={async () => { await signOut(); setOpen(false); navigate("/"); }}
                  className="text-sm font-bold px-4 py-2 rounded-lg border border-line text-ink text-center hover:bg-mist transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink/80">Log in</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="text-sm font-bold px-4 py-2 rounded-lg bg-royal hover:bg-royal-dark text-white text-center transition-colors">
                  Start Analysing
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}