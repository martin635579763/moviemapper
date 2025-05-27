
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LayoutProvider, useLayoutContext } from '@/contexts/LayoutContext';
import { LayoutPreview } from '@/components/LayoutPreview';
import { getSampleFilmsWithDynamicSchedules, type Film } from '@/data/films'; 
import { sampleLayouts } from '@/data/sample-layouts';
import type { HallLayout } from '@/types/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Ticket as TicketIconLucide, Info, Loader2 } from 'lucide-react';

interface FilmTicketBookingInterfaceProps {
  film: Film;
  initialLayout: HallLayout | undefined; 
  initialHallNameOverride: string | null;
  selectedDay: string | null;
  selectedTime: string | null;
}

const FilmTicketBookingInterface: React.FC<FilmTicketBookingInterfaceProps> = ({ film, initialLayout, initialHallNameOverride, selectedDay, selectedTime }) => {
  const { layout, loadLayout, isLoadingLayouts } = useLayoutContext();
  
  useEffect(() => {
    const loadInitial = async () => {
      let layoutIdentifier: HallLayout | string | null = null;
      let hallNameForSoldSeatsLookup = initialLayout?.name || initialHallNameOverride || "";

      if (initialHallNameOverride) {
        layoutIdentifier = initialHallNameOverride; // loadLayout will check samples first, then storage
      } else if (initialLayout) {
         layoutIdentifier = initialLayout; // This is likely a sample layout object
      }
      
      // Pass filmId, day, time for sold seats lookup
      await loadLayout(layoutIdentifier, film.id, selectedDay, selectedTime);
    };
    loadInitial();
  }, [initialLayout, initialHallNameOverride, loadLayout, film.id, selectedDay, selectedTime]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
      <Card className="xl:w-[320px] shrink-0 shadow-xl rounded-lg overflow-hidden flex flex-col self-start">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[2/3]">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 320px) 100vw, 320px"
              className="object-cover"
              data-ai-hint="movie poster"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-5 flex-grow">
          <CardTitle className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">{film.title}</CardTitle>
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              <span>{film.genre}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              <span>{film.duration}</span>
            </div>
          </div>
          <p className="text-foreground text-sm leading-relaxed line-clamp-5">{film.description}</p>
        </CardContent>
      </Card>

      <div className="flex-grow flex flex-col">
        <Card className="mb-4 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Booking Confirmation</CardTitle>
            <CardDescription>Please review your selection details below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Film:</strong> {film.title}</p>
            {selectedDay && selectedTime && (
              <p><strong>Date & Time:</strong> {selectedDay}, {selectedTime}</p>
            )}
            {layout && <p><strong>Hall:</strong> {layout.name}</p>}
             {isLoadingLayouts && <p className="text-sm text-muted-foreground">Loading hall details...</p>}
          </CardContent>
        </Card>
        
        <div className="mb-4">
            <h2 className="text-2xl font-semibold text-primary mb-1">Select Your Seats</h2>
            <p className="text-sm text-muted-foreground">The layout for <strong>{layout?.name || 'the selected hall'}</strong> is shown below.</p>
        </div>
        <div className="flex-grow mt-1 rounded-lg overflow-hidden shadow-md">
          <div className="h-full min-h-[400px] lg:min-h-[500px] flex flex-col">
             {/* Pass film, selectedDay, selectedTime to LayoutPreview */}
             <LayoutPreview film={film} selectedDay={selectedDay} selectedTime={selectedTime} />
          </div>
        </div>
      </div>
    </div>
  );
};

function FilmPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const filmId = params?.filmId as string;
  const hallNameFromQuery = searchParams.get('hall');
  const dayFromQuery = searchParams.get('day');
  const timeFromQuery = searchParams.get('time');

  const [allFilms, setAllFilms] = useState<Film[]>([]);
  
  useEffect(() => {
    const loadFilms = async () => {
      const films = await getSampleFilmsWithDynamicSchedules();
      setAllFilms(films);
    };
    loadFilms();
  }, []);
  
  const filmData = useMemo(() => {
    if (!filmId || allFilms.length === 0) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    
    const currentFilm = allFilms.find(f => f.id === filmId);
    if (!currentFilm) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    
    let layoutToLoad: HallLayout | undefined = undefined;
    let initialHallNameOverrideForInterface: string | null = hallNameFromQuery ? decodeURIComponent(hallNameFromQuery) : null;

    // If a specific hall is in the query, try to find it in samples first
    if (initialHallNameOverrideForInterface) {
      layoutToLoad = sampleLayouts.find(l => l.name === initialHallNameOverrideForInterface);
    }

    // If not found in samples and no query override, use film's associated layout (if any) from samples
    if (!layoutToLoad && !initialHallNameOverrideForInterface && currentFilm.associatedLayoutName) {
      layoutToLoad = sampleLayouts.find(l => l.name === currentFilm.associatedLayoutName);
      if (layoutToLoad) { // If found associated layout, use its name as override if no query param
          initialHallNameOverrideForInterface = layoutToLoad.name;
      }
    }
    
    // layoutToLoad will be the sample layout object if found, otherwise undefined.
    // initialHallNameOverrideForInterface will be the name from query, or film's associated, or null.
    // The FilmTicketBookingInterface prioritizes initialHallNameOverride for storage lookup if layoutToLoad (sample) is not found.
    return { 
      film: currentFilm, 
      layoutToLoad: layoutToLoad, // This will be a sample layout object or undefined
      initialHallNameOverride: layoutToLoad ? null : initialHallNameOverrideForInterface // If we have a sample, don't override with name
    };
  }, [filmId, hallNameFromQuery, allFilms, sampleLayouts]); // Added sampleLayouts dependency

  const { film, layoutToLoad, initialHallNameOverride } = filmData;

  if (!filmId) {
    return <div className="text-center py-20 text-xl text-destructive-foreground">Film ID is missing.</div>;
  }
  
  if (allFilms.length === 0) {
     return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <Loader2 className="w-16 h-16 text-primary mb-4 animate-spin" />
            <h1 className="text-2xl font-semibold mb-2">Loading Film Data...</h1>
        </div>
    );
  }

  if (!film) { 
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <TicketIconLucide className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <h1 className="text-2xl font-semibold mb-2">Film Not Found</h1>
            <p className="text-muted-foreground mb-6">The film you are looking for does not exist or the schedule is being updated.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Link>
            </Button>
        </div>
    );
  }
  
  const finalInitialLayoutProp = layoutToLoad; // layoutToLoad is already the specific sample HallLayout or undefined

  return (
    // Key ensures LayoutProvider re-mounts if filmId, specific hall (from query), day or time changes,
    // providing a fresh context for each distinct booking scenario.
    <LayoutProvider key={`${filmId}-${hallNameFromQuery || film.associatedLayoutName || 'defaultLayoutKey'}-${dayFromQuery}-${timeFromQuery}`}> 
       <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 text-foreground">
        <div className="p-4 md:p-6 sticky top-0 bg-background/80 backdrop-blur-md z-50 shadow-sm">
            <Button asChild variant="ghost" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Link>
            </Button>
        </div>
        <FilmTicketBookingInterface 
          film={film} 
          initialLayout={finalInitialLayoutProp} // This is the sample layout object or undefined
          initialHallNameOverride={initialHallNameOverride} // This is a string name (from query or film's association if not a sample) or null
          selectedDay={dayFromQuery ? decodeURIComponent(dayFromQuery) : null}
          selectedTime={timeFromQuery ? decodeURIComponent(timeFromQuery) : null}
        />
       </div>
    </LayoutProvider>
  );
}

export default function FilmPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen text-lg">Loading film page details...</div>}>
      <FilmPageContent />
    </Suspense>
  );
}
