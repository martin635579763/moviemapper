
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
} from '@/services/layoutStorageService'; // Ensure this path is correct

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const { toast } = useToast();

  const [ctxStoredLayoutNames, setCtxStoredLayoutNames] = useState<string[]>([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false); 

  const refreshStoredLayoutNames = useCallback(async () => {
    console.log("[Context] refreshStoredLayoutNames called.");
    setIsLoadingLayouts(true);
    try {
      const names = await getStoredLayoutNamesService();
      console.log("[Context] refreshStoredLayoutNames: Names from service:", names);
      setCtxStoredLayoutNames(Array.isArray(names) ? [...names] : []);
    } catch (error) {
      console.error("[Context] Error refreshing layout names:", error);
      toast({ title: "Error", description: "Could not fetch layout names from storage.", variant: "destructive" });
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
    // setSelectedSeatsForPurchase([]); // Seat selection not yet re-implemented
  }, []);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout(); 
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];

      if (cell.type === 'screen' && selectedTool !== 'screen') {
        newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
      }

      switch (selectedTool) {
        case 'seat':
          cell.type = 'seat';
          cell.category = selectedSeatCategory;
          // cell.status = cell.status || 'available'; // Seat status not yet re-implemented
          break;
        case 'aisle':
        case 'screen':
        case 'eraser':
          const oldType = cell.type;
          // const oldStatus = cell.status; // Seat status not yet re-implemented

          if (selectedTool === 'aisle') cell.type = 'aisle';
          else if (selectedTool === 'screen') cell.type = 'screen';
          else if (selectedTool === 'eraser') cell.type = 'empty';

          delete cell.category;
          // if (cell.status !== 'sold') delete cell.status; // Seat status not yet re-implemented
          
          // if( oldType === 'seat' && oldStatus === 'selected'){ // Seat status not yet re-implemented
          //   setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          // }
          
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
             // cell.status = cell.status || 'available'; // Seat status not yet re-implemented
          }
          break;
      }
      return { ...prevLayout, grid: newGrid, screenCellIds: newScreenCellIds };
    });
  }, [selectedTool, selectedSeatCategory]);

  const loadLayout = useCallback(async (newLayoutData: HallLayout | null | string) => {
    console.log("[Context] loadLayout called with:", newLayoutData);
    if (typeof newLayoutData === 'string') {
        setIsLoadingLayouts(true);
        console.log(`[Context] Loading layout by name from service: ${newLayoutData}`);
        const loadedLayout = await loadLayoutFromStorageService(newLayoutData);
        setIsLoadingLayouts(false);
        if (loadedLayout) {
            setLayout(loadedLayout);
            // setSelectedSeatsForPurchase([]); // Seat selection not yet re-implemented
            toast({ title: "Success", description: `Layout "${loadedLayout.name}" loaded.` });
        } else {
            toast({ variant: "destructive", title: "Error", description: `Layout "${newLayoutData}" not found or is invalid.` });
        }
        return;
    }

    if (!newLayoutData) {
        toast({ variant: "destructive", title: "Error", description: "Layout data could not be loaded or is invalid." });
        return;
    }
    try {
      if (!newLayoutData.grid || !newLayoutData.rows || !newLayoutData.cols) {
        throw new Error("Invalid layout structure.");
      }
      const processedLayout = {
        ...newLayoutData,
        name: newLayoutData.name || 'Untitled Hall',
        grid: newLayoutData.grid.map(row => row.map(cell => {
          const newCell = {...cell};
          // if (newCell.type === 'seat' && !newCell.status) { // Seat status not yet re-implemented
          //   newCell.status = 'available' as SeatStatus;
          // }
          delete (newCell as any).isOccluded;
          delete (newCell as any).hasGoodView;
          return newCell;
        }))
      };
      setLayout(processedLayout);
      // setSelectedSeatsForPurchase([]); // Seat selection not yet re-implemented
      toast({ title: "Success", description: `Layout "${processedLayout.name}" loaded.` });
    } catch (error: any) {
      console.error("[Context] Failed to load layout object:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to load layout. ${error.message || 'Unknown error'}` });
    }
  }, [toast]);

  const exportLayout = useCallback(() => {
    if (!layout) {
        toast({ title: "Error", description: "No layout data to export.", variant: "destructive"});
        return;
    }
    const layoutToExport: HallLayout = {
        ...layout,
        grid: layout.grid.map(row => row.map(cell => {
            const { isOccluded, hasGoodView, ...restOfCell } = cell as CellData & {isOccluded?: boolean, hasGoodView?:boolean};
            // if (restOfCell.type === 'seat' && restOfCell.status === 'selected') { // Seat status not yet re-implemented
            //   return { ...restOfCell, status: 'available' as SeatStatus };
            // }
            return restOfCell;
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
  },[layout, toast]);

  const saveLayoutToStorage = useCallback(async (saveNameInput: string): Promise<boolean> => {
    const trimmedSaveName = saveNameInput.trim();
    console.log(`[Context:saveLayoutToStorage] Attempting to save. Input name: '${trimmedSaveName}'. Current context layout.name: '${layout?.name}'`);
    
    if (!layout) {
      console.error("[Context:saveLayoutToStorage] Save error: Layout object from context is null/undefined.");
      toast({ title: "Error", description: "Cannot save, current layout data is missing.", variant: "destructive" });
      return false;
    }
    if (!trimmedSaveName) {
      console.log("[Context:saveLayoutToStorage] Save error: Trimmed layout name is empty.");
      toast({ title: "Error", description: "Layout name cannot be empty.", variant: "destructive" });
      return false;
    }

    const layoutDataForSaving: HallLayout = {
      ...layout, 
      name: trimmedSaveName, 
      grid: layout.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell as CellData & {isOccluded?: boolean, hasGoodView?:boolean};
        // if (restOfCell.type === 'seat' && restOfCell.status === 'selected') { // Seat status not yet re-implemented
        //   return { ...restOfCell, status: 'available' as SeatStatus };
        // }
        return restOfCell;
      }))
    };
    console.log("[Context:saveLayoutToStorage] Layout object prepared for saving:", layoutDataForSaving);
    
    setIsLoadingLayouts(true);
    let currentStoredNames = await getStoredLayoutNamesService();
    setIsLoadingLayouts(false); 
    
    if (!Array.isArray(currentStoredNames)) {
        console.error("[Context:saveLayoutToStorage] Error: currentStoredNames from service is not an array. Value:", currentStoredNames);
        currentStoredNames = []; // Default to empty array to prevent further errors
    }
    console.log("[Context:saveLayoutToStorage] Stored names fetched:", currentStoredNames);

    const insensitiveMatchOriginalCase = currentStoredNames.find(
      storedName => typeof storedName === 'string' && storedName.toLowerCase() === trimmedSaveName.toLowerCase()
    );
    console.log(`[Context:saveLayoutToStorage] Checking for existing name (case-insensitive). TrimmedSaveName: '${trimmedSaveName}'. Match found: '${insensitiveMatchOriginalCase}'`);

    if (insensitiveMatchOriginalCase) {
      console.log(`[Context:saveLayoutToStorage] Existing name found: '${insensitiveMatchOriginalCase}'. Bypassing confirm dialog and assuming overwrite.`);
      // const confirmed = confirm(
      //   `Layout "${insensitiveMatchOriginalCase}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
      // );
      const confirmed = true; // TEMPORARY BYPASS FOR DEBUGGING
      console.log(`[Context:saveLayoutToStorage] Overwrite confirmation result (bypassed): ${confirmed}`);
      
      if (!confirmed) {
        toast({ title: "Save Cancelled", description: `Overwrite of layout "${insensitiveMatchOriginalCase}" was cancelled by the user.`, variant: "default" });
        console.log("[Context:saveLayoutToStorage] Save cancelled by user (or confirm() returned false).");
        return false;
      }
    } else {
      console.log(`[Context:saveLayoutToStorage] No existing layout found for '${trimmedSaveName}'. Will save as new.`);
    }
    
    setIsLoadingLayouts(true);
    // Pass layoutDataForSaving to the service
    // The service also needs currentStoredNames if it's going to manage index updates
    const result = await saveLayoutToStorageService(layoutDataForSaving); 
    setIsLoadingLayouts(false);

    console.log("[Context:saveLayoutToStorage] Save service result:", result);

    if (result.success && result.savedLayout) {
      setLayout(result.savedLayout); // IMPORTANT: Update context with the exact saved layout
      toast({ 
        title: "Success", 
        description: result.operationType === 'updated_existing' ? `Layout "${result.savedLayout.name}" updated.` : `Layout "${result.savedLayout.name}" saved.`,
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
    if (!layoutName) {
        console.warn("[Context] loadLayoutFromStorage: layoutName is empty or undefined.");
        toast({ variant: "destructive", title: "Error", description: "No layout name provided to load."});
        return;
    }
    setIsLoadingLayouts(true);
    const loadedLayout = await loadLayoutFromStorageService(layoutName);
    setIsLoadingLayouts(false);
    if (loadedLayout) {
      setLayout(loadedLayout); 
      // setSelectedSeatsForPurchase([]); // Seat selection not yet re-implemented
      toast({ title: "Success", description: `Layout "${loadedLayout.name}" loaded.` });
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
      }
    }
  }, [toast, refreshStoredLayoutNames, initializeLayout, layout]);

  // Seat selection logic (currently commented out, can be re-implemented later)
  // const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);
  // const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => { ... }, []); 
  // const confirmTicketPurchase = useCallback(() => { ... }, [selectedSeatsForPurchase, toast, layout]); 
  // const clearSeatSelection = useCallback(() => { ... }, [layout]);

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
      // selectedSeatsForPurchase, toggleSeatSelection, confirmTicketPurchase, clearSeatSelection, // Seat selection not yet re-implemented
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

