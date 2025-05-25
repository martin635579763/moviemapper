
'use client';

import type { HallLayout, CellData } from '@/types/layout';

// This service now interacts with API endpoints instead of localStorage

export async function getStoredLayoutNamesService(): Promise<string[]> {
  try {
    const response = await fetch('/api/layouts');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error("Service: Failed to fetch layout names:", errorData.message);
      return [];
    }
    const names = await response.json();
    return Array.isArray(names) ? names.sort() : [];
  } catch (e) {
    console.error("Service: Error fetching stored layout names from API:", e);
    return [];
  }
}

export async function loadLayoutFromStorageService(layoutName: string): Promise<HallLayout | null> {
  try {
    const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Service: Layout "${layoutName}" not found via API.`);
        return null;
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Service: Failed to fetch layout "${layoutName}" from API:`, errorData.message);
      return null;
    }
    const loadedLayout = await response.json() as HallLayout;
     if (!loadedLayout || !loadedLayout.grid || !loadedLayout.rows || !loadedLayout.cols) {
        console.error(`Service: Invalid layout structure received from API for "${layoutName}".`);
        return null;
      }
    // Reconstruct screenCellIds if necessary (API might not return it directly in this format)
    loadedLayout.screenCellIds = [];
    loadedLayout.grid.forEach(row => row.forEach(cell => {
        if (cell.type === 'screen') {
            loadedLayout.screenCellIds.push(cell.id);
        }
    }));
    return loadedLayout;
  } catch (error) {
    console.error(`Service: Error fetching stored layout "${layoutName}" from API:`, error);
    return null;
  }
}

interface SaveLayoutResult {
  success: boolean;
  message: string;
  savedLayout?: HallLayout; // The layout as saved/returned by API (might include ID, timestamps)
  operationType: 'saved_new' | 'updated_existing' | 'cancelled' | 'error' | 'conflict';
}

// This function now handles both creating new layouts and updating existing ones.
// The `confirm` dialog for overwrite should happen in the component before calling this,
// or the API can implement an "upsert" or have separate create/update endpoints.
// For simplicity, we'll assume the API's POST creates, and PUT updates.
// We need to check if the layout exists first to decide whether to POST (create) or PUT (update).
export async function saveLayoutToStorageService(
  layoutToSaveInput: HallLayout,
  currentStoredApiNames: string[] // Names fetched from API
): Promise<SaveLayoutResult> {
  
  const trimmedSaveName = layoutToSaveInput.name.trim();
  if (!trimmedSaveName) {
    return { success: false, message: "Layout name cannot be empty.", operationType: 'error' };
  }

  const layoutPayload = {
    name: trimmedSaveName,
    rows: layoutToSaveInput.rows,
    cols: layoutToSaveInput.cols,
    grid: layoutToSaveInput.grid,
  };

  const nameExistsInApi = currentStoredApiNames.some(
    name => name.toLowerCase() === trimmedSaveName.toLowerCase()
  );

  let operationType: 'saved_new' | 'updated_existing' = nameExistsInApi ? 'updated_existing' : 'saved_new';

  try {
    let response;
    if (operationType === 'updated_existing') {
      // If name exists, attempt to update it.
      // The API uses the original name in the URL for PUT, and the payload contains new data.
      // We need the original name if the user changed the casing or the name itself.
      const originalName = currentStoredApiNames.find(n => n.toLowerCase() === trimmedSaveName.toLowerCase()) || trimmedSaveName;

      // If user changed the name of an existing layout to a new name that ALSO already exists,
      // this simple PUT will fail if the new name is different from originalName.
      // A more robust API would handle name changes better (e.g., separate endpoint or by ID).
      // For now, we assume PUT updates the layout found by originalName in the URL.
      // If the payload.name is different, Prisma might throw an error if 'name' must be unique and you're trying to change it to another existing name.
      // Or, you might need a dedicated API endpoint to handle renaming.

      // For simplicity, if a name change is intended, the user should delete and re-create, or the API needs to support it.
      // We'll assume we are updating the content of a layout with 'originalName'
      
      // Let's assume the user isn't changing the name via this save operation, only its content.
      // If they want to change the name, they should use "Save as new name".
      // So, if operationType is 'updated_existing', we use the matched 'originalName' for the PUT request.
      // The payload's name (`trimmedSaveName`) should ideally match `originalName` unless the API handles name changes via PUT on the old name.

      // Simplified: If we are "updating", we are updating the layout identified by `originalName` in the URL.
      // The payload `name` property within `layoutPayload` should be the *target* name.
      // If `trimmedSaveName` is different from `originalName`, it implies a rename.
      // Prisma's `update({ where: { name: originalName }, data: { name: trimmedSaveName, ... } })` would handle renaming.
      // Our API PUT `src/app/api/layouts/[layoutName]/route.ts` currently does NOT allow changing the `name` field itself,
      // as it updates `where: { name: layoutNameFromParams }`.
      // So, if `trimmedSaveName` != `originalName`, we should treat it as creating a new one and error if `trimmedSaveName` exists,
      // or allow overwriting `trimmedSaveName` if user confirms.

      // Current simplification: User confirms overwrite client-side. We then call PUT if the name (case-insensitive) exists.
      // The PUT request updates the layout identified by its name in the URL.

      response = await fetch(`/api/layouts/${encodeURIComponent(originalName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutPayload), // The payload contains the potentially new name
      });

    } else { // operationType === 'saved_new'
      response = await fetch('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutPayload),
      });
      operationType = 'saved_new';
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      if (response.status === 409) { // Conflict, e.g., name already exists on POST
         return { success: false, message: errorData.message || 'Layout name already exists.', operationType: 'conflict' };
      }
      return { success: false, message: errorData.message || `Failed to ${operationType === 'updated_existing' ? 'update' : 'save'} layout.`, operationType: 'error' };
    }

    const savedOrUpdatedLayoutData = await response.json();
    
    // Reconstruct HallLayout from what API returns (it's likely just the Prisma Hall model)
    const finalLayout: HallLayout = {
        name: savedOrUpdatedLayoutData.name,
        rows: savedOrUpdatedLayoutData.rows,
        cols: savedOrUpdatedLayoutData.cols,
        grid: JSON.parse(savedOrUpdatedLayoutData.gridJson),
        screenCellIds: [], // Derive again
    };
    finalLayout.grid.forEach(row => row.forEach(cell => {
        if (cell.type === 'screen') finalLayout.screenCellIds.push(cell.id);
    }));


    return {
      success: true,
      message: `Layout "${trimmedSaveName}" ${operationType === 'updated_existing' ? 'updated' : 'saved'}.`,
      savedLayout: finalLayout,
      operationType: operationType,
    };

  } catch (e: any) {
    console.error("[SERVICE_SAVE_LAYOUT_API] Error during save operation:", e);
    return {
      success: false,
      message: `Could not save layout via API: ${e.message || 'Unknown error'}`,
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
    const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return { success: false, message: errorData.message || 'Failed to delete layout.' };
    }
    return { success: true, message: `Layout "${layoutName}" deleted.` };
  } catch (e: any) {
    console.error("Service: Failed to delete layout via API:", e);
    return { success: false, message: `Could not delete layout: ${e.message || 'Unknown error'}` };
  }
}
