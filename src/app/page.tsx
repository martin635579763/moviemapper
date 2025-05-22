
import { sampleFilms } from '@/data/films';
import { FilmCard } from '@/components/FilmCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
          Now Showing
        </h1>
        <Link href="/editor" passHref legacyBehavior>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" /> Layout Editor
          </Button>
        </Link>
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
