import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthPortal } from './components/AuthPortal.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { SuperAdminDashboard } from './components/SuperAdminDashboard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { OwnerRegistrationModal } from './components/OwnerRegistrationModal.tsx';
import { EmailCenterModal } from './components/EmailCenterModal.tsx';
import { SafetyGuideModal } from './components/SafetyGuideModal.tsx';
import { OrderTrackerModal } from './components/OrderTrackerModal.tsx';
import { Flame, ShieldCheck, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'customer' | 'owner' | 'super_admin'>('customer');

  // Modals
  const [isOwnerRegOpen, setIsOwnerRegOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  const [isSafetyGuideOpen, setIsSafetyGuideOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);

  // Sync view when currentUser role changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'super_admin') {
        setCurrentView('super_admin');
      } else if (currentUser.role === 'gas_owner') {
        setCurrentView('owner');
      } else {
        setCurrentView('customer');
      }
    }
  }, [currentUser?.role]);

  const handleOrderSuccess = (orderId: number) => {
    setTrackedOrderId(orderId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar (Only rendered if user is logged in, or rendered with minimal brand banner) */}
      {currentUser && (
        <Navbar
          onOpenOwnerRegistration={() => setIsOwnerRegOpen(true)}
          onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
          onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center text-slate-400 space-y-2">
            <Flame className="w-8 h-8 text-emerald-600 animate-bounce mx-auto" />
            <p className="text-xs font-semibold">Connecting to GasPoint...</p>
          </div>
        ) : !currentUser ? (
          /* User must register or log in first */
          <AuthPortal />
        ) : (
          /* User landed on their respective dashboard */
          <>
            {currentView === 'customer' && (
              <CustomerDashboard onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)} />
            )}

            {currentView === 'owner' && <OwnerDashboard />}

            {currentView === 'super_admin' && <SuperAdminDashboard />}
          </>
        )}
      </main>

      {/* Cart Drawer for customers */}
      {currentUser && <CartDrawer onOrderSuccess={handleOrderSuccess} />}

      {/* Modals */}
      <OwnerRegistrationModal
        isOpen={isOwnerRegOpen}
        onClose={() => setIsOwnerRegOpen(false)}
        onRegistered={() => {
          setIsOwnerRegOpen(false);
          setCurrentView('owner');
        }}
      />

      <EmailCenterModal
        isOpen={isEmailCenterOpen}
        onClose={() => setIsEmailCenterOpen(false)}
      />

      <SafetyGuideModal
        isOpen={isSafetyGuideOpen}
        onClose={() => setIsSafetyGuideOpen(false)}
      />

      {trackedOrderId && (
        <OrderTrackerModal
          isOpen={true}
          orderId={trackedOrderId}
          onClose={() => setTrackedOrderId(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <span>GASPOINT KENYA</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Centralized LPG cooking gas sales, multi-provider depot marketplace, stock management, and Safaricom M-Pesa automated dispatch system.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-white font-bold text-xs uppercase tracking-wider">
                Regulatory Standards
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>EPRA Certified Dealers Only</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KEBS Weight & Safety Verified</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tamper-evident Security Seals</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-white font-bold text-xs uppercase tracking-wider">
                Support & Emergency
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-300" />
                  <span>24/7 Hotline: +254 700 000 999</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-300" />
                  <span>support@gaspoint.co.ke</span>
                </div>
                <div>Emergency Fire & Safety: 999 / 112</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-white font-bold text-xs uppercase tracking-wider">
                System Administration
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Administered by Godfrey Wesonga (Super Admin). Running with Cloud SQL PostgreSQL database & Safaricom Daraja M-Pesa API integration.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>© {new Date().getFullYear()} GasPoint Kenya. All rights reserved.</div>
            <div className="flex gap-4">
              <button onClick={() => setIsSafetyGuideOpen(true)} className="hover:text-slate-300">
                LPG Handling Rules
              </button>
              <button onClick={() => setIsEmailCenterOpen(true)} className="hover:text-slate-300">
                Email Dispatch Logs
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
