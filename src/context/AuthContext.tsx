'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { getVendor, createVendor } from '@/lib/firestore';
import { Vendor } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  vendor: Vendor | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadVendor(u: User) {
    try {
      let v = await getVendor(u.uid);
      if (!v) {
        v = await createVendor(u.uid, u.displayName || 'Vendor', u.email || '', u.photoURL || '');
      }
      setVendor(v);
    } catch (err) {
      console.error('Error loading vendor:', err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadVendor(u);
      } else {
        setVendor(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signUpWithEmail(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await createVendor(cred.user.uid, displayName, email, '');
    await loadVendor(cred.user);
  }

  async function loginWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await loadVendor(cred.user);
  }

  async function logout() {
    await signOut(auth);
    setVendor(null);
  }

  async function refreshVendor() {
    if (user) {
      await loadVendor(user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        vendor,
        loading,
        signUpWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        refreshVendor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
