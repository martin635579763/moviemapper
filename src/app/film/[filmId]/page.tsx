
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { LayoutProvider, useLayoutContext } from '@/contexts/LayoutContext';
import { LayoutPreview } from '@/components/LayoutPreview';
import { sampleFilms, type Film } from '@/data/films';
import { sampleLayouts } from '@/data/sample-layouts';
import type { HallLayout } from '@/types/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Ticket as TicketIconLucide } from 'lucide-react'; // Removed ChevronDown as it's not used directly here.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// This component will consume the LayoutContext
const FilmTicketBookingInterface: React.FC<{ film: Film; initialLayout: HallLayout }> = ({ film, initialLayout }) => {
  const { loadLayout, layout, clearSeatSelection, getStoredLayoutNames, loadLayoutFromStorage } = useLayoutContext();
  const [availableLayoutNames, setAvailableLayoutNames] = useState<string[]>([]);

  useEffect(() => {
    // This effect now primarily runs when initialLayout (i.e., the film) changes.
    // It loads the film's default layout. Subsequent user selections via the dropdown
    // will change layout in context but won't cause this effect to revert the choice,
    // as initialLayout and loadLayout (the function) won't have changed.
    if (initialLayout) {
       loadLayout(JSON.parse(JSON.stringify(initialLayout))); // Deep copy
    }
  }, [initialLayout, loadLayout]); // Removed `layout` from dependencies

  useEffect(() => {
    const sampleNames = sampleLayouts.map(l => l.name);
    const storedNames = getStoredLayoutNames();
    // Combine and remove duplicates
    const allNames = Array.from(new Set([...sampleNames, ...storedNames]));
    setAvailableLayoutNames(allNames.sort());
  }, [getStoredLayoutNames]);


  const handleHallSelectionChange = (selectedLayoutName: string) => {
    if (!selectedLayoutName || (layout && selectedLayoutName === layout.name)) return;

    const sampleLayoutToLoad = sampleLayouts.find(sl => sl.name === selectedLayoutName);
    if (sampleLayoutToLoad) {
      loadLayout(JSON.parse(JSON.stringify(sampleLayoutToLoad))); // Deep copy
    } else {
      // If not a sample layout, assume it's a stored layout
      loadLayoutFromStorage(selectedLayoutName);
    }
    clearSeatSelection();
  };

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
              data-ai-hint={film.genre.split(',')[0].toLowerCase().replace(/\s+/g, '') || "movie"}
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
    const layoutToLoad = associatedLayout || sampleLayouts[0]; // Fallback to first sample layout

    return { film: currentFilm, layoutToLoad: layoutToLoad };
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
