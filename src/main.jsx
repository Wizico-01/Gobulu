import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

const isAuthCallback = window.location.pathname === "/auth/callback";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        {isAuthCallback ? <AuthCallback /> : <App />}
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);