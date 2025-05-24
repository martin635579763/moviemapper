
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LayoutProvider, useLayoutContext } from '@/contexts/LayoutContext';
import { LayoutPreview } from '@/components/LayoutPreview';
import { sampleFilms, type Film } from '@/data/films';
import { sampleLayouts } from '@/data/sample-layouts';
import type { HallLayout } from '@/types/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Ticket as TicketIconLucide, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const generateDataAiHint = (genre: string): string => {
  return genre.toLowerCase().split(',').map(g => g.trim().replace(/\s+/g, '')).slice(0, 2).join(' ') || "movie";
};

// This component will consume the LayoutContext
const FilmTicketBookingInterface: React.FC<{ film: Film; initialLayout: HallLayout; initialHallNameOverride: string | null }> = ({ film, initialLayout, initialHallNameOverride }) => {
  const { loadLayout, layout, getStoredLayoutNames, loadLayoutFromStorage, clearSeatSelection } = useLayoutContext();
  const [availableLayoutNames, setAvailableLayoutNames] = useState<string[]>([]);

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
    // Clear selections when the layout changes or component initializes
    if (typeof clearSeatSelection === 'function') clearSeatSelection();
  }, [initialLayout, initialHallNameOverride, loadLayout, loadLayoutFromStorage, clearSeatSelection]);

  useEffect(() => {
    const sampleNames = sampleLayouts.map(l => l.name);
    const storedNames = getStoredLayoutNames();
    const allNames = Array.from(new Set([...sampleNames, ...storedNames]));
    setAvailableLayoutNames(allNames.sort());
  }, [getStoredLayoutNames]);


  const handleHallSelectionChange = (selectedLayoutName: string) => {
    if (!selectedLayoutName || (layout && selectedLayoutName === layout.name)) return;

    const sampleLayoutToLoad = sampleLayouts.find(sl => sl.name === selectedLayoutName);
    if (sampleLayoutToLoad) {
      loadLayout(JSON.parse(JSON.stringify(sampleLayoutToLoad))); // Deep copy
    } else {
      loadLayoutFromStorage(selectedLayoutName);
    }
    // Clear selections when hall changes
     if (typeof clearSeatSelection === 'function') clearSeatSelection();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Film Details Section */}
      <Card className="xl:w-1/3 shadow-xl rounded-lg overflow-hidden flex flex-col">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[2/3]">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint="movie poster"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow">
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
          <p className="text-foreground text-base leading-relaxed mb-6">{film.description}</p>
          
          {/* Removed "More Images" gallery section */}
        </CardContent>
      </Card>

      {/* Seat Selection Section */}
      <div className="xl:w-2/3 flex flex-col">
        <div className="mb-4">
            <h2 className="text-2xl font-semibold text-primary mb-1">Select Your Seats</h2>
            {layout && (
              <p className="text-muted-foreground mb-3">
                Viewing seat layout for <span className="font-semibold text-foreground">{layout.name}</span>. Choose available seats below.
              </p>
            )}
             {availableLayoutNames.length > 0 && (
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
                    {availableLayoutNames.map(name => (
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
  
  const filmData = useMemo(() => {
    if (!filmId) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    const currentFilm = sampleFilms.find(f => f.id === filmId);
    if (!currentFilm) return { film: undefined, layoutToLoad: undefined, initialHallNameOverride: null };
    
    let layoutToLoad: HallLayout | undefined = undefined;
    let initialHallNameOverrideForInterface: string | null = hallNameFromQuery ? decodeURIComponent(hallNameFromQuery) : null;

    if (initialHallNameOverrideForInterface) {
      layoutToLoad = sampleLayouts.find(l => l.name === initialHallNameOverrideForInterface);
    }

    if (!layoutToLoad && currentFilm.associatedLayoutName) {
      layoutToLoad = sampleLayouts.find(l => l.name === currentFilm.associatedLayoutName);
    }

    if (!layoutToLoad) { 
      layoutToLoad = sampleLayouts[0];
      if (initialHallNameOverrideForInterface && layoutToLoad.name === initialHallNameOverrideForInterface) {
        initialHallNameOverrideForInterface = null;
      }
    } else if (layoutToLoad && initialHallNameOverrideForInterface && layoutToLoad.name !== initialHallNameOverrideForInterface) {
      // A sample layout was found matching the query param, so no need for storage override.
      // Keep initialHallNameOverrideForInterface as it might be for a stored layout.
    } else if (layoutToLoad && initialHallNameOverrideForInterface && layoutToLoad.name === initialHallNameOverrideForInterface) {
      // The initialHallNameOverride matches the loaded sample layout.
      initialHallNameOverrideForInterface = null;
    }
    
    return { film: currentFilm, layoutToLoad: layoutToLoad!, initialHallNameOverride: initialHallNameOverrideForInterface };
  }, [filmId, hallNameFromQuery]);

  const { film, layoutToLoad, initialHallNameOverride } = filmData;

  if (!filmId) {
    return <div className="text-center py-20 text-xl text-destructive-foreground">Film ID is missing.</div>;
  }

  if (!film || !layoutToLoad) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <TicketIconLucide className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <h1 className="text-2xl font-semibold mb-2">Loading Film Details...</h1>
            <p className="text-muted-foreground mb-6">Or, this film might not exist or its layout is missing.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <LayoutProvider key={`${filmId}-${hallNameFromQuery || layoutToLoad.name}`}> 
       <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 text-foreground">
        <div className="p-4 md:p-6 sticky top-0 bg-background/80 backdrop-blur-md z-50 shadow-sm">
            <Button asChild variant="ghost" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Films
                </Link>
            </Button>
        </div>
        <FilmTicketBookingInterface film={film} initialLayout={layoutToLoad} initialHallNameOverride={initialHallNameOverride} />
       </div>
    </LayoutProvider>
  );
}

export default function FilmPage() {
  // Suspense is needed because useSearchParams() might suspend.
  return (
    <Suspense fallback={<div>Loading film page...</div>}>
      <FilmPageContent />
    </Suspense>
  );
}
