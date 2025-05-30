
"use client";

import type { NextPage } from 'next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { getSampleFilmsWithDynamicSchedules, type Film, type ScheduleEntry, DAYS_FOR_GENERATION, POSSIBLE_TIMES_FOR_GENERATION } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ListVideo, Save, CalendarDays, Clock, Building2, Trash2, PlusCircle, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import type { FilmHallPreferences, UserDefinedFilmSchedules } from '@/types/schedule';
import { 
  getAllFilmHallPreferencesService, 
  saveAllFilmHallPreferencesService,
  getAllUserDefinedFilmSchedulesService,
  saveAllUserDefinedFilmSchedulesService
} from '@/services/scheduleService';


const FilmHallConfigPage: NextPage = () => {
  const { user, isManager, loadingAuth } = useAuthContext();
  const { storedLayoutNames, refreshStoredLayoutNames } = useLayoutContext(); 
  const { toast } = useToast();
  const router = useRouter();

  const [allFilmsData, setAllFilmsData] = useState<Film[]>([]);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  
  const [currentFilmHallPreferences, setCurrentFilmHallPreferences] = useState<string[]>([]); 
  const [allHallPreferences, setAllHallPreferences] = useState<FilmHallPreferences>({}); 

  const [editableSchedule, setEditableSchedule] = useState<ScheduleEntry[]>([]); 
  const [newShowtimeDay, setNewShowtimeDay] = useState<string>(DAYS_FOR_GENERATION[0]);
  const [newShowtimeTime, setNewShowtimeTime] = useState<string>(POSSIBLE_TIMES_FOR_GENERATION[0]);
  const [newShowtimeHall, setNewShowtimeHall] = useState<string>(""); 

  useEffect(() => {
    if (!loadingAuth && !isManager) {
      router.replace('/');
    }
  }, [isManager, loadingAuth, router]);
  
  useEffect(() => {
    if (!loadingAuth && isManager) {
      console.log("[ADMIN_PAGE_EFFECT] Manager detected. Fetching initial data.");
      refreshStoredLayoutNames(); 
      
      const fetchInitialAdminData = async () => {
        try {
          const films = await getSampleFilmsWithDynamicSchedules();
          console.log("[ADMIN_PAGE_EFFECT] Films received:", films);
          if (Array.isArray(films)) {
            setAllFilmsData(films);
          } else {
            console.error("[ADMIN_PAGE_EFFECT] CRITICAL: getSampleFilmsWithDynamicSchedules did NOT return an array. Received:", films, "Type:", typeof films);
            setAllFilmsData([]); 
          }

          const loadedPrefs = await getAllFilmHallPreferencesService();
          setAllHallPreferences(loadedPrefs);
          console.log("[ADMIN_PAGE_EFFECT] Loaded allHallPreferences from service:", loadedPrefs);

        } catch (error) {
          console.error("[ADMIN_PAGE_EFFECT] CRITICAL: Error fetching initial admin data:", error);
          setAllFilmsData([]); 
          setAllHallPreferences({});
          toast({ title: "Error", description: "Could not load initial admin data.", variant: "destructive"});
        }
      };
      fetchInitialAdminData();

    } else if (!loadingAuth && !isManager) {
      console.log("[ADMIN_PAGE_EFFECT] Not a manager or manager status changed to false. Clearing film data.");
      setAllFilmsData([]); 
      setAllHallPreferences({});
    }
  }, [isManager, loadingAuth, refreshStoredLayoutNames, toast]);
  

  useEffect(() => {
    const updateUIForSelectedFilm = async () => {
      if (selectedFilmId && Array.isArray(allFilmsData) && allFilmsData.length > 0) {
        console.log("[ADMIN_PAGE] Selected film ID:", selectedFilmId);
        setCurrentFilmHallPreferences(allHallPreferences[selectedFilmId] || []);
        console.log("[ADMIN_PAGE] Set currentFilmHallPreferences for selected film:", allHallPreferences[selectedFilmId] || []);
        
        const filmData = allFilmsData.find(f => f.id === selectedFilmId); 
        console.log("[ADMIN_PAGE] Found filmData for selected film (used for schedule display):", filmData);
        
        const allUserSchedules = await getAllUserDefinedFilmSchedulesService();
        const userScheduleForSelectedFilm = allUserSchedules[selectedFilmId];

        if (userScheduleForSelectedFilm) {
          setEditableSchedule([...userScheduleForSelectedFilm]);
          console.log("[ADMIN_PAGE] Set editableSchedule from user-defined for selected film:", userScheduleForSelectedFilm);
        } else if (filmData?.schedule) {
          setEditableSchedule([...filmData.schedule]); 
          console.log("[ADMIN_PAGE] Set editableSchedule from default dynamic for selected film:", filmData.schedule);
        } else {
          setEditableSchedule([]);
          console.log("[ADMIN_PAGE] No schedule found for selected film, cleared editableSchedule.");
        }
      } else if (!selectedFilmId) { 
        setCurrentFilmHallPreferences([]);
        setEditableSchedule([]);
        console.log("[ADMIN_PAGE] No film selected, cleared preferences and schedule.");
      }
    };
    updateUIForSelectedFilm();
  }, [selectedFilmId, allFilmsData, allHallPreferences]); 

  useEffect(() => {
    if (storedLayoutNames.length > 0) {
      if (!newShowtimeHall || !storedLayoutNames.includes(newShowtimeHall)) {
        setNewShowtimeHall(storedLayoutNames[0]);
        console.log("[ADMIN_PAGE] Defaulted newShowtimeHall to:", storedLayoutNames[0]);
      }
    } else {
      setNewShowtimeHall("");
      console.log("[ADMIN_PAGE] No stored layout names, cleared newShowtimeHall.");
    }
  }, [storedLayoutNames, newShowtimeHall]); 

  const handleFilmSelect = (filmId: string) => {
    setSelectedFilmId(filmId);
    if (storedLayoutNames.length > 0) {
      setNewShowtimeHall(storedLayoutNames[0]);
    } else {
      setNewShowtimeHall("");
    }
  };

  const handleHallPreferenceChange = (hallName: string, checked: boolean) => {
    setCurrentFilmHallPreferences(prev => {
      const newPrefs = checked ? [...prev, hallName] : prev.filter(name => name !== hallName);
      console.log(`[ADMIN_PAGE] Hall preference change for ${hallName}, checked: ${checked}. New currentFilmHallPreferences:`, newPrefs);
      return newPrefs;
    });
  };

  const selectedFilm = useMemo(() => {
    if (!Array.isArray(allFilmsData)) {
      console.warn("[ADMIN_PAGE] allFilmsData is not an array in selectedFilm useMemo. Value:", allFilmsData);
      return undefined;
    }
    return allFilmsData.find(f => f.id === selectedFilmId);
  }, [allFilmsData, selectedFilmId]);

  const handleSaveHallPreferences = async () => {
    if (!selectedFilmId) {
      toast({ title: "Error", description: "Please select a film first.", variant: "destructive" });
      return;
    }
    const newAllPrefs = { ...allHallPreferences, [selectedFilmId]: currentFilmHallPreferences };
    const result = await saveAllFilmHallPreferencesService(newAllPrefs);
    
    toast({ 
      title: result.success ? "Preferences Saved" : "Error Saving Preferences", 
      description: result.success ? `Hall preferences for '${selectedFilm?.title}' updated.` : result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      setAllHallPreferences(newAllPrefs); 
      const allUserSchedules = await getAllUserDefinedFilmSchedulesService();
      if (!allUserSchedules[selectedFilmId]) {
        try {
            const updatedFilms = await getSampleFilmsWithDynamicSchedules();
            setAllFilmsData(Array.isArray(updatedFilms) ? updatedFilms : []); 
            const updatedSelectedFilmData = Array.isArray(updatedFilms) ? updatedFilms.find(f => f.id === selectedFilmId) : undefined;
            setEditableSchedule(updatedSelectedFilmData?.schedule || []);
            console.log("[ADMIN_PAGE] Hall prefs saved, no custom schedule exists, re-fetched films for default schedule update.");
        } catch (error) {
            console.error("[ADMIN_PAGE] Error re-fetching films after saving hall preferences:", error);
            setAllFilmsData([]);
            setEditableSchedule([]);
            toast({ title: "Error", description: "Could not re-fetch film data after preference save.", variant: "destructive"});
        }
      }
    }
  };
  
  const groupedEditableSchedule = useMemo(() => {
    if (!editableSchedule || editableSchedule.length === 0) return {};
    return editableSchedule.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      acc[entry.day].sort((a, b) => {
        const timeAIndex = POSSIBLE_TIMES_FOR_GENERATION.indexOf(a.time);
        const timeBIndex = POSSIBLE_TIMES_FOR_GENERATION.indexOf(b.time);
        if (timeAIndex !== timeBIndex) return timeAIndex - timeBIndex;
        return a.hallName.localeCompare(b.hallName);
      });
      return acc;
    }, {} as Record<string, ScheduleEntry[]>);
  }, [editableSchedule]);

  const handleAddShowtime = () => {
    if (!selectedFilmId || !newShowtimeDay || !newShowtimeTime || !newShowtimeHall) {
      toast({ title: "Error", description: "Please select day, time, and hall for the new showtime.", variant: "destructive" });
      return;
    }
    const newEntry: ScheduleEntry = { day: newShowtimeDay, time: newShowtimeTime, hallName: newShowtimeHall };
    if (editableSchedule.some(e => e.day === newEntry.day && e.time === newEntry.time && e.hallName === newEntry.hallName)) {
        toast({ title: "Duplicate", description: "This showtime already exists.", variant: "destructive" });
        return;
    }
    setEditableSchedule(prev => [...prev, newEntry].sort((a, b) => {
        if (a.day !== b.day) return DAYS_FOR_GENERATION.indexOf(a.day) - DAYS_FOR_GENERATION.indexOf(b.day);
        const timeA = POSSIBLE_TIMES_FOR_GENERATION.indexOf(a.time);
        const timeB = POSSIBLE_TIMES_FOR_GENERATION.indexOf(b.time);
        if (timeA !== timeB) return timeA - timeB;
        return a.hallName.localeCompare(b.hallName);
      }));
  };

  const handleRemoveShowtime = (indexToRemove: number) => {
    setEditableSchedule(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveCustomSchedule = async () => {
    if (!selectedFilmId) {
      toast({ title: "Error", description: "Please select a film first.", variant: "destructive" });
      return;
    }
    
    const currentSchedules = await getAllUserDefinedFilmSchedulesService();
    currentSchedules[selectedFilmId] = editableSchedule;
    const result = await saveAllUserDefinedFilmSchedulesService(currentSchedules);

    toast({ 
      title: result.success ? "Schedule Saved" : "Error Saving Schedule", 
      description: result.success ? `Custom schedule for '${selectedFilm?.title}' saved.` : result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      setAllFilmsData(prevFilms => {
        if (!Array.isArray(prevFilms)) {
          console.error("[ADMIN_PAGE] prevFilms in handleSaveCustomSchedule was not an array!", prevFilms);
          getSampleFilmsWithDynamicSchedules().then(freshFilms => {
             setAllFilmsData(Array.isArray(freshFilms) ? freshFilms.map(film => 
                film.id === selectedFilmId ? { ...film, schedule: [...editableSchedule] } : film
              ) : []);
          }).catch(err => {
            console.error("Error fetching fresh films during recovery in handleSaveCustomSchedule", err);
            setAllFilmsData([]);
          });
          return []; 
        }
        return prevFilms.map(film => 
          film.id === selectedFilmId ? { ...film, schedule: [...editableSchedule] } : film
        );
      });
    }
  };

  const handleRestoreDefaultSchedule = async () => {
    if (!selectedFilmId) {
      toast({ title: "Error", description: "Please select a film first.", variant: "destructive" });
      return;
    }
    
    const currentSchedules = await getAllUserDefinedFilmSchedulesService();
    delete currentSchedules[selectedFilmId];
    const result = await saveAllUserDefinedFilmSchedulesService(currentSchedules);
    
    toast({ 
      title: result.success ? "Schedule Restored" : "Error Restoring Schedule", 
      description: result.success ? `Schedule for '${selectedFilm?.title}' restored to default.` : result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      try {
        const updatedFilms = await getSampleFilmsWithDynamicSchedules();
        setAllFilmsData(Array.isArray(updatedFilms) ? updatedFilms : []);
        const updatedSelectedFilmData = Array.isArray(updatedFilms) ? updatedFilms.find(f => f.id === selectedFilmId) : undefined;
        setEditableSchedule(updatedSelectedFilmData?.schedule || []);
        console.log("[ADMIN_PAGE] Default schedule restored, re-fetched films.");
      } catch (error) {
         console.error("[ADMIN_PAGE] Error re-fetching films after restoring default schedule:", error);
         setAllFilmsData([]);
         setEditableSchedule([]);
         toast({ title: "Error", description: "Could not re-fetch film data after restoring default schedule.", variant: "destructive"});
      }
    }
  };
  
  if (loadingAuth) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Authenticating...</h1>
        </div>
    );
  }

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You must be a manager to access this page.</p>
         <Button asChild variant="outline" className="mt-6">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <ListVideo className="mr-3 h-8 w-8" />
            Configure Film Schedules & Preferences
          </CardTitle>
          <CardDescription>
            Select a film, define preferred halls for dynamic scheduling, or set a custom fixed schedule.
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
                {Array.isArray(allFilmsData) && allFilmsData.map(film => (
                  <SelectItem key={film.id} value={film.id} className="text-base py-2">
                    {film.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFilm && (
            <>
              {/* Hall Preferences Section */}
              <Card className="p-6 bg-muted/30 border-primary/20">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-2xl text-primary">
                    Hall Preferences for Dynamic Schedule: <span className="font-bold">{selectedFilm.title}</span>
                  </CardTitle>
                  <CardDescription>
                    Select halls to be considered if no custom schedule is set. If none selected, all saved halls are considered.
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
                            checked={currentFilmHallPreferences.includes(hallName)}
                            onCheckedChange={(checked) => handleHallPreferenceChange(hallName, !!checked)}
                          />
                          <Label htmlFor={`hall-${hallName}-${selectedFilm.id}`} className="text-sm font-medium cursor-pointer">
                            {hallName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleSaveHallPreferences} className="mt-6 w-full sm:w-auto" size="lg">
                    <Save className="mr-2 h-5 w-5" />
                    Save Hall Preferences
                  </Button>
                </CardContent>
              </Card>

              {/* Custom Schedule Editor Section */}
              <Card className="p-6 bg-muted/40 border-accent/30 mt-6">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl text-accent-foreground flex justify-between items-center">
                        <span>Custom Schedule Editor: <span className="font-bold">{selectedFilm.title}</span></span>
                        <Button onClick={handleRestoreDefaultSchedule} variant="outline" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4"/> Restore Default Schedule
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Define a fixed schedule for this film. This will override dynamic generation based on hall preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end p-4 border rounded-md bg-card">
                        <div className="flex-1 min-w-[120px]">
                            <Label htmlFor="new-day">Day</Label>
                            <Select value={newShowtimeDay} onValueChange={setNewShowtimeDay}>
                                <SelectTrigger id="new-day"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DAYS_FOR_GENERATION.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex-1 min-w-[120px]">
                            <Label htmlFor="new-time">Time</Label>
                            <Select value={newShowtimeTime} onValueChange={setNewShowtimeTime}>
                                <SelectTrigger id="new-time"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {POSSIBLE_TIMES_FOR_GENERATION.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <Label htmlFor="new-hall">Hall</Label>
                            <Select value={newShowtimeHall} onValueChange={setNewShowtimeHall} disabled={storedLayoutNames.length === 0}>
                                <SelectTrigger id="new-hall">
                                    <SelectValue placeholder={storedLayoutNames.length === 0 ? "No halls saved" : "Select hall..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {storedLayoutNames.map(hall => <SelectItem key={hall} value={hall}>{hall}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddShowtime} disabled={!newShowtimeHall || storedLayoutNames.length === 0}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Showtime
                        </Button>
                    </div>

                    <div className="mt-4">
                        {Object.keys(groupedEditableSchedule).length > 0 ? (
                            Object.entries(groupedEditableSchedule).map(([day, entries]) => (
                                <div key={day} className="mb-3">
                                    <h4 className="font-semibold mb-1.5 text-md flex items-center text-primary">
                                        <CalendarDays className="w-4 h-4 mr-2" /> {day}
                                    </h4>
                                    <ul className="space-y-1.5 pl-1">
                                        {entries.map((entry, idx) => {
                                            const originalIndex = editableSchedule.findIndex(
                                                (e) => e.day === entry.day && e.time === entry.time && e.hallName === entry.hallName
                                            );
                                            return (
                                                <li key={`${entry.day}-${entry.time}-${entry.hallName}-${idx}`} className="flex items-center justify-between text-xs p-2 bg-card/80 rounded-md shadow-sm">
                                                    <div className="flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                                        <span className="font-medium text-foreground mr-2">{entry.time}</span>
                                                        <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                                                        <span className="text-foreground">{entry.hallName}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveShowtime(originalIndex)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">No custom schedule defined. Add showtimes or restore default.</p>
                        )}
                    </div>
                     <Button onClick={handleSaveCustomSchedule} className="mt-4 w-full sm:w-auto" size="lg">
                        <Save className="mr-2 h-5 w-5" /> Save Custom Schedule
                    </Button>
                </CardContent>
              </Card>

              {/* Current Effective Schedule Display (uses groupedEditableSchedule) */}
              <Card className="p-6 bg-muted/20 border-secondary/30 mt-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-2xl text-secondary-foreground">
                    Current Effective Schedule for: <span className="font-bold">{selectedFilm.title}</span>
                  </CardTitle>
                  <CardDescription>
                    This is how the schedule will appear (custom if saved, otherwise default dynamically generated).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {Object.keys(groupedEditableSchedule).length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {Object.entries(groupedEditableSchedule).map(([day, entries]) => (
                        <div key={day}>
                          <h4 className="font-semibold mb-2 text-md flex items-center text-primary">
                            <CalendarDays className="w-4 h-4 mr-2" /> {day}
                          </h4>
                          <ul className="space-y-1.5 pl-1">
                            {entries.map((entry, idx) => (
                              <li key={`${day}-${idx}-${entry.time}-${entry.hallName}`} className="flex items-center text-xs p-2 bg-card rounded-md shadow-sm">
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
                    <p className="text-muted-foreground">No schedule currently available for this film. Please configure hall preferences or add a custom schedule.</p>
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
