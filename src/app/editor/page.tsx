
"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { AppToolbar } from '@/components/AppToolbar';
import { LayoutEditor } from '@/components/LayoutEditor';
import { LayoutPreview } from '@/components/LayoutPreview';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function EditorPage() {
  const { user, isManager, logout, loadingAuth } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !isManager) {
      router.replace('/'); 
    }
  }, [isManager, loadingAuth, router]);

  if (loadingAuth) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Authenticating...</h1>
        </div>
    );
  }

  if (!isManager) { 
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You must be logged in as a manager to access the layout editor.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <LayoutProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <header className="p-3 border-b bg-card shadow-sm flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Home
                </Link>
              </Button>
              <h1 className="text-lg font-semibold text-primary whitespace-nowrap">
                  Cinema Layout Editor
              </h1>
            </div>
            {user && ( // Logout only if user is logged in
              <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-1.5 h-4 w-4" /> Logout
              </Button>
            )}
        </header>
        <AppToolbar />
        <main className="flex flex-1 overflow-auto p-2 gap-2">
          <div className="flex-grow w-2/3">
            <LayoutEditor />
          </div>
          <div className="flex-grow w-1/3">
            <LayoutPreview />
          </div>
        </main>
      </div>
    </LayoutProvider>
  );
}
