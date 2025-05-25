
'use client';

import type { HallLayout } from '@/types/layout';

export const LOCAL_STORAGE_INDEX_KEY = 'seatLayout_index_v1';
export const LOCAL_STORAGE_LAYOUT_PREFIX = 'seatLayout_item_v1_';

export function getStoredLayoutNamesService(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    const names = indexJson ? JSON.parse(indexJson) : [];
    return Array.isArray(names) ? [...names].sort() : [];
  } catch (e) {
    console.error("Service: Failed to parse stored layout names from localStorage:", e);
    return [];
  }
}

export function loadLayoutFromStorageService(layoutName: string): HallLayout | null {
  if (typeof window === 'undefined') return null;
  try {
    const layoutJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
    if (layoutJson) {
      const loadedLayout = JSON.parse(layoutJson) as HallLayout;
      if (!loadedLayout || !loadedLayout.grid || !loadedLayout.rows || !loadedLayout.cols) {
        console.error(`Service: Invalid layout structure for "${layoutName}".`);
        localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName); // Clean up invalid entry
        // Optionally, update index if this function knew about it. For now, just log.
        return null;
      }
      return loadedLayout;
    }
    return null;
  } catch (error) {
    console.error(`Service: Failed to parse stored layout "${layoutName}" from localStorage:`, error);
    return null;
  }
}

interface SaveLayoutResult {
  success: boolean;
  message: string;
  updatedNames?: string[];
  savedLayout?: HallLayout;
  operationType: 'saved_new' | 'updated_existing' | 'cancelled' | 'error';
}

export function saveLayoutToStorageService(
  layoutToSaveInput: HallLayout,
  currentStoredNames: string[]
): SaveLayoutResult {
  if (typeof window === 'undefined') {
    return { success: false, message: "Cannot save, window not available.", operationType: 'error' };
  }

  const trimmedSaveName = layoutToSaveInput.name.trim();
  if (!trimmedSaveName) {
    return { success: false, message: "Layout name cannot be empty.", operationType: 'error' };
  }

  const layoutToSave = { ...layoutToSaveInput, name: trimmedSaveName };

  console.log("[SERVICE_SAVE_LAYOUT] Attempting to save with name:", `'${trimmedSaveName}'`);
  console.log("[SERVICE_SAVE_LAYOUT] Current stored names:", currentStoredNames);

  const insensitiveMatchOriginalCase = currentStoredNames.find(
    storedName => storedName.toLowerCase() === trimmedSaveName.toLowerCase()
  );
  console.log("[SERVICE_SAVE_LAYOUT] Found existing (case-insensitive):", insensitiveMatchOriginalCase);

  try {
    if (insensitiveMatchOriginalCase) {
      console.log("[SERVICE_SAVE_LAYOUT] Existing name found. Preparing to call confirm().");
      const confirmed = confirm(
        `Layout "${insensitiveMatchOriginalCase}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
      );
      console.log("[SERVICE_SAVE_LAYOUT] confirm() returned:", confirmed);

      if (!confirmed) {
        return {
          success: false,
          message: `Overwrite of layout "${insensitiveMatchOriginalCase}" was cancelled by the user.`,
          operationType: 'cancelled'
        };
      }

      console.log("[SERVICE_SAVE_LAYOUT] Overwrite confirmed by user. Proceeding to update.");
      let updatedNames = currentStoredNames.filter(
        name => name.toLowerCase() !== insensitiveMatchOriginalCase.toLowerCase()
      );
      // Ensure all case variations of the old name are removed from storage
      currentStoredNames.forEach(storedName => {
        if (storedName.toLowerCase() === insensitiveMatchOriginalCase.toLowerCase()) {
          console.log(`[SERVICE_SAVE_LAYOUT] Removing old item from localStorage: ${LOCAL_STORAGE_LAYOUT_PREFIX + storedName}`);
          localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + storedName);
        }
      });
      
      updatedNames.push(trimmedSaveName); // Add the new name (could be different casing)
      updatedNames.sort();

      console.log(`[SERVICE_SAVE_LAYOUT] Saving updated layout as: ${LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName}`);
      localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName, JSON.stringify(layoutToSave));
      console.log(`[SERVICE_SAVE_LAYOUT] Updating index in localStorage with names:`, updatedNames);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedNames));
      
      return {
        success: true,
        message: `Layout "${trimmedSaveName}" updated.`,
        updatedNames,
        savedLayout: layoutToSave,
        operationType: 'updated_existing'
      };

    } else {
      console.log("[SERVICE_SAVE_LAYOUT] No existing name found. Saving as new.");
      let updatedNames = [...currentStoredNames, trimmedSaveName];
      updatedNames.sort();
      
      console.log(`[SERVICE_SAVE_LAYOUT] Saving new layout as: ${LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName}`);
      localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName, JSON.stringify(layoutToSave));
      console.log(`[SERVICE_SAVE_LAYOUT] Updating index in localStorage with names:`, updatedNames);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedNames));

      return {
        success: true,
        message: `Layout "${trimmedSaveName}" saved as new.`,
        updatedNames,
        savedLayout: layoutToSave,
        operationType: 'saved_new'
      };
    }
  } catch (e: any) {
    console.error("[SERVICE_SAVE_LAYOUT] Error during save operation:", e);
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
  updatedNames?: string[];
}

export function deleteStoredLayoutService(layoutName: string, currentStoredNames: string[]): DeleteLayoutResult {
  if (typeof window === 'undefined') {
     return { success: false, message: "Cannot delete, window not available." };
  }
  try {
    localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
    const updatedNames = currentStoredNames.filter(name => name !== layoutName).sort();
    localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedNames));
    return { success: true, message: `Layout "${layoutName}" deleted from browser.`, updatedNames };
  } catch (e: any) {
    console.error("Service: Failed to delete layout from localStorage:", e);
    return { success: false, message: `Could not delete layout: ${e.message || 'Unknown error'}` };
  }
}
