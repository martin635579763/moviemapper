import type { HallLayout } from '@/types/layout';
// Removed unused import: import { sampleLayouts as staticSampleLayouts } from './sample-layouts';

export interface ScheduleEntry {
  day: string;
  time: string;
  hallName: string;
}

export interface Film {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  detailImageUrls: string[];
  associatedLayoutName: string;
  duration: string;
  genre: string;
  schedule?: ScheduleEntry[];
}

const getDetailImageUnsplashUrl = (keywords: string, width: number = 600, height: number = 400): string => {
  const relevantKeywords = keywords.split(',').map(k => k.trim().toLowerCase().replace(/\s+/g, '-')).slice(0,2).join(',');
  return `https://source.unsplash.com/${width}x${height}/?${relevantKeywords},scene`;
};

const BASE_FILM_DATA: Omit<Film, 'schedule'>[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos',
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('galaxy stars', 600, 400),
      getDetailImageUnsplashUrl('spaceship cockpit', 600, 400),
      getDetailImageUnsplashUrl('alien planet', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure",
  },
  {
    id: '5', // Keep ID unique, or re-use if '5' was the problematic one. Let's use a new ID if '5' was Echoes of the Past's ID.
             // Assuming '5' was the original ID for "Echoes of the Past".
    title: 'Chronicles of the Ancient Realm',
    description: 'An archaeologist deciphers an ancient prophecy predicting a celestial event, leading her on a perilous quest to find a mythical artifact before it falls into the wrong hands.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/x5q4e52c3g5s02s698txjGuF5wL.jpg', // Stargate poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('ancient artifact pyramid', 600, 400),
      getDetailImageUnsplashUrl('archaeologist discovery', 600, 400),
    ],
    associatedLayoutName: 'Small Hall',
    duration: "2h 15m",
    genre: "Adventure, Fantasy",
  },
  {
    id: '3',
    title: 'VIP Premiere Night',
    description: 'Experience the ultimate luxury in our exclusive VIP screening. An unforgettable night of cinema.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('red carpet', 600, 400),
      getDetailImageUnsplashUrl('luxury theater', 600, 400),
      getDetailImageUnsplashUrl('movie premiere', 600, 400),
    ],
    associatedLayoutName: 'Special VIP Hall',
    duration: "2h 10m",
    genre: "Drama, Romance",
  },
  {
    id: '4',
    title: 'The Last Stand',
    description: 'Outnumbered and outgunned, a small group of heroes makes their final stand against an overwhelming force.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('explosion war', 600, 400),
      getDetailImageUnsplashUrl('heroic battle', 600, 400),
      getDetailImageUnsplashUrl('soldiers action', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 05m",
    genre: "Action, War",
  }
];

export const POSSIBLE_TIMES_FOR_GENERATION = ["2:00 PM", "2:30 PM", "4:30 PM", "5:15 PM", "7:00 PM", "7:45 PM", "9:00 PM", "9:30 PM"];
export const DAYS_FOR_GENERATION = ["Today", "Tomorrow", "Next Day"];

const LOCAL_STORAGE_LAYOUT_INDEX_KEY = 'seatLayout_index_v1';
const LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY = 'filmHallPreferences_v1';
const USER_DEFINED_FILM_SCHEDULES_KEY = 'userDefinedFilmSchedules_v1';

type FilmHallPreferences = Record<string, string[]>; // filmId: hallName[]
type UserDefinedFilmSchedules = Record<string, ScheduleEntry[]>; // filmId: ScheduleEntry[]

