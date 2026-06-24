import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import PublicHomepage from './pages/PublicHomepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Collections from './pages/Collections';
import Reports from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicHomepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private Routes */}
            <Route path="/app" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/loans" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Loans />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/loans/new" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Loans />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/loans/pending" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Loans />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/loans/approved" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Loans />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/customers" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Customers />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/payments" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Payments />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/payments/new" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Payments />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/collections" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Collections />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;