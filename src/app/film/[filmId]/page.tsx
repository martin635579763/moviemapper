
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { LayoutProvider, useLayoutContext } from '@/contexts/LayoutContext';
// AppToolbar removed as it's not needed for ticket purchasing view
import { LayoutPreview } from '@/components/LayoutPreview';
import { sampleFilms, type Film } from '@/data/films';
import { sampleLayouts } from '@/data/sample-layouts';
import type { HallLayout } from '@/types/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Ticket as TicketIconLucide } from 'lucide-react'; // Renamed TicketIcon to avoid conflict if any
import { ScrollArea } from '@/components/ui/scroll-area';

// This component will consume the LayoutContext
const FilmTicketBookingInterface: React.FC<{ film: Film; initialLayout: HallLayout }> = ({ film, initialLayout }) => {
  const { loadLayout, layout } = useLayoutContext();

  useEffect(() => {
    // Deep copy layout to avoid modifying the original sampleLayouts array
    // Only load if the context layout is different from the intended initialLayout or not loaded yet
    if (initialLayout && (!layout || layout.name !== initialLayout.name)) {
       loadLayout(JSON.parse(JSON.stringify(initialLayout)));
    }
  }, [initialLayout, loadLayout, layout]);


  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Film Details Section */}
      <Card className="xl:w-1/3 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[2/3]">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={film.genre.split(',')[0].toLowerCase() || "movie poster"}
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold mb-3">{film.title}</CardTitle>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>{film.genre}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>{film.duration}</span>
            </div>
          </div>
          <p className="text-foreground text-base leading-relaxed">{film.description}</p>
        </CardContent>
      </Card>

      {/* Seat Selection Section */}
      <div className="xl:w-2/3 flex flex-col">
        <div className="mb-4">
            <h2 className="text-2xl font-semibold text-primary mb-1">Select Your Seats</h2>
            <p className="text-muted-foreground">
              You are viewing the seat layout for <span className="font-semibold text-foreground">{initialLayout.name}</span>. Choose available seats below.
            </p>
        </div>
        {/* AppToolbar removed from here to streamline the ticket purchasing view */}
        <div className="flex-grow mt-1 rounded-lg overflow-hidden shadow-md">
          <div className="h-full min-h-[400px] lg:min-h-[500px] flex flex-col">
             <LayoutPreview /> {/* LayoutPreview uses the context for layout data and interactions */}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function FilmPage() {
  const params = useParams();
  const filmId = params?.filmId as string;
  
  const filmData = useMemo(() => {
    if (!filmId) return { film: undefined, layoutToLoad: undefined };
    const currentFilm = sampleFilms.find(f => f.id === filmId);
    if (!currentFilm) return { film: undefined, layoutToLoad: undefined };
    
    const associatedLayout = sampleLayouts.find(l => l.name === currentFilm.associatedLayoutName);
    const layout = associatedLayout || sampleLayouts[0]; // Fallback to first sample layout

    return { film: currentFilm, layoutToLoad: layout };
  }, [filmId]);

  const { film, layoutToLoad } = filmData;

  if (!filmId) {
    return <div className="text-center py-20 text-xl text-destructive-foreground">Film ID is missing.</div>;
  }

  if (!film || !layoutToLoad) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <TicketIconLucide className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <h1 className="text-2xl font-semibold mb-2">Loading Film Details...</h1>
            <p className="text-muted-foreground mb-6">Or, this film might not exist or its layout is missing.</p>
            <Link href="/" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <LayoutProvider key={filmId}> 
       <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 text-foreground">
        <div className="p-4 md:p-6 sticky top-0 bg-background/80 backdrop-blur-md z-50 shadow-sm">
            <Link href="/" passHref>
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Button>
            </Link>
        </div>
        <FilmTicketBookingInterface film={film} initialLayout={layoutToLoad} />
       </div>
    </LayoutProvider>
  );
}
