
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Ensure auth is imported
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// IMPORTANT: Replace this with your actual manager email address if it's not zhungmatin@gmail.com
const MANAGER_EMAIL = "zhungmatin@gmail.com"; 

interface AuthContextType {
  user: User | null;
  isManager: boolean;
  loadingAuth: boolean;
  signUp: (email: string, pass: string) => Promise<boolean>;
  signIn: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toast: ReturnType<typeof useToast>['toast']; // Expose toast for direct use if needed elsewhere
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("[AuthContext] AuthProvider mounted. Imported auth instance:", auth);
    if (!auth) {
      console.error("[AuthContext] Firebase Auth is not initialized or available at mount!");
      setLoadingAuth(false);
      return;
    }

    setLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthContext] onAuthStateChanged triggered. currentUser:", currentUser);
      setUser(currentUser);
      if (currentUser && currentUser.email) { // Ensure currentUser and email exist
        console.log("[AuthContext] Current user email:", currentUser.email);
        console.log("[AuthContext] MANAGER_EMAIL for comparison:", MANAGER_EMAIL);
        // Case-insensitive comparison
        const isUserTheManager = currentUser.email.toLowerCase() === MANAGER_EMAIL.toLowerCase();
        setIsManager(isUserTheManager);
        console.log(`[AuthContext] User: ${currentUser.email}, IsManager set to: ${isUserTheManager}`);
      } else {
        setIsManager(false);
        console.log("[AuthContext] No user or user email missing, IsManager set to: false");
      }
      setLoadingAuth(false);
    }, (error) => {
      console.error("[AuthContext] Error in onAuthStateChanged:", error);
      setUser(null);
      setIsManager(false);
      setLoadingAuth(false);
    });

    return () => {
      console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []); // auth is stable, no need to list as dependency for setup

  const signUp = useCallback(async (email: string, pass: string): Promise<boolean> => {
    console.log("[AuthContext] signUp called. Checking auth instance:", auth);
    if (!auth) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return false;
    }
    setLoadingAuth(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Success", description: "Registration successful! You are now logged in." });
      router.push('/'); // onAuthStateChanged will update user and isManager
      return true;
    } catch (error: any) {
      console.error("[AuthContext] SignUp Error", error.code, error.message, error);
      toast({ title: "Sign Up Error", description: error.message || "Failed to register.", variant: "destructive" });
      setLoadingAuth(false); 
      return false;
    }
  }, [router, toast]); // auth removed as it's stable

  const signIn = useCallback(async (email: string, pass: string): Promise<boolean> => {
    console.log("[AuthContext] signIn called. Checking auth instance:", auth);
    if (!auth) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return false;
    }
    setLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Success", description: "Login successful!" });
      router.push('/'); // onAuthStateChanged will update user and isManager
      return true;
    } catch (error: any) {
      console.error("[AuthContext] SignIn Error", error.code, error.message, error);
      toast({ title: "Sign In Error", description: error.message || "Failed to sign in.", variant: "destructive" });
      setLoadingAuth(false); 
      return false;
    }
  }, [router, toast]); // auth removed as it's stable

  const logout = useCallback(async () => {
    console.log("[AuthContext] logout called. Checking auth instance:", auth);
    if (!auth) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    setLoadingAuth(true); 
    try {
      await signOut(auth);
      // User state will be cleared by onAuthStateChanged
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/');
    } catch (error: any) {
      console.error("[AuthContext] Logout Error", error.code, error.message, error);
      toast({ title: "Logout Error", description: error.message || "Failed to logout.", variant: "destructive" });
      setLoadingAuth(false); // Ensure loading state is cleared on error
    }
  }, [router, toast]); // auth removed as it's stable


  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen"><p>Loading authentication...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, isManager, loadingAuth, signUp, signIn, logout, toast }}>
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
