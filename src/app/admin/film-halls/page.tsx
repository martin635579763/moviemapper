
"use client";

import type { NextPage } from 'next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { getSampleFilmsWithDynamicSchedules, type Film, type ScheduleEntry } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ListVideo, Save, CalendarDays, Clock, Building2 } from 'lucide-react'; // Changed Building to Building2

const LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY = 'filmHallPreferences_v1';
type FilmHallPreferences = Record<string, string[]>; // filmId: hallName[]

const FilmHallConfigPage: NextPage = () => {
  const { isManager } = useAuthContext();
  const { storedLayoutNames, refreshStoredLayoutNames } = useLayoutContext();
  const { toast } = useToast();
  const router = useRouter();

  const [allFilmsData, setAllFilmsData] = useState<Film[]>([]); // Stores films with their dynamic schedules
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [currentFilmPreferences, setCurrentFilmPreferences] = useState<string[]>([]);
  const [allHallPreferences, setAllHallPreferences] = useState<FilmHallPreferences>({});
  const [selectedFilmSchedule, setSelectedFilmSchedule] = useState<ScheduleEntry[] | undefined>(undefined);

  const fetchAllFilmsWithSchedules = useCallback(() => {
    const filmsWithSchedules = getSampleFilmsWithDynamicSchedules();
    setAllFilmsData(filmsWithSchedules);
    return filmsWithSchedules;
  }, []);

  useEffect(() => {
    if (!isManager) {
      router.replace('/');
    }
  }, [isManager, router]);
  
  useEffect(() => {
    refreshStoredLayoutNames();
    fetchAllFilmsWithSchedules();

    if (typeof window !== 'undefined') {
      try {
        const prefsJson = localStorage.getItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY);
        setAllHallPreferences(prefsJson ? JSON.parse(prefsJson) : {});
      } catch (e) {
        console.error("Error reading film hall preferences from localStorage:", e);
        setAllHallPreferences({});
      }
    }
  }, [isManager, refreshStoredLayoutNames, fetchAllFilmsWithSchedules]);

  useEffect(() => {
    if (selectedFilmId) {
      setCurrentFilmPreferences(allHallPreferences[selectedFilmId] || []);
      const filmData = allFilmsData.find(f => f.id === selectedFilmId);
      setSelectedFilmSchedule(filmData?.schedule);
    } else {
      setCurrentFilmPreferences([]);
      setSelectedFilmSchedule(undefined);
    }
  }, [selectedFilmId, allHallPreferences, allFilmsData]);

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
      setAllHallPreferences(newAllPrefs); 
      
      // Re-fetch films to update schedule display based on new preferences
      const updatedFilms = fetchAllFilmsWithSchedules();
      const updatedSelectedFilm = updatedFilms.find(f => f.id === selectedFilmId);
      setSelectedFilmSchedule(updatedSelectedFilm?.schedule);

      toast({ title: "Preferences Saved", description: `Hall preferences for the selected film have been updated.` });
    } catch (e) {
      console.error("Error saving film hall preferences to localStorage:", e);
      toast({ title: "Error", description: "Could not save preferences.", variant: "destructive" });
    }
  };
  
  const selectedFilm = useMemo(() => allFilmsData.find(f => f.id === selectedFilmId), [allFilmsData, selectedFilmId]);

  const groupedSchedule = useMemo(() => {
    if (!selectedFilmSchedule || selectedFilmSchedule.length === 0) return {};
    return selectedFilmSchedule.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {} as Record<string, ScheduleEntry[]>);
  }, [selectedFilmSchedule]);

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
            Select a film, choose preferred halls, and view the generated schedule.
            If no halls are selected, all saved halls will be considered for that film.
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
                {allFilmsData.map(film => ( // Use allFilmsData which includes schedules
                  <SelectItem key={film.id} value={film.id} className="text-base py-2">
                    {film.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFilm && (
            <>
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

              <Card className="p-6 bg-muted/20 border-secondary/30 mt-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-2xl text-secondary-foreground">
                    Current Generated Schedule for: <span className="font-bold">{selectedFilm.title}</span>
                  </CardTitle>
                  <CardDescription>
                    This is how the schedule will appear based on your current hall preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {Object.keys(groupedSchedule).length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {Object.entries(groupedSchedule).map(([day, entries]) => (
                        <div key={day}>
                          <h4 className="font-semibold mb-2 text-md flex items-center text-primary">
                            <CalendarDays className="w-4 h-4 mr-2" /> {day}
                          </h4>
                          <ul className="space-y-1.5 pl-1">
                            {entries.map((entry, idx) => (
                              <li key={idx} className="flex items-center text-xs p-2 bg-card rounded-md shadow-sm">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                <span className="font-medium text-foreground mr-2">{entry.time}</span>
                                <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                                <span className="text-foreground">{entry.hallName}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No schedule generated for this film with the current hall preferences and availability.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilmHallConfigPage;

    