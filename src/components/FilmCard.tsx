
"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { Film } from '@/data/films';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';

interface FilmCardProps {
  film: Film;
}

export const FilmCard: React.FC<FilmCardProps> = ({ film }) => {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/film/${film.id}`} className="block group">
          <div className="relative w-full aspect-[2/3]"> {/* Standard poster aspect ratio */}
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={film.genre.split(',')[0].toLowerCase().replace(/\s+/g, '') || "movie"}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <Link href={`/film/${film.id}`} className="group">
          <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">{film.title}</CardTitle>
        </Link>
        <p className="text-xs text-muted-foreground mb-2">{film.genre} &bull; {film.duration}</p>
        <p className="text-sm text-foreground line-clamp-3 flex-grow mb-3">{film.description}</p>
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto w-full">
        <Button asChild className="w-full">
          <Link href={`/film/${film.id}`}>
            <Ticket className="mr-2 h-4 w-4" /> Get Tickets
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
