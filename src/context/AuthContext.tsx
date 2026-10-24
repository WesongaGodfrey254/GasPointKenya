import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

export interface RegistrationPayload {
  role: 'customer' | 'gas_owner';
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address?: string;
  // Provider specific
  businessName?: string;
  city?: string;
  county?: string;
  deliveryRadiusKm?: number;
  operatingHours?: string;
  licenseNumber?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (payload: RegistrationPayload) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session from localStorage on initial boot
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('gaspoint_session_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Session restore error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to authenticate' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('gaspoint_session_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  // Register handler
  const register = async (payload: RegistrationPayload) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      return {
        success: true,
        message: data.message || 'Registration successful. Please log in.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    localStorage.removeItem('gaspoint_session_user');
    localStorage.removeItem('gaspoint_selected_station');
  };

  // Google Sign-In helper
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user && result.user.email) {
        const syncRes = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName || result.user.email.split('@')[0],
            phone: result.user.phoneNumber || '',
          }),
        });

        if (syncRes.ok) {
          const userObj = await syncRes.json();
          setCurrentUser(userObj);
          localStorage.setItem('gaspoint_session_user', JSON.stringify(userObj));
        }
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      try {
        const res = await fetch(`/api/users`);
        if (res.ok) {
          const all = await res.json();
          const found = all.find((u: User) => u.id === currentUser.id);
          if (found) {
            setCurrentUser(found);
            localStorage.setItem('gaspoint_session_user', JSON.stringify(found));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        signInWithGoogle,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
