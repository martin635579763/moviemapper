
'use client';

import type { HallLayout, SeatStatus } from '@/types/layout';
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
      
      // Ensure seats have a status after loading
      const processedGrid = grid.map((row: any[]) => row.map((cell: any) => {
        const newCell = {...cell};
        if (newCell.type === 'seat' && !newCell.status) {
            newCell.status = 'available' as SeatStatus;
        }
        return newCell;
      }));

      const hallLayout: HallLayout = {
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        grid: processedGrid,
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

  // Prepare data for saving - ensure selected seats are saved as available
  const layoutDataWithAvailableSeats = {
    ...layoutToSave,
    grid: layoutToSave.grid.map(row => row.map(cell => {
      if (cell.type === 'seat' && cell.status === 'selected') {
        return { ...cell, status: 'available' as SeatStatus };
      }
      return cell;
    }))
  };


  try {
    const layoutDocRef = doc(db, LAYOUTS_COLLECTION, trimmedSaveName);
    const docSnap = await getDoc(layoutDocRef); // Check if it exists for operationType message
    
    const dataToSave = {
      name: trimmedSaveName, 
      rows: layoutDataWithAvailableSeats.rows,
      cols: layoutDataWithAvailableSeats.cols,
      gridJson: JSON.stringify(layoutDataWithAvailableSeats.grid), // Store grid as JSON string
      screenCellIds: layoutDataWithAvailableSeats.screenCellIds || [],
    };

    await setDoc(layoutDocRef, dataToSave); 
    console.log(`[Service_Firebase] Successfully saved/updated layout: ${trimmedSaveName}`);
    
    return {
      success: true,
      message: `Layout "${trimmedSaveName}" ${docSnap.exists() ? 'updated' : 'saved'} successfully.`,
      savedLayout: { ...layoutDataWithAvailableSeats, name: trimmedSaveName },
      operationType: docSnap.exists() ? 'updated_existing' : 'saved_new', 
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

