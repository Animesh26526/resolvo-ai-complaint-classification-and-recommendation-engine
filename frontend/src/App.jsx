import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AppLayout from './components/layout/AppLayout';

import OMDashboard from './pages/om/OMDashboard';
import OMComplaints from './pages/om/OMComplaints';
import CSEComplaints from './pages/cse/CSEComplaints';
import QATComplaints from './pages/qat/QATComplaints';
import QAReview from './pages/qat/QAReview';
import CustomerComplaints from './pages/customer/CustomerComplaints';
import ComplaintDetail from './pages/shared/ComplaintDetail';
import SubmitComplaint from './pages/shared/SubmitComplaint';
import OMReports from './pages/om/OMReports';
import QATDashboard from './pages/qat/QATDashboard';
import CSEDashboard from './pages/cse/CSEDashboard';

// Temporary placeholders for incomplete routes
const Placeholder = ({ title }) => (
  <div className="p-8">
    <h2 className="text-xl font-bold">{title}</h2>
    <p className="text-slate-500 mt-2">This page is under construction.</p>
  </div>
);

// Main application entry point, sets up routing and authentication context.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Fallback routing */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Shared Routes */}
              <Route path="/complaint/:id" element={<ComplaintDetail />} />
              
              {/* OM Routes */}
              <Route path="/om/dashboard" element={<OMDashboard />} />
              <Route path="/om/complaints" element={<OMComplaints />} />
              <Route path="/om/reports" element={<OMReports />} />
              
              {/* QAT Routes */}
              <Route path="/qat/dashboard" element={<QATDashboard />} />
              <Route path="/qat/complaints" element={<QATComplaints />} />
              <Route path="/qat/review/:id" element={<QAReview />} />
              
              {/* CSE Routes */}
              <Route path="/cse/dashboard" element={<CSEDashboard />} />
              <Route path="/cse/complaints" element={<CSEComplaints />} />
              <Route path="/cse/submit" element={<SubmitComplaint />} />
              
              {/* Customer Routes */}
              <Route path="/customer/complaints" element={<CustomerComplaints />} />
              <Route path="/customer/submit" element={<SubmitComplaint />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
