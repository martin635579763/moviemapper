
import type { HallLayout } from '@/types/layout'; // Keep for potential future use if needed
import { sampleLayouts as staticSampleLayouts } from './sample-layouts';

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

// Helper to generate consistent Unsplash URLs for detail images
const getDetailImageUnsplashUrl = (keywords: string, width: number = 600, height: number = 400): string => {
  const relevantKeywords = keywords.split(',').map(k => k.trim().toLowerCase().replace(/\s+/g, '-')).slice(0,2).join(',');
  return `https://source.unsplash.com/${width}x${height}/?${relevantKeywords},scene`;
};

const BASE_FILM_DATA: Omit<Film, 'schedule'>[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos',
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('galaxy,stars', 600, 400),
      getDetailImageUnsplashUrl('spaceship,cockpit', 600, 400),
      getDetailImageUnsplashUrl('alien,planet', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema', // This remains as a fallback if no schedule directs elsewhere
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure",
  },
  {
    id: '5',
    title: 'Echoes of the Past',
    description: 'A historian uncovers a hidden journal that leads to a forgotten city, revealing secrets that could rewrite history.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/yhXy2l3xpiiNWCnOR9Y2T3MC22P.jpg', // The Mummy (1999) poster
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', // La La Land poster
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg', // 1917 poster
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
const LOCAL_STORAGE_INDEX_KEY_FOR_FILMS = 'seatLayout_index_v1'; // Must match LayoutContext

export function getSampleFilmsWithDynamicSchedules(): Film[] {
  let storedLayoutNames: string[] = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY_FOR_FILMS);
      const names = indexJson ? JSON.parse(indexJson) : [];
      if (Array.isArray(names)) {
        storedLayoutNames = names.filter(name => typeof name === 'string');
      }
    } catch (e) {
      console.error("Error reading stored layout names in films.ts:", e);
    }
  }

  // Use ONLY stored layout names for dynamic schedule generation
  const allAvailableHallNames = Array.from(new Set([...storedLayoutNames]));

  return BASE_FILM_DATA.map(baseFilm => {
    const dynamicSchedule: ScheduleEntry[] = [];
    if (allAvailableHallNames.length > 0) {
      DAYS_FOR_GENERATION.forEach(day => {
        const numShowtimesToday = Math.floor(Math.random() * Math.min(3, allAvailableHallNames.length)) + 1;
        
        const shuffledHalls = [...allAvailableHallNames].sort(() => 0.5 - Math.random());

        for (let i = 0; i < numShowtimesToday; i++) {
          if (i >= shuffledHalls.length) break; 
          
          const hallName = shuffledHalls[i];
          const randomTimeIndex = Math.floor(Math.random() * POSSIBLE_TIMES_FOR_GENERATION.length);
          const time = POSSIBLE_TIMES_FOR_GENERATION[randomTimeIndex];
          
          if (!dynamicSchedule.some(e => e.day === day && e.time === time && e.hallName === hallName)) {
            dynamicSchedule.push({ day, time, hallName });
          }
        }
      });
    }
    dynamicSchedule.sort((a, b) => {
      if (a.day !== b.day) return DAYS_FOR_GENERATION.indexOf(a.day) - DAYS_FOR_GENERATION.indexOf(b.day);
      return POSSIBLE_TIMES_FOR_GENERATION.indexOf(a.time) - POSSIBLE_TIMES_FOR_GENERATION.indexOf(b.time);
    });
    
    return {
      ...baseFilm,
      schedule: dynamicSchedule,
    };
  });
}
