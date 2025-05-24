
export interface Film {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  detailImageUrls: string[]; 
  associatedLayoutName: string; 
  duration: string; 
  genre: string;
}

// getUnsplashUrl is no longer needed for posters
// const getUnsplashUrl = (keywords: string, width: number = 300, height: number = 450): string => {
//   const firstKeyword = keywords.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
//   return `https://source.unsplash.com/${width}x${height}/?${firstKeyword}`;
// };

const getDetailImageUnsplashUrl = (keywords: string, width: number = 600, height: number = 400): string => {
  const relevantKeywords = keywords.split(',').map(k => k.trim().toLowerCase().replace(/\s+/g, '-')).slice(0,2).join(',');
  return `https://source.unsplash.com/${width}x${height}/?${relevantKeywords},movie,scene`; // Added more generic terms
};

export const sampleFilms: Film[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos', // Was: Interstellar
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('galaxy,stars', 600, 400),
      getDetailImageUnsplashUrl('spaceship,cockpit', 600, 400),
      getDetailImageUnsplashUrl('alien,planet', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure"
  },
  {
    id: '2',
    title: 'Mystery of the Old Manor', // Was: Knives Out
    description: 'A detective uncovers dark secrets in an ancient, sprawling estate. Every shadow hides a clue.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twPx4hcw.jpg', // Knives Out poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('haunted,house', 600, 400),
      getDetailImageUnsplashUrl('detective,noir', 600, 400),
      getDetailImageUnsplashUrl('secret,door', 600, 400),
    ],
    associatedLayoutName: 'Small Hall',
    duration: "1h 55m",
    genre: "Mystery, Thriller"
  },
  {
    id: '3',
    title: 'VIP Premiere Night', // Was: La La Land
    description: 'Experience the ultimate luxury in our exclusive VIP screening. An unforgettable night of cinema.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', // La La Land poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('red,carpet', 600, 400),
      getDetailImageUnsplashUrl('luxury,theater', 600, 400),
      getDetailImageUnsplashUrl('movie,premiere', 600, 400),
    ],
    associatedLayoutName: 'Special VIP Hall',
    duration: "2h 10m",
    genre: "Drama, Romance"
  },
  {
    id: '4',
    title: 'The Last Stand', // Was: 1917
    description: 'Outnumbered and outgunned, a small group of heroes makes their final stand against an overwhelming force.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg', // 1917 poster
    detailImageUrls: [
      getDetailImageUnsplashUrl('explosion,war', 600, 400),
      getDetailImageUnsplashUrl('heroic,battle', 600, 400),
      getDetailImageUnsplashUrl('soldiers,action', 600, 400),
    ],
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 05m",
    genre: "Action, War"
  }
];
