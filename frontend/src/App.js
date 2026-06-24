import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Public Pages
import PublicHomepage from './pages/PublicHomepage';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Portal Pages
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerApplyLoan from './pages/CustomerApplyLoan';
import CustomerLoans from './pages/CustomerLoans';
import CustomerPayments from './pages/CustomerPayments';
import CustomerProfile from './pages/CustomerProfile';
import CustomerTrackApplication from './pages/CustomerTrackApplication';

// Staff Pages
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

// Staff Protected Route
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Customer Protected Route
const CustomerPrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  // Note: We'll check for customer role specifically
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isCustomer = user.role === 'customer' || user.is_customer;
  
  return isAuthenticated && isCustomer ? children : <Navigate to="/customer/login" />;
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
            
            {/* Customer Portal Routes - Public */}
            <Route path="/customer" element={<CustomerLogin />} />
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            
            {/* Customer Portal Routes - Private */}
            <Route path="/customer/dashboard" element={
              <CustomerPrivateRoute>
                <CustomerDashboard />
              </CustomerPrivateRoute>
            } />
            <Route path="/customer/apply-loan" element={
              <CustomerPrivateRoute>
                <CustomerApplyLoan />
              </CustomerPrivateRoute>
            } />
            <Route path="/customer/loans" element={
              <CustomerPrivateRoute>
                <CustomerLoans />
              </CustomerPrivateRoute>
            } />
            <Route path="/customer/payments" element={
              <CustomerPrivateRoute>
                <CustomerPayments />
              </CustomerPrivateRoute>
            } />
            <Route path="/customer/profile" element={
              <CustomerPrivateRoute>
                <CustomerProfile />
              </CustomerPrivateRoute>
            } />
            <Route path="/customer/track-application" element={
              <CustomerPrivateRoute>
                <CustomerTrackApplication />
              </CustomerPrivateRoute>
            } />
            
            {/* Staff Routes - Private */}
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