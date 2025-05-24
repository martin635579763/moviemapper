
"use client";

import { sampleFilms, type Film } from '@/data/films';
import { FilmCard } from '@/components/FilmCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCog, Clapperboard } from 'lucide-react'; 

interface CategorizedFilms {
  categoryTitle: string;
  films: Film[];
}

export default function HomePage() {
  const categoriesToShow: string[] = ['Sci-Fi', 'Mystery']; // Define categories to display

  const categorizedFilms: CategorizedFilms[] = categoriesToShow.map(category => {
    return {
      categoryTitle: `${category} Movies`, // Example: "Sci-Fi Movies"
      films: sampleFilms.filter(film => 
        film.genre.toLowerCase().includes(category.toLowerCase())
      )
    };
  }).filter(group => group.films.length > 0); // Only keep categories with films

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground p-4 sm:p-6 md:p-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-pulse" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Movie Funhouse!
          </h1>
        </div>
        <Button asChild variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/editor">
            <UserCog className="mr-2 h-5 w-5" /> Layout Editor
          </Link>
        </Button>
      </header>

      {categorizedFilms.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No films available in the selected categories right now. Check back soon!</p>
        </div>
      )}

      {categorizedFilms.map(({ categoryTitle, films }) => (
        <section key={categoryTitle} className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-primary mb-6 pb-2 border-b-2 border-primary/30">
            {categoryTitle}
          </h2>
          {films.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
              {films.map(film => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No films found in this category.</p>
          )}
        </section>
      ))}
      
      <footer className="text-center mt-16 py-8 text-muted-foreground text-sm border-t border-border/50">
        Powered by Firebase Studio & Your Imagination!
      </footer>
    </div>
  );
}
