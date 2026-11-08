import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminGate from "./components/AdminGate.jsx";
import Home from "./pages/Home.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import Pricing from "./pages/Pricing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Account from "./pages/Account.jsx";
import History from "./pages/History.jsx";
import AdminSignals from "./pages/AdminSignals.jsx";
import SecurityGate from "./components/SecurityGate.jsx";
import Contact from "./pages/Contact.jsx";
import AdminMessages from "./pages/AdminMessages.jsx";


export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          
          <Route
  path="/contact"
  element={
    <ProtectedRoute>
      <Contact />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/messages"
  element={
    <AdminGate>
      <SecurityGate>
        <AdminMessages />
      </SecurityGate>
    </AdminGate>
  }
/>

          <Route
            path="/admin"
            element={
              <AdminGate>
                <SecurityGate>
                  <AdminSignals />
                </SecurityGate>
              </AdminGate>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}