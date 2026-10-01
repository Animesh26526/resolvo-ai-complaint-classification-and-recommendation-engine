import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Handles new user registration UI with Role Selection and OTP Verification.
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default role
  
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Verification
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/auth/register', { name, email, password, role });
      setStep(2);
      setSuccess('Registration successful! Please check your email for the OTP.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/auth/verify-email', { email, otp });
      // Automatically log them in
      const user = await login(email, password);
      // Route based on role
      if (user.role === 'om') navigate('/om/dashboard');
      else if (user.role === 'qat') navigate('/qat/dashboard');
      else if (user.role === 'cse') navigate('/cse/dashboard');
      else navigate('/customer/complaints');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <span className="font-bold text-2xl tracking-tight font-sans">R</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          {step === 1 ? 'Create a Resolvo Account' : 'Verify Your Email'}
        </h2>
        {step === 1 && (
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              Sign in
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
          
          {success && step === 2 && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[18px] mt-0.5">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">Account Role</label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm bg-slate-50"
                  >
                    <option value="customer">Customer</option>
                    <option value="cse">Customer Support (CSE)</option>
                    <option value="qat">QA Team (QAT)</option>
                    <option value="om">Operations Manager (OM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full name</label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : 'Create Account'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">Verification OTP</label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Check your console logs (or email) for the OTP code.</p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : 'Verify & Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
