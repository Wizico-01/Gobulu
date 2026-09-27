import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const ADMIN_EMAIL = "wisdomgodswill15@gmail.com"; // replace with your real login email

export default function AdminGate({ children }) {
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(data?.session?.user?.email === ADMIN_EMAIL);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;
  if (!isAdmin) return <div className="p-8 text-center text-ink/50">Not authorized.</div>;
  return children;
}