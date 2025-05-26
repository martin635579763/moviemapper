
'use client';

import type { HallLayout } from '@/types/layout';
import { db } from '@/lib/firebase'; // Ensure db is correctly imported and initialized
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const LAYOUTS_COLLECTION = 'layouts';

interface SaveLayoutResult {
  success: boolean;
  message: string;
  savedLayout?: HallLayout;
  operationType: 'saved_new' | 'updated_existing' | 'cancelled' | 'error' | 'conflict';
}

interface DeleteLayoutResult {
  success: boolean;
  message: string;
}

export async function getStoredLayoutNamesService(): Promise<string[]> {
  if (!db) {
    console.error("[Service_Firebase] GetNames: Firestore DB instance is not available.");
    return [];
  }
  try {
    const layoutsCollectionRef = collection(db, LAYOUTS_COLLECTION);
    const snapshot = await getDocs(layoutsCollectionRef);
    const names = snapshot.docs.map(doc => doc.id).sort();
    // console.log("[Service_Firebase] Fetched layout names:", names);
    return names;
  } catch (e) {
    console.error("[Service_Firebase] Error fetching stored layout names:", e);
    return [];
  }
}

export async function loadLayoutFromStorageService(layoutName: string): Promise<HallLayout | null> {
  if (!db) {
    console.error("[Service_Firebase] LoadLayout: Firestore DB instance is not available.");
    return null;
  }
  console.log(`[Service_Firebase] Attempting to load layout: ${layoutName}`);
  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, layoutName);
    const docSnap = await getDoc(layoutDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`[Service_Firebase] Successfully loaded layout: ${layoutName}`, data);
      const grid = typeof data.gridJson === 'string' ? JSON.parse(data.gridJson) : data.grid;
      
      const hallLayout: HallLayout = {
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        grid: grid,
        screenCellIds: data.screenCellIds || [],
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

export async function saveLayoutToStorageService(
  layoutToSave: HallLayout,
  currentStoredNames: string[] // Received from context, used for client-side confirm logic
): Promise<SaveLayoutResult> {
  if (!db) {
     console.error("[Service_Firebase] SaveLayout: Firestore DB instance is not available.");
    return { success: false, message: "Firestore DB instance is not available.", operationType: 'error' };
  }

  const trimmedSaveName = layoutToSave.name.trim();
  if (!trimmedSaveName) {
    return { success: false, message: "Layout name cannot be empty.", operationType: 'error' };
  }
  console.log(`[Service_Firebase] Attempting to save layout: ${trimmedSaveName}`);

  // Overwrite logic is mostly handled in the context before calling this service,
  // based on currentStoredNames. This service just performs the write.
  // However, for robustness, the service could also check existence if needed,
  // but this might lead to double checks if context already did.
  // For now, assume context manages the confirm() and calls this for actual save/update.

  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, trimmedSaveName);
    // To determine if it's an update or new for the message, we'd need to know
    // if the document already exists. This check is done in context for the confirm.
    // Let's assume the operationType will be passed or determined by context.
    
    const dataToSave = {
      name: trimmedSaveName, // Ensure the name stored in the doc matches the ID
      rows: layoutToSave.rows,
      cols: layoutToSave.cols,
      gridJson: JSON.stringify(layoutToSave.grid),
      screenCellIds: layoutToSave.screenCellIds || [],
    };

    await setDoc(layoutDocRef, dataToSave); // setDoc will create or overwrite
    console.log(`[Service_Firebase] Successfully saved/updated layout: ${trimmedSaveName}`);
    
    return {
      success: true,
      message: `Layout "${trimmedSaveName}" saved successfully.`, // Generic message, context can refine
      savedLayout: { ...layoutToSave, name: trimmedSaveName },
      // operationType needs to be determined by context based on prior checks
      // Defaulting to updated_existing assuming context handled this.
      operationType: 'updated_existing', 
    };
  } catch (e: any) {
    console.error(`[Service_Firebase] Error saving layout "${trimmedSaveName}":`, e);
    return {
      success: false,
      message: `Could not save layout: ${e.message || 'Unknown error'}`,
      operationType: 'error'
    };
  }
}

export async function deleteStoredLayoutService(layoutName: string): Promise<DeleteLayoutResult> {
  if (!db) {
    console.error("[Service_Firebase] Delete: Firestore DB instance is not available.");
    return { success: false, message: "Firestore DB instance is not available." };
  }
  console.log(`[Service_Firebase] Attempting to delete layout: ${layoutName}`);
  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, layoutName);
    await deleteDoc(layoutDocRef);
    console.log(`[Service_Firebase] Successfully deleted layout: ${layoutName} from Firestore.`);
    return { success: true, message: `Layout "${layoutName}" deleted.` };
  } catch (e: any)  {
    console.error(`[Service_Firebase] Failed to delete layout "${layoutName}":`, e);
    return { success: false, message: `Could not delete layout: ${e.message || 'Unknown error'}` };
  }
}
