
import type { HallLayout } from '@/types/layout'; 
import { sampleLayouts as staticSampleLayouts } from './sample-layouts'; // Though not directly used for schedule, good to keep if needed elsewhere

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
  associatedLayoutName: string; // Fallback if no specific schedule directs elsewhere or for initial load
  duration: string;
  genre: string;
  schedule?: ScheduleEntry[];
}

const getDetailImageUnsplashUrl = (keywords: string, width: number = 600, height: number = 400): string => {
  const relevantKeywords = keywords.split(',').map(k => k.trim().toLowerCase().replace(/\s+/g, '-')).slice(0,2).join(',');
  return `https://source.unsplash.com/${width}x${height}/?${relevantKeywords},scene`;
};

// Base film data without schedules
const BASE_FILM_DATA: Omit<Film, 'schedule'>[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos',
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('galaxy,stars', 600, 400),
      getDetailImageUnsplashUrl('spaceship,cockpit', 600, 400),
      getDetailImageUnsplashUrl('alien,planet', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure",
  },
  {
    id: '5',
    title: 'Echoes of the Past',
    description: 'A historian uncovers a hidden journal that leads to a forgotten city, revealing secrets that could rewrite history.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/yhXy2l3xpiiNWCnOR9Y2T3MC22P.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('ancient ruins,desert', 600, 400),
      getDetailImageUnsplashUrl('old map,treasure', 600, 400),
    ],
    associatedLayoutName: 'Small Hall',
    duration: "2h 00m",
    genre: "Adventure, Mystery",
  },
  {
    id: '3',
    title: 'VIP Premiere Night',
    description: 'Experience the ultimate luxury in our exclusive VIP screening. An unforgettable night of cinema.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    detailImageUrls: [
      getDetailImageUnsplashUrl('red,carpet', 600, 400),
      getDetailImageUnsplashUrl('luxury,theater', 600, 400),
      getDetailImageUnsplashUrl('movie,premiere', 600, 400),
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
      getDetailImageUnsplashUrl('explosion,war', 600, 400),
      getDetailImageUnsplashUrl('heroic,battle', 600, 400),
      getDetailImageUnsplashUrl('soldiers,action', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 05m",
    genre: "Action, War",
  }
];

const POSSIBLE_TIMES_FOR_GENERATION = ["2:30 PM", "5:15 PM", "7:45 PM", "9:00 PM"];
const DAYS_FOR_GENERATION = ["Today", "Tomorrow"];
const LOCAL_STORAGE_LAYOUT_INDEX_KEY = 'seatLayout_index_v1';
const LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY = 'filmHallPreferences_v1';

type FilmHallPreferences = Record<string, string[]>; // filmId: hallName[]

export function getSampleFilmsWithDynamicSchedules(): Film[] {
  let storedLayoutNames: string[] = [];
  let filmHallPrefs: FilmHallPreferences = {};

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      if (Array.isArray(names)) {
        storedLayoutNames = names.filter(name => typeof name === 'string');
      }

      const prefsJson = localStorage.getItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY);
      filmHallPrefs = prefsJson ? JSON.parse(prefsJson) : {};

    } catch (e) {
      console.error("Error reading from localStorage in films.ts:", e);
    }
  }

  // For schedule generation, we ONLY use explicitly saved layouts by the user.
  const globallyAvailableSavedHalls = new Set(storedLayoutNames);

  return BASE_FILM_DATA.map(baseFilm => {
    const dynamicSchedule: ScheduleEntry[] = [];
    
    let hallsToUseForThisFilm: string[] = [];
    const filmSpecificPreferences = filmHallPrefs[baseFilm.id];

    if (filmSpecificPreferences && filmSpecificPreferences.length > 0) {
      // Use preferred halls, but only if they currently exist as saved layouts
      hallsToUseForThisFilm = filmSpecificPreferences.filter(hallName => globallyAvailableSavedHalls.has(hallName));
    } else {
      // If no preferences, or preferred halls don't exist, use all globally available saved halls for this film.
      // Or, if the requirement is to ONLY use preferred halls and show no schedule if none are set/valid, then:
      // hallsToUseForThisFilm = []; // This line would change if empty schedule is desired when no prefs.
      // For now, let's default to all saved halls if no valid preferences for the film are found.
      // This behavior can be adjusted based on exact requirements.
      // To strictly use ONLY preferred halls:
      // hallsToUseForThisFilm = filmSpecificPreferences ? filmSpecificPreferences.filter(hallName => globallyAvailableSavedHalls.has(hallName)) : [];
      // Current behavior: if preferences specified, use them if valid. If no preferences, use ALL saved halls.
       hallsToUseForThisFilm = filmSpecificPreferences && filmSpecificPreferences.length > 0 
                                ? filmSpecificPreferences.filter(prefHall => globallyAvailableSavedHalls.has(prefHall))
                                : [...globallyAvailableSavedHalls];

    }


    if (hallsToUseForThisFilm.length > 0) {
      DAYS_FOR_GENERATION.forEach(day => {
        // Show each film in up to 2 (or fewer if fewer halls) different halls per day
        const shuffledHallsForDay = [...hallsToUseForThisFilm].sort(() => 0.5 - Math.random());
        const numHallsToShowPerDay = Math.min(shuffledHallsForDay.length, 2);

        for (let i = 0; i < numHallsToShowPerDay; i++) {
          const hallName = shuffledHallsForDay[i];
          // Each hall gets 1 or 2 showtimes
          const numShowtimesInHall = Math.floor(Math.random() * 2) + 1;
          const timesForThisHall: string[] = [];
          while(timesForThisHall.length < numShowtimesInHall && timesForThisHall.length < POSSIBLE_TIMES_FOR_GENERATION.length) {
            const randomTime = POSSIBLE_TIMES_FOR_GENERATION[Math.floor(Math.random() * POSSIBLE_TIMES_FOR_GENERATION.length)];
            if (!timesForThisHall.includes(randomTime)) {
                timesForThisHall.push(randomTime);
            }
          }

          timesForThisHall.forEach(time => {
             if (!dynamicSchedule.some(e => e.day === day && e.time === time && e.hallName === hallName)) {
                dynamicSchedule.push({ day, time, hallName });
            }
          });
        }
      });
    }

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
