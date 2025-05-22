
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isManager: boolean;
  loginAsManager: () => void;
  logoutManager: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isManager, setIsManager] = useState(false);
  const router = useRouter();

  const loginAsManager = useCallback(() => {
    setIsManager(true);
    // Optionally, navigate to editor after login if desired
    // router.push('/editor');
  }, []);

  const logoutManager = useCallback(() => {
    setIsManager(false);
    // If on editor page, the page itself will redirect due to isManager change.
    // If on another page, this ensures a clean state.
    // router.push('/'); // Commented out as editor page handles its own redirect
  }, []);

  return (
    <AuthContext.Provider value={{ isManager, loginAsManager, logoutManager }}>
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
