
"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { AppToolbar } from '@/components/AppToolbar';
import { LayoutEditor } from '@/components/LayoutEditor';
import { LayoutPreview } from '@/components/LayoutPreview';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function EditorPage() {
  const { isManager, logoutManager } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Check if running in browser and user is not a manager
    if (typeof window !== "undefined" && !isManager) {
      router.replace('/'); 
    }
  }, [isManager, router]);

  // This check ensures that if the effect hasn't run yet (e.g. initial render)
  // or if isManager becomes false after initial load, content isn't shown.
  if (!isManager) { 
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You must be logged in as a manager to access the layout editor.</p>
            <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
        </div>
    );
  }

  return (
    <LayoutProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <header className="p-3 border-b bg-card shadow-sm flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-lg font-semibold text-primary whitespace-nowrap">
                Cinema Layout Editor
            </h1>
            {isManager && ( // Technically redundant due to the guard above, but good for explicit clarity
              <Button variant="outline" size="sm" onClick={logoutManager}>
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
