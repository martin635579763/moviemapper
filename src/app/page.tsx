
"use client";

// import { useAuthContext } from '@/contexts/AuthContext'; // Removed
import { sampleFilms } from '@/data/films';
import { FilmCard } from '@/components/FilmCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, UserCog } from 'lucide-react'; // LogIn, LogOut removed


export default function HomePage() {
  // const { isManager, loginAsManager, logoutManager } = useAuthContext(); // Removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
          Now Showing
        </h1>
        <div className="flex items-center gap-2">
          {/* Simplified to always show Layout Editor link */}
          <Button asChild variant="outline">
            <Link href="/editor">
              <UserCog className="mr-2 h-4 w-4" /> Layout Editor
            </Link>
          </Button>
          {/* Removed login/logout logic */}
          {/* {isManager ? (
            <>
              <Button asChild variant="outline">
                <Link href="/editor">
                  <UserCog className="mr-2 h-4 w-4" /> Layout Editor
                </Link>
              </Button>
              <Button variant="ghost" onClick={logoutManager} size="sm">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={loginAsManager}>
              <LogIn className="mr-2 h-4 w-4" /> Manager Login
            </Button>
          )} */}
        </div>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {sampleFilms.map(film => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
      <footer className="text-center mt-12 py-6 text-muted-foreground text-sm">
        Powered by Firebase Studio
      </footer>
    </div>
  );
}