export function getSampleFilmsWithDynamicSchedules(): Film[] {
  let storedLayoutNames: string[] = [];
  let filmHallPrefs: FilmHallPreferences = {};
  let userDefinedSchedules: UserDefinedFilmSchedules = {};

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      if (Array.isArray(names)) {
        storedLayoutNames = names.filter(name => typeof name === 'string');
      } else {
        storedLayoutNames = [];
      }

      const prefsJson = localStorage.getItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY);
      filmHallPrefs = prefsJson ? JSON.parse(prefsJson) : {};
      
      const userSchedulesJson = localStorage.getItem(USER_DEFINED_FILM_SCHEDULES_KEY);
      userDefinedSchedules = userSchedulesJson ? JSON.parse(userSchedulesJson) : {};

    } catch (e) {
      console.error("Error reading from localStorage in films.ts:", e);
      // Keep default empty values if localStorage fails
      storedLayoutNames = [];
      filmHallPrefs = {};
      userDefinedSchedules = {};
    }
  }

  const globallyAvailableSavedHalls = new Set(storedLayoutNames);

  return BASE_FILM_DATA.map(baseFilm => {
    // Check for a user-defined schedule first
    const userSchedule = userDefinedSchedules[baseFilm.id];
    if (userSchedule && Array.isArray(userSchedule)) {
      // Filter user-defined schedule to only include halls that still exist
      const validUserSchedule = userSchedule.filter(entry => globallyAvailableSavedHalls.has(entry.hallName));
       validUserSchedule.sort((a, b) => {
        if (a.day !== b.day) return DAYS_FOR_GENERATION.indexOf(a.day) - DAYS_FOR_GENERATION.indexOf(b.day);
        const timeA = POSSIBLE_TIMES_FOR_GENERATION.indexOf(a.time);
        const timeB = POSSIBLE_TIMES_FOR_GENERATION.indexOf(b.time);
        if (timeA !== timeB) return timeA - timeB;
        return a.hallName.localeCompare(b.hallName);
      });
      return {
        ...baseFilm,
        schedule: validUserSchedule,
      };
    }

    // Fallback to dynamic generation if no user-defined schedule
    const dynamicSchedule: ScheduleEntry[] = [];
    let hallsToUseForThisFilm: string[] = [];
    const filmSpecificPreferences = filmHallPrefs[baseFilm.id];

    if (filmSpecificPreferences && filmSpecificPreferences.length > 0) {
      // Use preferred halls, but only if they currently exist as saved layouts
      hallsToUseForThisFilm = filmSpecificPreferences.filter(hallName => globallyAvailableSavedHalls.has(hallName));
    } else {
      // No preferences set, or preferred halls don't exist. Use all currently saved halls.
      hallsToUseForThisFilm = [...globallyAvailableSavedHalls];
    }
    
    // If after checking preferences, no valid halls are found, the schedule will be empty.
    // Only generate schedule if there are halls to use.
    if (hallsToUseForThisFilm.length > 0) {
      DAYS_FOR_GENERATION.forEach(day => {
        // Shuffle halls for variety for each day
        const shuffledHallsForDay = [...hallsToUseForThisFilm].sort(() => 0.5 - Math.random());
        // Show in up to 2 halls per day for this film (or fewer if less halls are available/preferred)
        const numHallsToShowPerDay = Math.min(shuffledHallsForDay.length, 2); 

        for (let i = 0; i < numHallsToShowPerDay; i++) {
          const hallName = shuffledHallsForDay[i];
          // Randomly 1 or 2 showtimes per hall per day
          const numShowtimesInHall = Math.floor(Math.random() * 2) + 1; 
          const timesForThisHall: string[] = [];
          
          // Create a mutable copy of possible times to pick from without replacement for this hall+day
          const availableTimes = [...POSSIBLE_TIMES_FOR_GENERATION];
          
          while(timesForThisHall.length < numShowtimesInHall && availableTimes.length > 0) {
            const randomTimeIndex = Math.floor(Math.random() * availableTimes.length);
            const randomTime = availableTimes.splice(randomTimeIndex, 1)[0]; // Pick and remove
            if (!timesForThisHall.includes(randomTime)) { // Should always be true due to splice
                timesForThisHall.push(randomTime);
            }
          }

          timesForThisHall.forEach(time => {
            // Check for duplicates before adding to ensure unique entries if logic somehow allows it
            // (though current logic should prevent it)
             if (!dynamicSchedule.some(e => e.day === day && e.time === time && e.hallName === hallName)) {
                dynamicSchedule.push({ day, time, hallName });
            }
          });
        }
      });
    }

    // Sort the generated schedule
    dynamicSchedule.sort((a, b) => {
      if (a.day !== b.day) return DAYS_FOR_GENERATION.indexOf(a.day) - DAYS_FOR_GENERATION.indexOf(b.day);
      const timeA = POSSIBLE_TIMES_FOR_GENERATION.indexOf(a.time);
      const timeB = POSSIBLE_TIMES_FOR_GENERATION.indexOf(b.time);
      if (timeA !== timeB) return timeA - timeB;
      return a.hallName.localeCompare(b.hallName);
    });
    
    return {
      ...baseFilm,
      schedule: dynamicSchedule,
    };
  });
}

// Adding some sample schedules to the new "Chronicles of the Ancient Realm" film (id: '5')
// and ensuring other films have varied schedules for "hall one", "hall two", "hall 3" for demo purposes.
// This part is now handled by the dynamic schedule generation logic above, 
// but let's ensure the BASE_FILM_DATA is clean.

// The actual schedule generation happens in getSampleFilmsWithDynamicSchedules.
// The `hallName`s used in the "ScheduleEntry" objects within that function will be
// dynamically chosen from `allAvailableHallNames` which includes "hall one", "hall two", "hall 3" if they are saved.
// For the static schedule example (if it were still used), it would look like this:
/*
const updatedSampleFilms = sampleFilms.map(film => {
  if (film.id === '1') { // Adventure in the Cosmos
    return { ...film, schedule: [
      { day: "Today", time: "2:00 PM", hallName: "hall one" },
      { day: "Today", time: "7:00 PM", hallName: "hall two" },
      { day: "Tomorrow", time: "5:15 PM", hallName: "hall one" },
    ]};
  }
  if (film.id === '5') { // Chronicles of the Ancient Realm
    return { ...film, schedule: [
      { day: "Today", time: "4:30 PM", hallName: "hall 3" },
      { day: "Tomorrow", time: "2:30 PM", hallName: "hall 3" },
      { day: "Tomorrow", time: "7:45 PM", hallName: "hall one" },
    ]};
  }
  if (film.id === '3') { // VIP Premiere Night
    return { ...film, schedule: [
      { day: "Next Day", time: "7:00 PM", hallName: "hall two" },
      { day: "Next Day", time: "9:00 PM", hallName: "hall 3" },
    ]};
  }
   if (film.id === '4') { // The Last Stand
    return { ...film, schedule: [
      { day: "Today", time: "9:30 PM", hallName: "hall one" },
      { day: "Tomorrow", time: "4:30 PM", hallName: "hall two" },
    ]};
  }
  return film;
});

export { updatedSampleFilms as sampleFilms };
*/
// The above static update is no longer needed as schedules are fully dynamic.
// The `hallName` check happens within `getSampleFilmsWithDynamicSchedules`.
