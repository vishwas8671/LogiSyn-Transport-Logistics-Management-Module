import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Tracking from './pages/Tracking';
import DriverPortal from './pages/DriverPortal';

// Security Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <span className="border-4 border-emerald-500/20 border-t-emerald-500 h-10 w-10 rounded-full animate-spin"></span>
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verifying Session credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Prevent cross-access by redirecting drivers to portal and managers to main panel
    return <Navigate to={user.role === 'driver' ? '/driver-portal' : '/'} replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Management routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Shipments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Drivers />
                </ProtectedRoute>
              }
            />

            {/* Shared Route Tracking map */}
            <Route
              path="/tracking"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'driver']}>
                  <Tracking />
                </ProtectedRoute>
              }
            />

            {/* Driver Portal routes */}
            <Route
              path="/driver-portal"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverPortal />
                </ProtectedRoute>
              }
            />

            {/* Redirect fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
