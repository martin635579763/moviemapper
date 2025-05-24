
export interface ScheduleEntry {
  day: string;
  time: string;
  hallName: string;
}

export interface Film {
  id:string;
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
  return `https://source.unsplash.com/${width}x${height}/?${relevantKeywords},movie,scene`;
};


export const sampleFilms: Film[] = [
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
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure",
    schedule: [
      { day: "Today", time: "2:00 PM", hallName: "Standard Cinema" },
      { day: "Today", time: "5:00 PM", hallName: "Standard Cinema" },
      { day: "Today", time: "8:00 PM", hallName: "Small Hall" },
      { day: "Tomorrow", time: "3:00 PM", hallName: "Standard Cinema" },
      { day: "Tomorrow", time: "6:00 PM", hallName: "Small Hall" },
    ]
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
    schedule: [
      { day: "Today", time: "1:00 PM", hallName: "Small Hall" },
      { day: "Today", time: "4:00 PM", hallName: "Small Hall" },
      { day: "Tomorrow", time: "2:00 PM", hallName: "Small Hall" },
    ]
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
    schedule: [
      { day: "Today", time: "7:00 PM", hallName: "Special VIP Hall" },
      { day: "Tomorrow", time: "7:00 PM", hallName: "Special VIP Hall" },
      { day: "Friday", time: "8:00 PM", hallName: "Special VIP Hall" },
    ]
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
    schedule: [
      { day: "Today", time: "12:00 PM", hallName: "Standard Cinema" },
      { day: "Today", time: "3:30 PM", hallName: "Standard Cinema" },
      { day: "Today", time: "9:00 PM", hallName: "Standard Cinema" },
      { day: "Tomorrow", time: "1:00 PM", hallName: "Standard Cinema" },
    ]
  }
];
