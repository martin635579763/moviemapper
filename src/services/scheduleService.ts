
'use client';

import type { FilmHallPreferences, UserDefinedFilmSchedules } from '@/types/schedule';

const FILM_HALL_PREFERENCES_KEY = 'filmHallPreferences_v1';
const USER_DEFINED_FILM_SCHEDULES_KEY = 'userDefinedFilmSchedules_v1';

// --- Film Hall Preferences ---

export function getAllFilmHallPreferencesService(): FilmHallPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const prefsJson = localStorage.getItem(FILM_HALL_PREFERENCES_KEY);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (e) {
    console.error("Service: Failed to parse film hall preferences from localStorage:", e);
    return {};
  }
}

export function saveAllFilmHallPreferencesService(
  allPreferences: FilmHallPreferences
): { success: boolean; message: string } {
  if (typeof window === 'undefined') {
    return { success: false, message: "Cannot save, window not available." };
  }
  try {
    localStorage.setItem(FILM_HALL_PREFERENCES_KEY, JSON.stringify(allPreferences));
    return { success: true, message: "Film hall preferences saved." };
  } catch (e: any) {
    console.error("Service: Failed to save film hall preferences to localStorage:", e);
    return { success: false, message: `Could not save preferences: ${e.message || 'Unknown error'}` };
  }
}

// --- User-Defined Film Schedules ---

export function getAllUserDefinedFilmSchedulesService(): UserDefinedFilmSchedules {
  if (typeof window === 'undefined') return {};
  try {
    const schedulesJson = localStorage.getItem(USER_DEFINED_FILM_SCHEDULES_KEY);
    return schedulesJson ? JSON.parse(schedulesJson) : {};
  } catch (e) {
    console.error("Service: Failed to parse user-defined film schedules from localStorage:", e);
    return {};
  }
}

export function saveAllUserDefinedFilmSchedulesService(
  allSchedules: UserDefinedFilmSchedules
): { success: boolean; message: string } {
  if (typeof window === 'undefined') {
    return { success: false, message: "Cannot save, window not available." };
  }
  try {
    localStorage.setItem(USER_DEFINED_FILM_SCHEDULES_KEY, JSON.stringify(allSchedules));
    return { success: true, message: "Custom film schedules saved." };
  } catch (e: any) {
    console.error("Service: Failed to save user-defined film schedules to localStorage:", e);
    return { success: false, message: `Could not save schedules: ${e.message || 'Unknown error'}` };
  }
}
