
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { TicketRecord } from '@/types/ticket';

const TICKET_RECORDS_COLLECTION = 'ticketRecords';

interface SaveTicketRecordResult {
  success: boolean;
  id?: string;
  message: string;
}

export async function saveTicketRecordService(
  ticketData: Omit<TicketRecord, 'id' | 'purchaseTimestamp'>
): Promise<SaveTicketRecordResult> {
  if (!db) {
    console.error("[Service_Firestore_Ticket] Firestore DB instance is not available.");
    return { success: false, message: "Firestore DB instance is not available." };
  }

  console.log("[Service_Firestore_Ticket] Attempting to save ticket record:", ticketData);
  try {
    const docRef = await addDoc(collection(db, TICKET_RECORDS_COLLECTION), {
      ...ticketData,
      purchaseTimestamp: serverTimestamp(), // Use Firestore server timestamp
    });
    console.log("[Service_Firestore_Ticket] Ticket record saved with ID:", docRef.id);
    return {
      success: true,
      id: docRef.id,
      message: "Ticket record saved successfully.",
    };
  } catch (e: any) {
    console.error("[Service_Firestore_Ticket] Error saving ticket record:", e);
    return {
      success: false,
      message: `Could not save ticket record: ${e.message || 'Unknown error'}`,
    };
  }
}

export async function getSoldSeatsForShowtimeService(
  filmId: string,
  hallName: string,
  day: string | null,
  time: string | null
): Promise<string[]> {
  if (!db) {
    console.error("[Service_Firestore_Ticket] Firestore DB instance is not available for getSoldSeats.");
    return [];
  }
  if (!filmId || !hallName || day === null || time === null) {
    // Not enough info to query for specific showtime sold seats
    return [];
  }

  console.log(`[Service_Firestore_Ticket] Fetching sold seats for Film: ${filmId}, Hall: ${hallName}, Day: ${day}, Time: ${time}`);
  try {
    const q = query(
      collection(db, TICKET_RECORDS_COLLECTION),
      where("filmId", "==", filmId),
      where("hallName", "==", hallName),
      where("day", "==", day),
      where("time", "==", time)
    );

    const querySnapshot = await getDocs(q);
    const soldSeats: string[] = [];
    querySnapshot.forEach((doc) => {
      const ticket = doc.data() as TicketRecord;
      if (ticket.seats && Array.isArray(ticket.seats)) {
        soldSeats.push(...ticket.seats);
      }
    });
    console.log(`[Service_Firestore_Ticket] Found sold seats:`, soldSeats);
    return Array.from(new Set(soldSeats)); // Return unique seat names
  } catch (e: any) {
    console.error("[Service_Firestore_Ticket] Error fetching sold seats:", e);
    return [];
  }
}
