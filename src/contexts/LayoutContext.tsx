
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

  const refreshStoredLayoutNames = useCallback(() => {
    console.log("[CONTEXT] Refreshing stored layout names");
    const names = getStoredLayoutNamesService();
    setCtxStoredLayoutNames([...names]); 
  }, []);

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

  const loadLayout = useCallback((newLayoutData: HallLayout | null) => {
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

  const saveLayoutToStorage = useCallback((saveNameInput: string): boolean => {
    console.log("[CONTEXT_SAVE_LAYOUT] Attempting to save with input name:", `'${saveNameInput}'`);
    
    const layoutToSaveRaw: HallLayout = {
      ...layout,
      name: saveNameInput, // The service will trim this.
      grid: layout.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell as CellData & {isOccluded?: boolean, hasGoodView?:boolean};
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
      }))
    };

    const result = saveLayoutToStorageService(layoutToSaveRaw, ctxStoredLayoutNames);

    toast({
      title: result.success ? "Success" : "Save Operation",
      description: result.message,
      variant: result.success ? "default" : (result.operationType === 'cancelled' ? "default" : "destructive")
    });

    if (result.success && result.savedLayout) {
      setLayout(result.savedLayout); 
      if (result.updatedNames) { // Check if updatedNames was returned
        refreshStoredLayoutNames(); 
      }
    } else if (result.operationType === 'error' && result.message === "Layout name cannot be empty.") {
      // If name was empty, don't change current layout, just show toast
    } else if (!result.success && result.operationType !== 'cancelled') {
      // For other errors, we might not want to change the current layout name input
      // This behavior can be refined based on UX preference.
    }
    
    return result.success;
  }, [layout, ctxStoredLayoutNames, toast, refreshStoredLayoutNames, setLayout]);


  const loadLayoutFromStorage = useCallback((layoutName: string) => {
    const loadedLayout = loadLayoutFromStorageService(layoutName);
    if (loadedLayout) {
      loadLayout(loadedLayout);
    } else {
      toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found in browser storage or is invalid.` });
    }
  }, [loadLayout, toast]);

  const deleteStoredLayout = useCallback((layoutName: string) => {
    const result = deleteStoredLayoutService(layoutName, ctxStoredLayoutNames);
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
    if (result.success) {
      refreshStoredLayoutNames();
    }
  }, [ctxStoredLayoutNames, toast, refreshStoredLayoutNames]);

  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);

  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') return prevLayout;

      if (cell.status === 'available') {
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => {
          if (prevSelected.some(s => s.id === cell.id)) {
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
      selectedSeatsForPurchase, toggleSeatSelection, confirmTicketPurchase, clearSeatSelection
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
