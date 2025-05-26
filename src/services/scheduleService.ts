
'use client';

import type { FilmHallPreferences, UserDefinedFilmSchedules } from '@/types/schedule';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const FILM_HALL_PREFERENCES_COLLECTION = 'filmHallPreferences';
const FILM_HALL_PREFERENCES_DOC_ID = 'defaultPreferences';

const USER_DEFINED_SCHEDULES_COLLECTION = 'userDefinedFilmSchedules';
const USER_DEFINED_SCHEDULES_DOC_ID = 'allCustomSchedules';


// --- Film Hall Preferences ---

export async function getAllFilmHallPreferencesService(): Promise<FilmHallPreferences> {
  if (!db) {
    console.error("Firestore DB instance is not available in getAllFilmHallPreferencesService.");
    return {};
  }
  try {
    const docRef = doc(db, FILM_HALL_PREFERENCES_COLLECTION, FILM_HALL_PREFERENCES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FilmHallPreferences;
    }
    return {};
  } catch (e) {
    console.error("Service_Firestore: Failed to fetch film hall preferences:", e);
    return {};
  }
}

export async function saveAllFilmHallPreferencesService(
  allPreferences: FilmHallPreferences
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: "Firestore DB instance is not available." };
  }
  try {
    const docRef = doc(db, FILM_HALL_PREFERENCES_COLLECTION, FILM_HALL_PREFERENCES_DOC_ID);
    await setDoc(docRef, allPreferences);
    return { success: true, message: "Film hall preferences saved to Firestore." };
  } catch (e: any) {
    console.error("Service_Firestore: Failed to save film hall preferences:", e);
    return { success: false, message: `Could not save preferences: ${e.message || 'Unknown error'}` };
  }
}

// --- User-Defined Film Schedules ---

export async function getAllUserDefinedFilmSchedulesService(): Promise<UserDefinedFilmSchedules> {
  if (!db) {
    console.error("Firestore DB instance is not available in getAllUserDefinedFilmSchedulesService.");
    return {};
  }
  try {
    const docRef = doc(db, USER_DEFINED_SCHEDULES_COLLECTION, USER_DEFINED_SCHEDULES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDefinedFilmSchedules;
    }
    return {};
  } catch (e) {
    console.error("Service_Firestore: Failed to fetch user-defined film schedules:", e);
    return {};
  }
}

export async function saveAllUserDefinedFilmSchedulesService(
  allSchedules: UserDefinedFilmSchedules
): Promise<{ success: boolean; message: string }> {
  if (!db) {
     return { success: false, message: "Firestore DB instance is not available." };
  }
  try {
    const docRef = doc(db, USER_DEFINED_SCHEDULES_COLLECTION, USER_DEFINED_SCHEDULES_DOC_ID);
    await setDoc(docRef, allSchedules);
    return { success: true, message: "Custom film schedules saved to Firestore." };
  } catch (e: any) {
    console.error("Service_Firestore: Failed to save user-defined film schedules:", e);
    return { success: false, message: `Could not save schedules: ${e.message || 'Unknown error'}` };
  }
}
