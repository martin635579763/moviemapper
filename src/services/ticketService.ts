
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
