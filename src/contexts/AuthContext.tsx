
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For redirects

interface AuthContextType {
  isManager: boolean;
  loginManager: () => void;
  logoutManager: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANAGER_STORAGE_KEY = 'cinemaApp_isManager_v1';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isManager, setIsManager] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // To prevent flash of unauth content
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for persisted manager status on initial load
    if (typeof window !== 'undefined') {
      try {
        const storedIsManager = localStorage.getItem(MANAGER_STORAGE_KEY);
        setIsManager(storedIsManager === 'true');
      } catch (error) {
        console.error("Error reading manager status from localStorage", error);
        setIsManager(false);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false); // Not in browser, so no persisted state
    }
  }, []);

  const loginManager = useCallback(() => {
    setIsManager(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MANAGER_STORAGE_KEY, 'true');
      } catch (error) {
        console.error("Error saving manager status to localStorage", error);
      }
    }
  }, []);

  const logoutManager = useCallback(() => {
    setIsManager(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(MANAGER_STORAGE_KEY);
      } catch (error) {
        console.error("Error removing manager status from localStorage", error);
      }
    }
    router.push('/'); // Redirect to home on logout
  }, [router]);

  if (loading) {
    // You could return a loading spinner here if preferred, or null to render nothing until loaded
    return null; 
  }

  return (
    <AuthContext.Provider value={{ isManager, loginManager, logoutManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
