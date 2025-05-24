
"use client";

import type { NextPage } from 'next';
import { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { getSampleFilmsWithDynamicSchedules, type Film } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ListVideo, Save } from 'lucide-react';

const LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY = 'filmHallPreferences_v1';
type FilmHallPreferences = Record<string, string[]>; // filmId: hallName[]

const FilmHallConfigPage: NextPage = () => {
  const { isManager } = useAuthContext();
  const { storedLayoutNames, refreshStoredLayoutNames } = useLayoutContext();
  const { toast } = useToast();
  const router = useRouter();

  const [films, setFilms] = useState<Film[]>([]);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [currentFilmPreferences, setCurrentFilmPreferences] = useState<string[]>([]);
  const [allHallPreferences, setAllHallPreferences] = useState<FilmHallPreferences>({});

  useEffect(() => {
    if (!isManager) {
      router.replace('/');
    }
  }, [isManager, router]);
  
  useEffect(() => {
    refreshStoredLayoutNames(); // Ensure we have the latest list of saved halls
    setFilms(getSampleFilmsWithDynamicSchedules()); // Get base film data

    if (typeof window !== 'undefined') {
      try {
        const prefsJson = localStorage.getItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY);
        setAllHallPreferences(prefsJson ? JSON.parse(prefsJson) : {});
      } catch (e) {
        console.error("Error reading film hall preferences from localStorage:", e);
        setAllHallPreferences({});
      }
    }
  }, [isManager, refreshStoredLayoutNames]);

  useEffect(() => {
    if (selectedFilmId) {
      setCurrentFilmPreferences(allHallPreferences[selectedFilmId] || []);
    } else {
      setCurrentFilmPreferences([]);
    }
  }, [selectedFilmId, allHallPreferences]);

  const handleFilmSelect = (filmId: string) => {
    setSelectedFilmId(filmId);
  };

  const handleHallPreferenceChange = (hallName: string, checked: boolean) => {
    setCurrentFilmPreferences(prev => {
      if (checked) {
        return [...prev, hallName];
      } else {
        return prev.filter(name => name !== hallName);
      }
    });
  };

  const handleSaveChanges = () => {
    if (!selectedFilmId) {
      toast({ title: "Error", description: "Please select a film first.", variant: "destructive" });
      return;
    }
    const newAllPrefs = { ...allHallPreferences, [selectedFilmId]: currentFilmPreferences };
    try {
      localStorage.setItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY, JSON.stringify(newAllPrefs));
      setAllHallPreferences(newAllPrefs); // Update local state to reflect saved changes
      toast({ title: "Preferences Saved", description: `Hall preferences for the selected film have been updated.` });
    } catch (e) {
      console.error("Error saving film hall preferences to localStorage:", e);
      toast({ title: "Error", description: "Could not save preferences.", variant: "destructive" });
    }
  };
  
  const selectedFilm = useMemo(() => films.find(f => f.id === selectedFilmId), [films, selectedFilmId]);

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You must be a manager to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <ListVideo className="mr-3 h-8 w-8" />
            Configure Film Hall Preferences
          </CardTitle>
          <CardDescription>
            Select a film and then choose which saved hall layouts can be used for its dynamic schedule generation.
            If no halls are selected for a film, all currently saved halls will be considered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="film-select" className="text-lg font-semibold mb-2 block">Select Film:</Label>
            <Select onValueChange={handleFilmSelect} value={selectedFilmId || ""}>
              <SelectTrigger id="film-select" className="w-full md:w-[400px] text-base py-3">
                <SelectValue placeholder="Choose a film..." />
              </SelectTrigger>
              <SelectContent>
                {films.map(film => (
                  <SelectItem key={film.id} value={film.id} className="text-base py-2">
                    {film.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFilm && (
            <Card className="p-6 bg-muted/30 border-primary/20">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl text-primary">
                  Available Halls for: <span className="font-bold">{selectedFilm.title}</span>
                </CardTitle>
                <CardDescription>
                  Check the halls you want to be available for this film's schedule.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {storedLayoutNames.length === 0 ? (
                  <p className="text-muted-foreground">No saved hall layouts found. Please save some layouts in the editor.</p>
                ) : (
                  <div className="space-y-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storedLayoutNames.map(hallName => (
                      <div key={hallName} className="flex items-center space-x-2 p-3 bg-card rounded-md shadow-sm hover:shadow-md transition-shadow">
                        <Checkbox
                          id={`hall-${hallName}-${selectedFilm.id}`}
                          checked={currentFilmPreferences.includes(hallName)}
                          onCheckedChange={(checked) => handleHallPreferenceChange(hallName, !!checked)}
                        />
                        <Label htmlFor={`hall-${hallName}-${selectedFilm.id}`} className="text-sm font-medium cursor-pointer">
                          {hallName}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                 <Button onClick={handleSaveChanges} className="mt-6 w-full sm:w-auto" size="lg">
                  <Save className="mr-2 h-5 w-5" />
                  Save Preferences for {selectedFilm.title}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilmHallConfigPage;
