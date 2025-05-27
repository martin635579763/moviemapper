
'use client';

import type { HallLayout, SeatStatus, CellData } from '@/types/layout';
import { db } from '@/lib/firebase';
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

// Helper function to ensure a layout is "clean" for saving or loading as a template
const cleanLayoutForTemplate = (layout: HallLayout): HallLayout => {
  return {
    ...layout,
    name: layout.name || 'Untitled Hall', // Ensure name is present
    grid: layout.grid.map(row => row.map(cell => {
      const newCell: Partial<CellData> = { id: cell.id, type: cell.type }; // Start with minimal properties

      // Remove runtime preview properties explicitly
      // delete (cell as any).isOccluded; // Not standard properties, should not be on CellData directly
      // delete (cell as any).hasGoodView;

      if (cell.type === 'seat') {
        // For a template, all seats should be 'available'
        newCell.status = 'available' as SeatStatus;
        newCell.category = cell.category || 'standard'; // Ensure category if it's a seat
      }
      // For other cell types (aisle, screen, empty), no status or category.
      // screenCellIds will handle screen locations.
      return newCell as CellData;
    }))
  };
};


export async function getStoredLayoutNamesService(): Promise<string[]> {
  if (!db) {
    console.error("[Service_Firebase] GetNames: Firestore DB instance is not available.");
    return [];
  }
  try {
    const layoutsCollectionRef = collection(db, LAYOUTS_COLLECTION);
    const snapshot = await getDocs(layoutsCollectionRef);
    const names = snapshot.docs.map(docData => docData.id).sort();
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
      
      if (!grid || !Array.isArray(grid) || !data.name || typeof data.rows !== 'number' || typeof data.cols !== 'number') {
        console.error(`[Service_Firebase] Loaded layout "${layoutName}" has invalid structure or missing essential fields.`);
        return null;
      }

      const loadedHallLayout: HallLayout = {
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        grid: grid, 
        screenCellIds: data.screenCellIds || [],
      };
      return cleanLayoutForTemplate(loadedHallLayout);
    } else {
      console.warn(`[Service_Firebase] Layout "${layoutName}" not found.`);
      return null;
    }
  } catch (error) {
    console.error(`[Service_Firebase] Error fetching or processing stored layout "${layoutName}":`, error);
    return null;
  }
}

export async function saveLayoutToStorageService(
  layoutToSave: HallLayout,
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

  const cleanedLayout = cleanLayoutForTemplate({ ...layoutToSave, name: trimmedSaveName });
  console.log("[Service_Firebase] Layout after cleaning for save:", JSON.parse(JSON.stringify(cleanedLayout)));


  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, trimmedSaveName);
    
    const dataToSave = {
      name: cleanedLayout.name,
      rows: cleanedLayout.rows,
      cols: cleanedLayout.cols,
      gridJson: JSON.stringify(cleanedLayout.grid), 
      screenCellIds: cleanedLayout.screenCellIds || [],
    };

    await setDoc(layoutDocRef, dataToSave);
    console.log(`[Service_Firebase] Successfully saved/updated layout: ${trimmedSaveName}`);
    
    return {
      success: true,
      message: `Layout "${trimmedSaveName}" saved successfully.`,
      savedLayout: cleanedLayout, 
      operationType: 'updated_existing', // Context will determine if it was new or update for toast
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
