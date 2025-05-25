
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
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false); // For loading state

  const refreshStoredLayoutNames = useCallback(async () => {
    console.log("[CONTEXT] Refreshing stored layout names from API");
    setIsLoadingLayouts(true);
    try {
      const names = await getStoredLayoutNamesService();
      setCtxStoredLayoutNames([...names]); 
    } catch (error) {
      console.error("[CONTEXT] Error refreshing layout names:", error);
      toast({ title: "Error", description: "Could not fetch layout names.", variant: "destructive" });
      setCtxStoredLayoutNames([]);
    } finally {
      setIsLoadingLayouts(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshStoredLayoutNames();
  }, [refreshStoredLayoutNames]);


  const initializeLayout = useCallback((rows: number, cols: number, name?: string) => {
    const newLayout = createDefaultLayout(rows, cols, name);
    setLayout(newLayout);
    setSelectedSeatsForPurchase([]);
  }, []);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
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
    // If string, it's a name to load from API/storage
    if (typeof newLayoutData === 'string') {
        setIsLoadingLayouts(true);
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

    // If HallLayout object or null
    if (!newLayoutData) {
        toast({ variant: "destructive", title: "Error", description: "Layout data could not be loaded or is invalid." });
        return;
    }
    try {
      if (!newLayoutData.grid || !newLayoutData.rows || !newLayoutData.cols) {
        throw new Error("Invalid layout structure.");
      }
      // Ensure seats have default status and no preview-specific fields
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
      console.error("Context: Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to load layout. ${error.message || 'Unknown error'}` });
    }
  }, [toast]);

  const exportLayout = useCallback(() => {
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
    console.log("[CONTEXT_SAVE_LAYOUT] Attempting to save with input name:", `'${trimmedSaveName}'`);
    
    if (!trimmedSaveName) {
        toast({ title: "Error", description: "Layout name cannot be empty.", variant: "destructive" });
        return false;
    }

    const currentLayoutState = {
      ...layout,
      name: trimmedSaveName, 
      grid: layout.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell as CellData & {isOccluded?: boolean, hasGoodView?:boolean};
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
      }))
    };

    const nameExists = ctxStoredLayoutNames.some(
      name => name.toLowerCase() === trimmedSaveName.toLowerCase()
    );
    
    let confirmedOverwrite = true;
    if (nameExists) {
        const originalName = ctxStoredLayoutNames.find(n => n.toLowerCase() === trimmedSaveName.toLowerCase()) || trimmedSaveName;
        confirmedOverwrite = confirm(
            `Layout "${originalName}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
        );
        if (!confirmedOverwrite) {
            toast({ title: "Save Cancelled", description: `Overwrite of layout "${originalName}" was cancelled by the user.`, variant: "default" });
            return false;
        }
    }

    setIsLoadingLayouts(true);
    const result = await saveLayoutToStorageService(currentLayoutState, ctxStoredLayoutNames);
    setIsLoadingLayouts(false);

    toast({
      title: result.success ? "Success" : (result.operationType === 'cancelled' ? "Cancelled" : "Error"),
      description: result.message,
      variant: result.success ? "default" : (result.operationType === 'cancelled' || result.operationType === 'conflict' ? "default" : "destructive")
    });

    if (result.success && result.savedLayout) {
      setLayout(result.savedLayout); 
      await refreshStoredLayoutNames(); // Refresh names from API
    }
    
    return result.success;
  }, [layout, ctxStoredLayoutNames, toast, refreshStoredLayoutNames, setLayout]);


  const loadLayoutFromStorage = useCallback(async (layoutName: string) => {
    setIsLoadingLayouts(true);
    const loadedLayout = await loadLayoutFromStorageService(layoutName);
    setIsLoadingLayouts(false);
    if (loadedLayout) {
      loadLayout(loadedLayout); // This calls the existing loadLayout which handles processing
    } else {
      toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found or is invalid.` });
    }
  }, [loadLayout, toast]);

  const deleteStoredLayout = useCallback(async (layoutName: string) => {
    // Ideally, check if the layout is in use by any schedules before deleting
    // This would require fetching schedule data or having an API endpoint to check.
    // For now, direct delete:
    const confirmed = confirm(`Are you sure you want to delete the layout "${layoutName}"? This cannot be undone.`);
    if (!confirmed) {
      toast({ title: "Delete Cancelled", description: `Deletion of layout "${layoutName}" was cancelled.`, variant: "default" });
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
      // If the deleted layout was the currently loaded one, initialize to default
      if (layout.name === layoutName) {
        initializeLayout();
      }
    }
  }, [layout.name, toast, refreshStoredLayoutNames, initializeLayout]);

  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);

  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') return prevLayout;

      if (cell.status === 'available') {
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => {
          if (prevSelected.some(s => s.id === cell.id)) { // Prevent duplicates
            return prevSelected;
          }
          return [...prevSelected, cell];
        });
      } else if (cell.status === 'selected') {
        cell.status = 'available';
        setSelectedSeatsForPurchase(prevSelected => prevSelected.filter(s => s.id !== cell.id));
      }
      return { ...prevLayout, grid: newGrid };
    });
  }, [setLayout]);

  const confirmTicketPurchase = useCallback(() => {
    if(selectedSeatsForPurchase.length === 0) {
      toast({ title: "No Seats Selected", description: "Please select seats before confirming.", variant: "default" });
      return;
    }
    setLayout(prevLayout => {
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
  }, [selectedSeatsForPurchase, toast, setLayout]);
  
  const clearSeatSelection = useCallback(() => {
    setLayout(prevLayout => ({
      ...prevLayout,
      grid: prevLayout.grid.map(row => row.map(cell => {
        if (cell.type === 'seat' && cell.status === 'selected') {
          return { ...cell, status: 'available' as SeatStatus };
        }
        return cell;
      }))
    }));
    setSelectedSeatsForPurchase([]);
  }, [setLayout]);


  return (
    <LayoutContext.Provider value={{
      layout, setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout,
      storedLayoutNames: ctxStoredLayoutNames,
      refreshStoredLayoutNames,
      selectedSeatsForPurchase, toggleSeatSelection, confirmTicketPurchase, clearSeatSelection,
      isLoadingLayouts // Expose loading state
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
