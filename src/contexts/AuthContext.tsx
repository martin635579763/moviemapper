
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User 
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// IMPORTANT: Replace this with your actual manager email address
const MANAGER_EMAIL = "your-manager-email@example.com"; 

interface AuthContextType {
  user: User | null;
  isManager: boolean;
  loadingAuth: boolean;
  signUp: (email: string, pass: string) => Promise<boolean>;
  signIn: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toast: ReturnType<typeof useToast>['toast']; // Expose toast for register page
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("[AuthContext] AuthProvider mounted. Imported auth instance from firebase.ts:", auth);
    if (!auth) {
      console.error("[AuthContext] Firebase Auth is not initialized or available at mount!");
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthContext] onAuthStateChanged triggered. currentUser:", currentUser);
      setUser(currentUser);
      if (currentUser) {
        setIsManager(currentUser.email === MANAGER_EMAIL);
      } else {
        setIsManager(false);
      }
      setLoadingAuth(false);
    });

    return () => {
      console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []); // Empty dependency array is correct here

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
      // onAuthStateChanged will handle setting user and isManager
      router.push('/'); // Redirect to home after successful registration
      return true;
    } catch (error: any) {
      console.error("[AuthContext] SignUp Error", error.code, error.message, error);
      toast({ title: "Sign Up Error", description: error.message || "Failed to register.", variant: "destructive" });
      setIsManager(false); // Ensure manager status is reset on error
      return false;
    } finally {
      setLoadingAuth(false);
    }
  }, [router, toast]);

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
      // onAuthStateChanged will handle setting user and isManager
      router.push('/'); // Redirect to home after successful login
      return true;
    } catch (error: any) {
      console.error("[AuthContext] SignIn Error", error.code, error.message, error);
      toast({ title: "Sign In Error", description: error.message || "Failed to sign in.", variant: "destructive" });
      setIsManager(false); // Ensure manager status is reset on error
      return false;
    } finally {
      setLoadingAuth(false);
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    console.log("[AuthContext] logout called. Checking auth instance:", auth);
    if (!auth) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    setLoadingAuth(true);
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // onAuthStateChanged will set user to null and isManager to false
      router.push('/'); // Redirect to home on logout
    } catch (error: any) {
      console.error("[AuthContext] Logout Error", error.code, error.message, error);
      toast({ title: "Logout Error", description: error.message || "Failed to logout.", variant: "destructive" });
    } finally {
      setLoadingAuth(false);
    }
  }, [router, toast]);

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
