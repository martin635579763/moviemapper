
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType, SeatStatus } from '@/types/layout';
import { createDefaultLayout } from '@/lib/layout-utils';
import { useToast } from "@/hooks/use-toast";
import {
  getStoredLayoutNamesService,
  loadLayoutFromStorageService,
  saveLayoutToStorageService,
  deleteStoredLayoutService,
} from '@/services/layoutStorageService';
import { saveTicketRecordService } from '@/services/ticketService';

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const { toast } = useToast();

  const [ctxStoredLayoutNames, setCtxStoredLayoutNames] = useState<string[]>([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);

  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);

  const refreshStoredLayoutNames = useCallback(async () => {
    console.log("[Context] refreshStoredLayoutNames called.");
    setIsLoadingLayouts(true);
    try {
      const names = await getStoredLayoutNamesService();
      console.log("[Context] refreshStoredLayoutNames: Names from service:", names);
      setCtxStoredLayoutNames(Array.isArray(names) ? [...names] : []);
    } catch (error) {
      console.error("[Context] Error refreshing layout names:", error);
      toast({ title: "Error", description: "Could not fetch layout names.", variant: "destructive" });
      setCtxStoredLayoutNames([]);
    } finally {
      setIsLoadingLayouts(false);
      console.log("[Context] refreshStoredLayoutNames finished.");
    }
  }, [toast]);

  useEffect(() => {
    console.log("[Context] LayoutProvider mounted. Fetching initial stored layout names.");
    refreshStoredLayoutNames();
  }, [refreshStoredLayoutNames]);


  const initializeLayout = useCallback((rows?: number, cols?: number, name?: string) => {
    const newLayout = createDefaultLayout(rows, cols, name);
    setLayout(newLayout);
    setSelectedSeatsForPurchase([]);
    console.log("[Context] Layout initialized to default/new:", newLayout);
  }, []);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      if (!prevLayout) {
        console.warn("[Context:updateCell] prevLayout was null, returning default.");
        return createDefaultLayout();
      }
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];
      const oldType = cell.type;
      const oldStatus = cell.status;

      if (cell.type === 'screen' && selectedTool !== 'screen') {
        newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
      }

      switch (selectedTool) {
        case 'seat':
          cell.type = 'seat';
          cell.category = selectedSeatCategory;
          cell.status = 'available';
          break;
        case 'aisle':
        case 'screen':
        case 'eraser':
          if (selectedTool === 'aisle') cell.type = 'aisle';
          else if (selectedTool === 'screen') cell.type = 'screen';
          else if (selectedTool === 'eraser') cell.type = 'empty';

          delete cell.category;
          delete cell.status;


          if (oldType === 'seat' && oldStatus === 'selected') {
            setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          }

          if (cell.type === 'screen' && !newScreenCellIds.includes(cell.id)) {
            newScreenCellIds.push(cell.id);
          } else if (oldType === 'screen' && cell.type !== 'screen') {
            newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
          }
          break;
        case 'select':
          if (cell.type === 'seat') {
            if (cell.category !== selectedSeatCategory) {
              cell.category = selectedSeatCategory;
            }
            if (!cell.status) cell.status = 'available';
          }
          break;
      }
      return { ...prevLayout, grid: newGrid, screenCellIds: newScreenCellIds };
    });
  }, [selectedTool, selectedSeatCategory]);

  const loadLayout = useCallback(async (newLayoutDataOrName: HallLayout | string | null) => {
    console.log("[Context] loadLayout called with:", newLayoutDataOrName);
    setSelectedSeatsForPurchase([]); // Clear selection when loading any new layout
    setIsLoadingLayouts(true);

    let layoutToProcess: HallLayout | null = null;

    if (typeof newLayoutDataOrName === 'string') {
      console.log(`[Context] Loading layout by name from service: ${newLayoutDataOrName}`);
      layoutToProcess = await loadLayoutFromStorageService(newLayoutDataOrName);
      if (!layoutToProcess) {
        toast({ variant: "destructive", title: "Error", description: `Layout "${newLayoutDataOrName}" not found or is invalid.` });
        setIsLoadingLayouts(false);
        return;
      }
    } else if (newLayoutDataOrName) {
      // If an object is passed, it might be a sample layout or an imported one.
      // The service function `cleanLayoutForTemplate` should ideally be used here too,
      // or ensure the object is already clean. For now, assume service handles cleaning if from storage.
      // Samples should be inherently clean.
      layoutToProcess = JSON.parse(JSON.stringify(newLayoutDataOrName));
    } else {
      toast({ variant: "destructive", title: "Error", description: "Layout data could not be loaded (null/undefined)." });
      setIsLoadingLayouts(false);
      return;
    }

    try {
      if (!layoutToProcess || !layoutToProcess.grid || typeof layoutToProcess.rows !== 'number' || typeof layoutToProcess.cols !== 'number' || !layoutToProcess.name) {
        throw new Error("Invalid layout structure after processing.");
      }
      // The `loadLayoutFromStorageService` now returns a "cleaned" layout.
      setLayout(layoutToProcess);
      toast({ title: "Success", description: `Layout "${layoutToProcess.name}" loaded.` });
      console.log("[Context] Layout loaded and set:", layoutToProcess);
    } catch (error: any) {
      console.error("[Context] Failed to process or set layout:", error);
      toast({ variant: "destructive", title: "Error Loading Layout", description: `Failed to load layout. ${error.message || 'Unknown error'}` });
    } finally {
      setIsLoadingLayouts(false);
    }
  }, [toast]);

  const exportLayout = useCallback(() => {
    if (!layout) {
      toast({ title: "Error", description: "No layout data to export.", variant: "destructive" });
      return;
    }

    const layoutToExport: HallLayout = {
      ...layout,
      name: layout.name || 'Untitled Hall',
      grid: layout.grid.map(row => row.map(cell => {
        const newCell: Partial<CellData> = { id: cell.id, type: cell.type };
        if (cell.type === 'seat') {
          newCell.status = 'available' as SeatStatus;
          newCell.category = cell.category || 'standard';
        }
        return newCell as CellData;
      }))
    };

    const jsonString = JSON.stringify(layoutToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${layoutToExport.name.replace(/\s+/g, '_') || 'hall_layout'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast({ title: "Success", description: `Layout "${layoutToExport.name}" exported.` });
  }, [layout, toast]);

  const saveLayoutToStorage = useCallback(async (saveNameInput: string): Promise<boolean> => {
    const trimmedSaveName = saveNameInput.trim();
    console.log(`[Context:saveLayoutToStorage] Attempting to save. Input name: '${trimmedSaveName}'. Current context layout.name: '${layout?.name}'`);
    console.log("[Context:saveLayoutToStorage] Current layout data in context:", JSON.parse(JSON.stringify(layout)));

    if (!layout) {
      console.error("[Context:saveLayoutToStorage] Save error: Layout object from context is null/undefined.");
      toast({ title: "Error Saving", description: "Current layout data is missing.", variant: "destructive" });
      return false;
    }
    if (!trimmedSaveName) {
      console.log("[Context:saveLayoutToStorage] Save error: Trimmed layout name is empty.");
      toast({ title: "Error Saving", description: "Layout name cannot be empty.", variant: "destructive" });
      return false;
    }

    const layoutDataForSaving: HallLayout = {
      ...layout, // This is the current state of the layout from the editor
      name: trimmedSaveName, // User wants to save it under this name
    };
    console.log("[Context:saveLayoutToStorage] Layout object PREPARED for service (name updated):", JSON.parse(JSON.stringify(layoutDataForSaving)));

    setIsLoadingLayouts(true);
    let wasOverwrite = false;

    const currentStoredNames = await getStoredLayoutNamesService();
    console.log("[Context:saveLayoutToStorage] Stored names fetched for overwrite check:", currentStoredNames);
    const insensitiveMatchOriginalCase = currentStoredNames.find(
      storedName => storedName.toLowerCase() === trimmedSaveName.toLowerCase()
    );

    if (insensitiveMatchOriginalCase) {
      console.log(`[Context:saveLayoutToStorage] Existing name found (case-insensitive): '${insensitiveMatchOriginalCase}'. Input name: '${trimmedSaveName}'. Prompting for overwrite.`);
       const confirmed = confirm( // This is the browser's confirmation dialog
         `Layout "${insensitiveMatchOriginalCase}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
       );
      // const confirmed = true; // DEBUG: Assume overwrite confirmed
      console.log(`[Context:saveLayoutToStorage] Overwrite confirmation result: ${confirmed}`);

      if (!confirmed) {
        toast({ title: "Save Cancelled", description: `Overwrite of layout "${insensitiveMatchOriginalCase}" was cancelled by the user.`, variant: "default" });
        setIsLoadingLayouts(false);
        return false;
      }
      wasOverwrite = true;
      if (insensitiveMatchOriginalCase !== trimmedSaveName) {
        console.log(`[Context:saveLayoutToStorage] Overwriting with different case. Deleting old entry: '${insensitiveMatchOriginalCase}' before saving as '${trimmedSaveName}'.`);
        await deleteStoredLayoutService(insensitiveMatchOriginalCase);
      }
    }

    // The service will clean the layout (e.g., set seats to 'available') before saving.
    const result = await saveLayoutToStorageService(layoutDataForSaving);
    setIsLoadingLayouts(false);
    console.log("[Context:saveLayoutToStorage] Save service result:", result);

    if (result.success && result.savedLayout) {
      setLayout(result.savedLayout); // Reflect the exact saved (and cleaned by service) state in the context
      setSelectedSeatsForPurchase([]);

      toast({
        title: "Success",
        description: wasOverwrite ? `Layout "${result.savedLayout.name}" updated.` : `Layout "${result.savedLayout.name}" saved.`,
      });
      await refreshStoredLayoutNames();
      return true;
    } else {
      toast({
        title: "Error Saving Layout",
        description: result.message || "An unknown error occurred during save.",
        variant: "destructive"
      });
      console.error("[Context:saveLayoutToStorage] Save operation failed in service:", result.message);
      return false;
    }
  }, [layout, toast, refreshStoredLayoutNames]);

  const loadLayoutFromStorage = useCallback(async (layoutName: string) => {
    console.log(`[Context] loadLayoutFromStorage called for: ${layoutName}`);
    setSelectedSeatsForPurchase([]);
    if (!layoutName) {
      console.warn("[Context] loadLayoutFromStorage: layoutName is empty or undefined.");
      toast({ variant: "destructive", title: "Error", description: "No layout name provided to load." });
      return;
    }
    setIsLoadingLayouts(true);
    const loadedLayout = await loadLayoutFromStorageService(layoutName); // Service returns a cleaned layout
    setIsLoadingLayouts(false);
    if (loadedLayout) {
      setLayout(loadedLayout);
      toast({ title: "Success", description: `Layout "${loadedLayout.name}" loaded.` });
      console.log("[Context] Loaded layout from storage and set in context:", loadedLayout);
    } else {
      toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found or is invalid.` });
    }
  }, [toast]);

  const deleteStoredLayout = useCallback(async (layoutName: string) => {
    console.log(`[Context] deleteStoredLayout called for: ${layoutName}`);
    if (!layoutName) {
      toast({ title: "Error", description: "No layout name provided for deletion.", variant: "destructive" });
      return;
    }

    setIsLoadingLayouts(true);
    const result = await deleteStoredLayoutService(layoutName);
    setIsLoadingLayouts(false);

    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      await refreshStoredLayoutNames();
      if (layout?.name === layoutName) {
        initializeLayout();
        console.log(`[Context] Deleted layout was current layout. Initialized to default. Layout name: ${layoutName}`);
      }
    }
  }, [toast, refreshStoredLayoutNames, initializeLayout, layout?.name]);


  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout();
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') {
        return prevLayout;
      }

      if (cell.status === 'selected') {
        cell.status = 'available';
        setSelectedSeatsForPurchase(prevSelected => prevSelected.filter(s => s.id !== cell.id));
      } else { 
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => {
          if (prevSelected.find(s => s.id === cell.id)) return prevSelected;
          return [...prevSelected, { ...cell, status: 'selected' }]; 
        });
      }
      return { ...prevLayout, grid: newGrid };
    });
  }, []);

  const confirmTicketPurchase = useCallback(async (
    filmId: string,
    filmTitle: string,
    day: string | null,
    time: string | null
  ) => {
    if (selectedSeatsForPurchase.length === 0) {
      toast({ title: "No Seats Selected", description: "Please select seats to purchase.", variant: "default" });
      return;
    }
    if (!layout) {
      toast({ title: "Error", description: "Layout not available for purchase.", variant: "destructive" });
      return;
    }

    const seatIdToDisplayNameMap = new Map<string, string>();
    if (layout) {
        layout.grid.forEach((rowArr, rIndex) => {
            let seatNumInRow = 0;
            const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rIndex);
            rowArr.forEach((cell) => {
                if (cell.type === 'seat') {
                    seatNumInRow++;
                    seatIdToDisplayNameMap.set(cell.id, `${rowLetter}${seatNumInRow}`);
                }
            });
        });
    }

    const seatDisplayNames = selectedSeatsForPurchase
        .map(seat => seatIdToDisplayNameMap.get(seat.id) || seat.id) 
        .sort();

    const ticketData = {
      filmId,
      filmTitle,
      hallName: layout.name,
      day,
      time,
      seats: seatDisplayNames,
    };

    const saveResult = await saveTicketRecordService(ticketData);

    if (saveResult.success) {
      setLayout(prevLayout => {
        if (!prevLayout) return createDefaultLayout();
        const newGrid = prevLayout.grid.map(row =>
          row.map(cell => {
            if (selectedSeatsForPurchase.find(selectedSeat => selectedSeat.id === cell.id)) {
              return { ...cell, status: 'sold' as SeatStatus };
            }
            return cell;
          })
        );
        return { ...prevLayout, grid: newGrid };
      });
      toast({ title: "Purchase Confirmed!", description: `Tickets for ${selectedSeatsForPurchase.length} seat(s) for "${filmTitle}" purchased. Record ID: ${saveResult.id}`, });
      setSelectedSeatsForPurchase([]);
    } else {
      toast({ title: "Purchase Error", description: `Could not save ticket record: ${saveResult.message}`, variant: "destructive" });
    }
  }, [selectedSeatsForPurchase, toast, layout]);

  const clearSeatSelection = useCallback(() => {
    if (selectedSeatsForPurchase.length === 0) return;
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout();
      const newGrid = prevLayout.grid.map(row =>
        row.map(cell => {
          if (cell.status === 'selected') { 
            return { ...cell, status: 'available' as SeatStatus };
          }
          return cell;
        })
      );
      return { ...prevLayout, grid: newGrid };
    });
    setSelectedSeatsForPurchase([]);
  }, [selectedSeatsForPurchase]);


  return (
    <LayoutContext.Provider value={{
      layout: layout || createDefaultLayout(),
      setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout,
      storedLayoutNames: ctxStoredLayoutNames,
      refreshStoredLayoutNames,
      selectedSeatsForPurchase, toggleSeatSelection, confirmTicketPurchase, clearSeatSelection,
      isLoadingLayouts
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
};
