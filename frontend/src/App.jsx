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
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import ServiceProviderProfile from "./components/ServiceProviderProfile";
import ServiceList from "./components/ServiceList";
import ProviderDashboard from "./components/ProviderDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import MyMessages from "./components/MyMessages";

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
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/provider-profile" element={<ServiceProviderProfile />} />
              <Route path="/service/:serviceName" element={<ServiceDetail />} />
              <Route path="/services" element={<ServiceList />} />
              <Route path="/my-messages" element={<MyMessages />} />
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