
"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { Film } from '@/data/films';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Button and Ticket imports are no longer used
import { FilmScheduleDialog } from './FilmScheduleDialog';

export const FilmCard: React.FC<{ film: Film }> = ({ film }) => {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <FilmScheduleDialog film={film}>
          <div className="relative w-full aspect-[2/3] cursor-pointer group">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
              data-ai-hint="movie poster"
            />
          </div>
        </FilmScheduleDialog>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <Link href={`/film/${film.id}`} className="group">
          <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">{film.title}</CardTitle>
        </Link>
        <p className="text-xs text-muted-foreground mb-2">{film.genre} &bull; {film.duration}</p>
        <p className="text-sm text-foreground line-clamp-3 flex-grow mb-3">{film.description}</p>
        {/* Instructional label added */}
        <div className="mt-auto pt-3 border-t border-border/50 text-center">
          <p className="text-xs text-primary/90 font-medium leading-tight">
            Tap poster for showtimes &amp; halls.
          </p>
          <p className="text-xs text-primary/90 font-medium leading-tight">
            Tap title to pick your seats!
          </p>
        </div>
      </CardContent>
      {/* CardFooter with the Button has been removed */}
    </Card>
  );
};
