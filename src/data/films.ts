
import type { HallLayout } from '@/types/layout';

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
  associatedLayoutName: string;
  duration: string;
  genre: string;
  schedule?: ScheduleEntry[];
}

const BASE_FILM_DATA: Omit<Film, 'schedule'>[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos',
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure",
  },
  {
    id: '5',
    title: 'Chronicles of the Ancient Realm',
    description: 'An archaeologist deciphers an ancient prophecy predicting a celestial event, leading her on a perilous quest to find a mythical artifact before it falls into the wrong hands.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', // Changed to Inception poster
    associatedLayoutName: 'Small Hall',
    duration: "2h 15m",
    genre: "Adventure, Fantasy",
  },
  {
    id: '3',
    title: 'VIP Premiere Night',
    description: 'Experience the ultimate luxury in our exclusive VIP screening. An unforgettable night of cinema.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    associatedLayoutName: 'Special VIP Hall',
    duration: "2h 10m",
    genre: "Drama, Romance",
  },
  {
    id: '4',
    title: 'The Last Stand',
    description: 'Outnumbered and outgunned, a small group of heroes makes their final stand against an overwhelming force.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg',
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
      // console.log("[films.ts] Loaded storedLayoutNames:", storedLayoutNames);

      const prefsJson = localStorage.getItem(LOCAL_STORAGE_FILM_HALL_PREFERENCES_KEY);
      filmHallPrefs = prefsJson ? JSON.parse(prefsJson) : {};
      // console.log("[films.ts] Loaded filmHallPrefs:", filmHallPrefs);
      
      const userSchedulesJson = localStorage.getItem(USER_DEFINED_FILM_SCHEDULES_KEY);
      userDefinedSchedules = userSchedulesJson ? JSON.parse(userSchedulesJson) : {};
      // console.log("[films.ts] Loaded userDefinedSchedules:", userDefinedSchedules);

    } catch (e) {
      console.error("Error reading from localStorage in films.ts:", e);
      storedLayoutNames = [];
      filmHallPrefs = {};
      userDefinedSchedules = {};
    }
  }

  // For dynamic schedule generation, ONLY use halls that are currently in localStorage.
  const currentlySavedAndValidHalls = new Set(storedLayoutNames);
  // console.log("[films.ts] currentlySavedAndValidHalls for dynamic generation:", currentlySavedAndValidHalls);

  return BASE_FILM_DATA.map(baseFilm => {
    const userScheduleForFilm = userDefinedSchedules[baseFilm.id];
    if (userScheduleForFilm && Array.isArray(userScheduleForFilm)) {
      // If a user-defined schedule exists, filter it to ensure halls are still valid
      const validUserSchedule = userScheduleForFilm.filter(entry => currentlySavedAndValidHalls.has(entry.hallName));
      // console.log(`[films.ts] Film '${baseFilm.title}': Using user-defined schedule. Original: ${userScheduleForFilm.length}, Valid: ${validUserSchedule.length}`);
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

    // Fallback to dynamic schedule generation using preferences or all saved halls
    const dynamicSchedule: ScheduleEntry[] = [];
    let hallsToUseForThisFilmDynamic: string[] = [];
    const filmSpecificPreferences = filmHallPrefs[baseFilm.id];

    if (filmSpecificPreferences && filmSpecificPreferences.length > 0) {
      hallsToUseForThisFilmDynamic = filmSpecificPreferences.filter(hallName => currentlySavedAndValidHalls.has(hallName));
      // console.log(`[films.ts] Film '${baseFilm.title}': Using PREFERRED halls for dynamic. Preferred: ${filmSpecificPreferences.join(', ')}, Valid subset: ${hallsToUseForThisFilmDynamic.join(', ')}`);
    } else {
      hallsToUseForThisFilmDynamic = [...currentlySavedAndValidHalls];
      // console.log(`[films.ts] Film '${baseFilm.title}': Using ALL SAVED halls for dynamic. Count: ${hallsToUseForThisFilmDynamic.length}`);
    }
    
    if (hallsToUseForThisFilmDynamic.length > 0) {
      DAYS_FOR_GENERATION.forEach(day => {
        const shuffledHallsForDay = [...hallsToUseForThisFilmDynamic].sort(() => 0.5 - Math.random());
        const numHallsToShowPerDay = Math.min(shuffledHallsForDay.length, 2); 

        for (let i = 0; i < numHallsToShowPerDay; i++) {
          const hallName = shuffledHallsForDay[i];
          const numShowtimesInHall = Math.floor(Math.random() * 2) + 1; 
          const timesForThisHall: string[] = [];
          const availableTimes = [...POSSIBLE_TIMES_FOR_GENERATION];
          
          while(timesForThisHall.length < numShowtimesInHall && availableTimes.length > 0) {
            const randomTimeIndex = Math.floor(Math.random() * availableTimes.length);
            const randomTime = availableTimes.splice(randomTimeIndex, 1)[0]; 
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
    // console.log(`[films.ts] Film '${baseFilm.title}': Generated dynamic schedule. Count: ${dynamicSchedule.length}`);

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
