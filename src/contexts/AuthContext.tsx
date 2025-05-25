
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For redirects
import { 
  getManagerStatusService, 
  setManagerStatusService, 
  clearManagerStatusService 
} from '@/services/authService';

interface AuthContextType {
  isManager: boolean;
  loginManager: () => void;
  logoutManager: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isManager, setIsManager] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // To prevent flash of unauth content
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for persisted manager status on initial load via service
    if (typeof window !== 'undefined') {
      setIsManager(getManagerStatusService());
      setLoading(false);
    } else {
      setLoading(false); // Not in browser, so no persisted state
    }
  }, []);

  const loginManager = useCallback(() => {
    setManagerStatusService(true);
    setIsManager(true);
  }, []);

  const logoutManager = useCallback(() => {
    clearManagerStatusService();
    setIsManager(false);
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
