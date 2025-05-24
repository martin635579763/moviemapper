
"use client";

import { useState, useEffect } from 'react';
import { getSampleFilmsWithDynamicSchedules, type Film } from '@/data/films';
import { FilmCard } from '@/components/FilmCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCog, Clapperboard, LogIn, LogOut } from 'lucide-react'; 
import { useAuthContext } from '@/contexts/AuthContext';

export default function HomePage() {
  const [filmsToDisplay, setFilmsToDisplay] = useState<Film[]>([]);
  const { isManager, loginManager, logoutManager } = useAuthContext();

  useEffect(() => {
    setFilmsToDisplay(getSampleFilmsWithDynamicSchedules());
  }, []);


  return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground p-4 sm:p-6 md:p-8">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Clapperboard className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Movie Funhouse!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isManager ? (
              <>
                <Button asChild variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                  <Link href="/editor">
                    <UserCog className="mr-2 h-5 w-5" /> Layout Editor
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" onClick={logoutManager} className="shadow-md hover:shadow-lg transition-shadow">
                  <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="lg" onClick={loginManager} className="shadow-md hover:shadow-lg transition-shadow">
                <LogIn className="mr-2 h-5 w-5" /> Manager Login
              </Button>
            )}
          </div>
        </header>

        {filmsToDisplay.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No films available right now, or still loading schedules. Check back soon!</p>
          </div>
        )}

        {filmsToDisplay.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary mb-6 pb-2 border-b-2 border-primary/30">
              Featured Films
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
              {filmsToDisplay.map(film => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          </section>
        )}
        
        <footer className="text-center mt-16 py-8 text-muted-foreground text-sm border-t border-border/50">
          Powered by Firebase Studio & Your Imagination!
        </footer>
      </div>
  );
}
