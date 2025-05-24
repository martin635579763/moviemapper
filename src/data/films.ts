
export interface Film {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  associatedLayoutName: string; // To link with HallLayout.name from sample-layouts
  duration: string; // e.g., "2h 15m"
  genre: string;
}

const getUnsplashUrl = (keywords: string): string => {
  const firstKeyword = keywords.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
  return `https://source.unsplash.com/300x450/?${firstKeyword}`;
};

export const sampleFilms: Film[] = [
  {
    id: '1',
    title: 'Adventure in the Cosmos',
    description: 'An epic journey across galaxies to find a new home for humanity. Breathtaking visuals and a gripping storyline.',
    posterUrl: getUnsplashUrl('Sci-Fi, Adventure'),
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 30m",
    genre: "Sci-Fi, Adventure"
  },
  {
    id: '2',
    title: 'Mystery of the Old Manor',
    description: 'A detective uncovers dark secrets in an ancient, sprawling estate. Every shadow hides a clue.',
    posterUrl: getUnsplashUrl('Mystery, Thriller'),
    associatedLayoutName: 'Small Hall',
    duration: "1h 55m",
    genre: "Mystery, Thriller"
  },
  {
    id: '3',
    title: 'VIP Premiere Night',
    description: 'Experience the ultimate luxury in our exclusive VIP screening. An unforgettable night of cinema.',
    posterUrl: getUnsplashUrl('Drama, Romance'), // Using "drama" as keyword
    associatedLayoutName: 'Special VIP Hall',
    duration: "2h 10m",
    genre: "Drama, Romance"
  },
  {
    id: '4',
    title: 'The Last Stand',
    description: 'Outnumbered and outgunned, a small group of heroes makes their final stand against an overwhelming force.',
    posterUrl: getUnsplashUrl('Action, War'),
    associatedLayoutName: 'Standard Cinema',
    duration: "2h 05m",
    genre: "Action, War"
  }
];
