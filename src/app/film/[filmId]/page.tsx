
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LayoutProvider, useLayoutContext } from '@/contexts/LayoutContext';
import { LayoutPreview } from '@/components/LayoutPreview';
import { sampleFilms, type Film } from '@/data/films';
import { sampleLayouts } from '@/data/sample-layouts';
import type { HallLayout } from '@/types/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Ticket as TicketIconLucide, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FilmTicketBookingInterfaceProps {
  film: Film;
  initialLayout: HallLayout;
  initialHallNameOverride: string | null;
  selectedDay: string | null;
  selectedTime: string | null;
}

const FilmTicketBookingInterface: React.FC<FilmTicketBookingInterfaceProps> = ({ film, initialLayout, initialHallNameOverride, selectedDay, selectedTime }) => {
  const { layout, loadLayout, loadLayoutFromStorage, clearSeatSelection, storedLayoutNames } = useLayoutContext();
  
  const allAvailableLayoutNamesForDropdown = useMemo(() => {
      const sampleNames = sampleLayouts.map(l => l.name);
      const combinedNames = Array.from(new Set([...sampleNames, ...(storedLayoutNames || [])]));
      return combinedNames.sort();
  }, [storedLayoutNames]);

  useEffect(() => {
    if (initialHallNameOverride) {
      const sampleOverride = sampleLayouts.find(l => l.name === initialHallNameOverride);
      if (sampleOverride) {
        loadLayout(JSON.parse(JSON.stringify(sampleOverride)));
      } else {
        loadLayoutFromStorage(initialHallNameOverride);
      }
    } else if (initialLayout) {
       loadLayout(JSON.parse(JSON.stringify(initialLayout))); // Deep copy
    }
    if (typeof clearSeatSelection === 'function') clearSeatSelection();
  }, [initialLayout, initialHallNameOverride, loadLayout, loadLayoutFromStorage, clearSeatSelection]);


  const handleHallSelectionChange = (selectedLayoutName: string) => {
    if (!selectedLayoutName || (layout && selectedLayoutName === layout.name)) return;

    const sampleLayoutToLoad = sampleLayouts.find(sl => sl.name === selectedLayoutName);
    if (sampleLayoutToLoad) {
      loadLayout(JSON.parse(JSON.stringify(sampleLayoutToLoad))); 
    } else {
      loadLayoutFromStorage(selectedLayoutName);
    }
     if (typeof clearSeatSelection === 'function') clearSeatSelection();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Film Details Section - Smaller Poster */}
      <Card className="xl:w-[380px] shrink-0 shadow-xl rounded-lg overflow-hidden flex flex-col self-start">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[2/3]">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 420px) 100vw, 380px" 
              className="object-cover"
              data-ai-hint="movie poster"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow">
          <CardTitle className="text-xl md:text-2xl font-bold mb-2">{film.title}</CardTitle>
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
          <p className="text-foreground text-sm leading-relaxed">{film.description}</p>
        </CardContent>
      </Card>

      {/* Seat Selection & Booking Info Section */}
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
          </CardContent>
        </Card>
        
        <div className="mb-4">
            <h2 className="text-2xl font-semibold text-primary mb-1">Select Your Seats</h2>
             {allAvailableLayoutNamesForDropdown.length > 0 && (
              <div className="mb-4 max-w-xs">
                <Label htmlFor="hall-select" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Change Hall Layout:
                </Label>
                <Select
                  value={layout?.name || ""}
                  onValueChange={handleHallSelectionChange}
                >
                  <SelectTrigger id="hall-select" className="w-full">
                    <SelectValue placeholder="Select a hall layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAvailableLayoutNamesForDropdown.map(name => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>
        <div className="flex-grow mt-1 rounded-lg overflow-hidden shadow-md">
          <div className="h-full min-h-[400px] lg:min-h-[500px] flex flex-col">
             <LayoutPreview />
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
  
  const filmData = useMemo(() => {
    if (!filmId) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    const currentFilm = sampleFilms.find(f => f.id === filmId);
    if (!currentFilm) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    
    let layoutToLoad: HallLayout | undefined = undefined;
    let initialHallNameOverrideForInterface: string | null = hallNameFromQuery ? decodeURIComponent(hallNameFromQuery) : null;

    if (initialHallNameOverrideForInterface) {
      layoutToLoad = sampleLayouts.find(l => l.name === initialHallNameOverrideForInterface);
      // If not found in samples, initialHallNameOverrideForInterface will be passed to FilmTicketBookingInterface
      // which will then try to load it from storage.
    }

    if (!layoutToLoad && currentFilm.associatedLayoutName) {
      layoutToLoad = sampleLayouts.find(l => l.name === currentFilm.associatedLayoutName);
    }

    if (!layoutToLoad && !initialHallNameOverrideForInterface) { 
      // Fallback to default if no specific hall from query and no associated layout found (or no associatedLayoutName)
      layoutToLoad = sampleLayouts[0];
    }
    // If layoutToLoad is still undefined here, it means a hall was specified in query,
    // it wasn't a sample, so it should be loaded from storage by FilmTicketBookingInterface.
    // In this case, we pass initialLayout as undefined (or the default if no query)
    // and let initialHallNameOverrideForInterface drive the loading in the child component.
    
    return { 
      film: currentFilm, 
      layoutToLoad: layoutToLoad, // Can be undefined if initialHallNameOverride is set for a stored layout
      initialHallNameOverride: initialHallNameOverrideForInterface 
    };
  }, [filmId, hallNameFromQuery]);

  const { film, layoutToLoad, initialHallNameOverride } = filmData;

  if (!filmId) {
    return <div className="text-center py-20 text-xl text-destructive-foreground">Film ID is missing.</div>;
  }

  if (!film) { // We allow layoutToLoad to be undefined if an override is present
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <TicketIconLucide className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <h1 className="text-2xl font-semibold mb-2">Loading Film Details...</h1>
            <p className="text-muted-foreground mb-6">Or, this film might not exist.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Link>
            </Button>
        </div>
    );
  }

  // Determine a fallback layout if both layoutToLoad (from samples/association) is undefined 
  // AND initialHallNameOverride is not set. This ensures FilmTicketBookingInterface always gets an initialLayout.
  const finalInitialLayout = layoutToLoad || (initialHallNameOverride ? sampleLayouts[0] : sampleLayouts[0]);


  return (
    // Ensure LayoutProvider re-mounts if hallNameFromQuery changes, ensuring FilmTicketBookingInterface re-initializes
    <LayoutProvider key={`${filmId}-${hallNameFromQuery || film.associatedLayoutName || 'defaultHall'}-${dayFromQuery}-${timeFromQuery}`}> 
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
          initialLayout={finalInitialLayout!} 
          initialHallNameOverride={initialHallNameOverride}
          selectedDay={dayFromQuery ? decodeURIComponent(dayFromQuery) : null}
          selectedTime={timeFromQuery ? decodeURIComponent(timeFromQuery) : null}
        />
       </div>
    </LayoutProvider>
  );
}

export default function FilmPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading film page details...</div>}>
      <FilmPageContent />
    </Suspense>
  );
}
