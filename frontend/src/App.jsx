import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ServiceDetail from "./components/ServiceDetail";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import ServiceProviderProfile from "./components/ServiceProviderProfile";
import ServiceList from "./components/ServiceList";
import ProviderDashboard from "./components/ProviderDashboard";

import "./App.css";

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider-profile" element={<ServiceProviderProfile />} />
              <Route path="/service/:serviceName" element={<ServiceDetail />} />
              <Route path="/services" element={<ServiceList />} />
              <Route
                path="/"
                element={
                  <>
                    <Hero />
                    <About />
                    <Services />
                    <Contact />
                  </>
                }
              />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;