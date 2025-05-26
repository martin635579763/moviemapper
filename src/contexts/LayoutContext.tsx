
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
      toast({ title: "Error", description: "Could not fetch layout names.", variant: "destructive" });
      setCtxStoredLayoutNames([]);
    } finally {
      setIsLoadingLayouts(false);
      console.log("[Context] refreshStoredLayoutNames finished.");
    }
  }, [toast]);

  useEffect(() => {
    refreshStoredLayoutNames();
  }, [refreshStoredLayoutNames]);

  const initializeLayout = useCallback((rows?: number, cols?: number, name?: string) => {
    const newLayout = createDefaultLayout(rows, cols, name);
    setLayout(newLayout);
    setSelectedSeatsForPurchase([]);
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
          cell.status = cell.status || 'available';
          break;
        case 'aisle':
        case 'screen':
        case 'eraser':
          const oldType = cell.type;
          const oldStatus = cell.status;

          if (selectedTool === 'aisle') cell.type = 'aisle';
          else if (selectedTool === 'screen') cell.type = 'screen';
          else if (selectedTool === 'eraser') cell.type = 'empty';

          delete cell.category;
          if (cell.status !== 'sold') delete cell.status;
          
          if( oldType === 'seat' && oldStatus === 'selected'){
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
             cell.status = cell.status || 'available';
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
            setSelectedSeatsForPurchase([]);
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
          if (newCell.type === 'seat' && !newCell.status) {
            newCell.status = 'available' as SeatStatus;
          }
          delete (newCell as any).isOccluded;
          delete (newCell as any).hasGoodView;
          return newCell;
        }))
      };
      setLayout(processedLayout);
      setSelectedSeatsForPurchase([]);
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
            if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
              return { ...restOfCell, status: 'available' as SeatStatus };
            }
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
    console.log(`[Context:saveLayoutToStorage] Attempting to save. Input name (trimmed): '${trimmedSaveName}'. Current context layout.name: '${layout?.name}'`);
    
    if (!layout) {
      console.error("[Context:saveLayoutToStorage] Save error: Layout object from context is null.");
      toast({ title: "Error", description: "Cannot save, current layout data is missing.", variant: "destructive" });
      return false;
    }
    if (!trimmedSaveName) {
      toast({ title: "Error", description: "Layout name cannot be empty.", variant: "destructive" });
      console.log("[Context:saveLayoutToStorage] Save error: Trimmed layout name is empty.");
      return false;
    }

    // Construct layoutToSave using the current layout state from context
    const layoutDataForSaving: HallLayout = {
      ...layout, // This takes the current state of 'layout' from the context
      name: trimmedSaveName, // Set its name to the potentially new (or same) save name
      grid: layout.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell as CellData & {isOccluded?: boolean, hasGoodView?:boolean};
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
      }))
    };
    console.log("[Context:saveLayoutToStorage] Layout object prepared for saving:", JSON.stringify(layoutDataForSaving).substring(0, 200) + "...");
    
    console.log("[Context:saveLayoutToStorage] Fetching current stored layout names...");
    setIsLoadingLayouts(true);
    const currentStoredNames = await getStoredLayoutNamesService();
    setIsLoadingLayouts(false); // Set loading to false after fetching names
    console.log("[Context:saveLayoutToStorage] Stored names fetched:", currentStoredNames, `(Type: ${typeof currentStoredNames}, IsArray: ${Array.isArray(currentStoredNames)})`);

    if (!Array.isArray(currentStoredNames)) {
        console.error("[Context:saveLayoutToStorage] Error: currentStoredNames is not an array. Cannot proceed with save logic.");
        toast({title: "Error", description: "Could not retrieve list of saved layouts. Save aborted.", variant: "destructive"});
        return false;
    }

    const insensitiveMatchOriginalCase = currentStoredNames.find(
      storedName => typeof storedName === 'string' && storedName.toLowerCase() === trimmedSaveName.toLowerCase()
    );

    console.log(`[Context:saveLayoutToStorage] Checking for existing name (case-insensitive). TrimmedSaveName: '${trimmedSaveName}'. Match found: '${insensitiveMatchOriginalCase}'`);

    if (insensitiveMatchOriginalCase) {
      console.log(`[Context:saveLayoutToStorage] Existing name found: '${insensitiveMatchOriginalCase}'. Prompting for overwrite.`);
      const confirmed = confirm(
        `Layout "${insensitiveMatchOriginalCase}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
      );
      console.log(`[Context:saveLayoutToStorage] Overwrite confirmation result: ${confirmed}`);
      if (!confirmed) {
        toast({ title: "Save Cancelled", description: `Overwrite of layout "${insensitiveMatchOriginalCase}" was cancelled by the user.`, variant: "default" });
        console.log("[Context:saveLayoutToStorage] Save cancelled by user.");
        return false;
      }
    } else {
      console.log(`[Context:saveLayoutToStorage] No existing layout found for '${trimmedSaveName}'. Will save as new.`);
    }
    
    setIsLoadingLayouts(true);
    // Pass layoutDataForSaving to the service
    const result = await saveLayoutToStorageService(layoutDataForSaving); 
    setIsLoadingLayouts(false);

    console.log("[Context:saveLayoutToStorage] Save service result:", result);

    if (result.success && result.savedLayout) {
      toast({ 
        title: "Success", 
        description: result.operationType === 'updated_existing' ? `Layout "${result.savedLayout.name}" updated.` : `Layout "${result.savedLayout.name}" saved.`,
      });
      setLayout(result.savedLayout); 
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
      setSelectedSeatsForPurchase([]);
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

  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);

  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout();
      const newGrid = prevLayout.grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') return prevLayout;

      if (cell.status === 'available') {
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => {
          if (prevSelected.some(s => s.id === cell.id)) return prevSelected;
          return [...prevSelected, cell];
        });
      } else if (cell.status === 'selected') {
        cell.status = 'available';
        setSelectedSeatsForPurchase(prevSelected => prevSelected.filter(s => s.id !== cell.id));
      }
      return { ...prevLayout, grid: newGrid };
    });
  }, []); 

  const confirmTicketPurchase = useCallback(() => {
    if (!layout) return;
    if(selectedSeatsForPurchase.length === 0) {
      toast({ title: "No Seats Selected", description: "Please select seats before confirming.", variant: "default" });
      return;
    }
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout();
      const newGrid = prevLayout.grid.map(row => row.map(cell => {
        if (selectedSeatsForPurchase.find(s => s.id === cell.id)) {
          return { ...cell, status: 'sold' as SeatStatus };
        }
        return cell;
      }));
      return { ...prevLayout, grid: newGrid };
    });
    const seatCount = selectedSeatsForPurchase.length;
    setSelectedSeatsForPurchase([]);
    toast({ title: "Purchase Confirmed!", description: `${seatCount} seat(s) are now booked.` });
  }, [selectedSeatsForPurchase, toast, layout]); 
  
  const clearSeatSelection = useCallback(() => {
    if (!layout) return;
    setLayout(prevLayout => {
      if (!prevLayout) return createDefaultLayout();
      return {
        ...prevLayout,
        grid: prevLayout.grid.map(row => row.map(cell => {
          if (cell.type === 'seat' && cell.status === 'selected') {
            return { ...cell, status: 'available' as SeatStatus };
          }
          return cell;
        }))
      }
    });
    setSelectedSeatsForPurchase([]);
  }, [layout]);

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
