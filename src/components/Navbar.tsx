import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import {
  Flame,
  ShoppingBag,
  Mail,
  ShieldCheck,
  Store,
  User as UserIcon,
  ChevronDown,
  LogOut,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

interface NavbarProps {
  onOpenOwnerRegistration: () => void;
  onOpenEmailCenter: () => void;
  onOpenSafetyGuide: () => void;
  currentView: 'customer' | 'owner' | 'super_admin';
  setCurrentView: (view: 'customer' | 'owner' | 'super_admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOwnerRegistration,
  onOpenEmailCenter,
  onOpenSafetyGuide,
  currentView,
  setCurrentView,
}) => {
  const { currentUser, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin
          </span>
        );
      case 'gas_owner':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
            <Store className="w-3.5 h-3.5" />
            Gas Provider
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
            <UserIcon className="w-3.5 h-3.5" />
            Customer
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentUser?.role === 'super_admin') setCurrentView('super_admin');
              else if (currentUser?.role === 'gas_owner') setCurrentView('owner');
              else setCurrentView('customer');
            }}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F3D2E] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-slate-900 leading-none flex items-center gap-1">
                GASPOINT
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-sm">
                  KENYA
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                LPG Sales & Delivery Hub
              </div>
            </div>
          </button>
        </div>

        {/* View Switcher Tabs (Available for Super Admin to preview all interfaces) */}
        {currentUser?.role === 'super_admin' && (
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setCurrentView('super_admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'super_admin'
                  ? 'bg-slate-900 text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin Console</span>
            </button>

            <button
              onClick={() => setCurrentView('customer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'customer'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Store View
            </button>

            <button
              onClick={() => setCurrentView('owner')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'owner'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gas Provider View
            </button>
          </div>
        )}

        {/* Action Buttons & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Automated Email Notifications Drawer */}
          <button
            onClick={onOpenEmailCenter}
            title="Automated Email Notifications"
            className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors relative"
          >
            <Mail className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Shopping Cart Button (visible to customers & super admin preview) */}
          {(currentView === 'customer' || currentUser?.role === 'customer') && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile & Log Out */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all text-xs font-semibold"
              >
                <div className="flex flex-col text-left hidden sm:block">
                  <span className="font-bold text-slate-900 line-clamp-1 max-w-[130px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                {getRoleBadge(currentUser.role)}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSafetyGuide();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>EPRA Safety Protocols</span>
                    </button>

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
