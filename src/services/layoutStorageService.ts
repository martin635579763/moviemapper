
'use client';

import type { HallLayout } from '@/types/layout';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const LAYOUTS_COLLECTION = 'layouts';

export async function getStoredLayoutNamesService(): Promise<string[]> {
  try {
    const layoutsCollection = collection(db, LAYOUTS_COLLECTION);
    const snapshot = await getDocs(layoutsCollection);
    const names = snapshot.docs.map(doc => doc.id).sort();
    // console.log("[Service_Firebase] Fetched layout names:", names);
    return names;
  } catch (e) {
    console.error("[Service_Firebase] Error fetching stored layout names:", e);
    // It's important to return an empty array on error so consumers don't break
    return [];
  }
}

export async function loadLayoutFromStorageService(layoutName: string): Promise<HallLayout | null> {
  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, layoutName);
    const docSnap = await getDoc(layoutDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // console.log("[Service_Firebase] Loaded layout:", data);
      // Ensure grid is parsed if stored as JSON string, otherwise assume it's already an object array
      const grid = typeof data.gridJson === 'string' ? JSON.parse(data.gridJson) : data.grid;
      
      const hallLayout: HallLayout = {
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        grid: grid,
        screenCellIds: data.screenCellIds || [], // Ensure screenCellIds exists
      };
      return hallLayout;
    } else {
      console.warn(`[Service_Firebase] Layout "${layoutName}" not found.`);
      return null;
    }
  } catch (error) {
    console.error(`[Service_Firebase] Error fetching stored layout "${layoutName}":`, error);
    return null;
  }
}

interface SaveLayoutResult {
  success: boolean;
  message: string;
  savedLayout?: HallLayout;
  operationType: 'saved_new' | 'updated_existing' | 'cancelled' | 'error' | 'conflict';
}

export async function saveLayoutToStorageService(
  layoutToSave: HallLayout,
  // currentStoredApiNames is no longer strictly needed for Firestore existence check if name is doc ID
  // but might be kept if client-side confirm logic uses it before calling save.
  // For simplicity, we'll assume the context's confirm handles this.
): Promise<SaveLayoutResult> {
  const trimmedSaveName = layoutToSave.name.trim();
  if (!trimmedSaveName) {
    return { success: false, message: "Layout name cannot be empty.", operationType: 'error' };
  }

  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, trimmedSaveName);
    const docSnap = await getDoc(layoutDocRef); // Check if it exists for operationType
    const operationType = docSnap.exists() ? 'updated_existing' : 'saved_new';

    const dataToSave = {
      name: trimmedSaveName,
      rows: layoutToSave.rows,
      cols: layoutToSave.cols,
      gridJson: JSON.stringify(layoutToSave.grid), // Store grid as JSON string
      screenCellIds: layoutToSave.screenCellIds || [],
    };

    await setDoc(layoutDocRef, dataToSave);
    
    // Return the layout as it was saved (name might have been trimmed)
    const savedLayoutData: HallLayout = {
        ...layoutToSave,
        name: trimmedSaveName,
    };

    return {
      success: true,
      message: `Layout "${trimmedSaveName}" ${operationType === 'updated_existing' ? 'updated' : 'saved'}.`,
      savedLayout: savedLayoutData,
      operationType: operationType,
    };
  } catch (e: any) {
    console.error("[Service_Firebase] Error saving layout:", e);
    return {
      success: false,
      message: `Could not save layout: ${e.message || 'Unknown error'}`,
      operationType: 'error'
    };
  }
}

interface DeleteLayoutResult {
  success: boolean;
  message: string;
}

export async function deleteStoredLayoutService(layoutName: string): Promise<DeleteLayoutResult> {
  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, layoutName);
    await deleteDoc(layoutDocRef);
    return { success: true, message: `Layout "${layoutName}" deleted.` };
  } catch (e: any)  {
    console.error("[Service_Firebase] Failed to delete layout:", e);
    return { success: false, message: `Could not delete layout: ${e.message || 'Unknown error'}` };
  }
}
