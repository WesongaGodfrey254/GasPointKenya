import React, { useState } from 'react';
import { useAuth, RegistrationPayload } from '../context/AuthContext.tsx';
import {
  Flame,
  Store,
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { login, register } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'gas_owner'>('customer');

  // Login credentials state (blank by default - credentials must be entered)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Provider specific registration
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCity, setRegCity] = useState('Nairobi');
  const [regCounty, setRegCounty] = useState('Nairobi County');
  const [regDeliveryRadius, setRegDeliveryRadius] = useState(15);
  const [regOperatingHours, setRegOperatingHours] = useState('7:30 AM - 8:30 PM');
  const [regLicense, setRegLicense] = useState(`EPRA/LPG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Handle Login Submit - Requires knowing and entering credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const result = await login(loginEmail, loginPassword);
    if (!result.success) {
      setLoginError(result.error || 'Invalid credentials. Please verify your email and password.');
    }
    setLoginLoading(false);
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please verify your password.');
      return;
    }

    if (regPassword.length < 5) {
      setRegError('Password must be at least 5 characters.');
      return;
    }

    setRegLoading(true);

    const payload: RegistrationPayload = {
      role: selectedRole,
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      phone: regPhone,
      address: regAddress,
      businessName: regBusinessName,
      city: regCity,
      county: regCounty,
      deliveryRadiusKm: Number(regDeliveryRadius),
      operatingHours: regOperatingHours,
      licenseNumber: regLicense,
    };

    const result = await register(payload);
    setRegLoading(false);

    if (!result.success) {
      setRegError(result.error || 'Registration failed');
    } else {
      setRegSuccessMessage(
        selectedRole === 'gas_owner'
          ? '🎉 Gas Service Provider registration submitted! Your depot application is pending Super Admin verification. Log in with your new credentials to monitor approval status.'
          : '🎉 Customer account registered successfully! Please log in with your new credentials.'
      );
      // Pre-fill login email and switch to login tab
      setLoginEmail(regEmail);
      setLoginPassword('');
      setTimeout(() => {
        setAuthMode('login');
      }, 2500);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Portal Header */}
        <div className="bg-gradient-to-br from-[#0F3D2E] via-emerald-950 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 p-0.5 mx-auto shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0F3D2E] rounded-[14px] flex items-center justify-center">
                <Flame className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              GASPOINT KENYA
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
              LPG Gas Sales, Ordering & Delivery Management System
            </p>
          </div>

          <div className="absolute inset-0 bg-radial from-emerald-500/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        </div>

        {/* Tab Controls: Login vs Register First */}
        <div className="p-2 bg-slate-100 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log In to Dashboard
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setRegError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all ${
              authMode === 'register'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register First
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: LOGIN (Credential-based only) */}
          {authMode === 'login' && (
            <div className="space-y-5">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {regSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{regSuccessMessage}</span>
                </div>
              )}

              {/* Secure Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.01]"
                  >
                    <span>{loginLoading ? 'Authenticating Credentials...' : 'Log In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Register Callout */}
              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                New user or gas depot owner?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Register First as Provider or Customer →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER FIRST */}
          {authMode === 'register' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Choose Your Account Type to Register
                </h3>
                <p className="text-xs text-slate-500">
                  Register as a gas service provider or customer before accessing your dashboard
                </p>
              </div>

              {/* Role Segmented Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedRole === 'customer'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className={`w-5 h-5 ${selectedRole === 'customer' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">Customer</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Order refill, exchange, or new cylinders with doorstep delivery.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('gas_owner')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedRole === 'gas_owner'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Store className={`w-5 h-5 ${selectedRole === 'gas_owner' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">Gas Provider</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Register LPG depot, manage stock & riders (requires admin approval).
                  </p>
                </button>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Dynamic Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                {/* Common fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      {selectedRole === 'customer' ? 'Full Name' : 'Owner / Manager Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Ochieng"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="samuel@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0712345678"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Create Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>
                </div>

                {/* Additional Gas Provider Station fields */}
                {selectedRole === 'gas_owner' && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Store className="w-4 h-4" />
                      <span>Gas Point Station Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Gas Point Business Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Gas Point South B"
                          value={regBusinessName}
                          onChange={(e) => setRegBusinessName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Depot Physical Address
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Plainsview Road, Opp Shopping Center"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          City / Town
                        </label>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          EPRA License Number
                        </label>
                        <input
                          type="text"
                          required
                          value={regLicense}
                          onChange={(e) => setRegLicense(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Delivery Radius (km)
                        </label>
                        <input
                          type="number"
                          required
                          value={regDeliveryRadius}
                          onChange={(e) => setRegDeliveryRadius(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Operating Hours
                        </label>
                        <input
                          type="text"
                          required
                          value={regOperatingHours}
                          onChange={(e) => setRegOperatingHours(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                      ⚠️ <strong>EPRA Approval Policy:</strong> Once registered, the Super Admin must verify your license before your station is published to customers.
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.01]"
                  >
                    <span>{regLoading ? 'Registering Account...' : 'Complete Registration & Proceed'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="text-center text-xs text-slate-500 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Log In with Your Credentials →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
