
export interface TicketRecord {
  id?: string; // Firestore will auto-generate this
  filmId: string;
  filmTitle: string;
  hallName: string;
  day: string | null;
  time: string | null;
  seats: string[]; // Array of seat display names, e.g., ["A1", "B5"]
  purchaseTimestamp: Date;
}
