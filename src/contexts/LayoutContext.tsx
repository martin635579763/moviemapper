
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType, SeatStatus } from '@/types/layout';
import { createDefaultLayout } from '@/lib/layout-utils';
import { useToast } from "@/hooks/use-toast";

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LOCAL_STORAGE_INDEX_KEY = 'seatLayout_index_v1';
const LOCAL_STORAGE_LAYOUT_PREFIX = 'seatLayout_item_v1_';

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);
  const { toast } = useToast();

  const [ctxStoredLayoutNames, setCtxStoredLayoutNames] = useState<string[]>([]);

  const refreshStoredLayoutNames = useCallback(() => {
    if (typeof window === 'undefined') {
      setCtxStoredLayoutNames([]);
      return;
    }
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      setCtxStoredLayoutNames(Array.isArray(names) ? [...names].sort() : []);
    } catch (e) {
      console.error("Failed to parse stored layout names from localStorage:", e);
      setCtxStoredLayoutNames([]);
    }
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

  const loadLayout = useCallback((newLayoutData: HallLayout) => {
    try {
      if (!newLayoutData || !newLayoutData.grid || !newLayoutData.rows || !newLayoutData.cols) {
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
      console.error("Failed to load layout:", error);
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

  const getStoredLayoutNames = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      return Array.isArray(names) ? names.sort() : [];
    } catch (e) {
      console.error("Failed to parse stored layout names from localStorage during get:", e);
      return [];
    }
  }, []);

 const saveLayoutToStorage = useCallback((rawSaveName: string): boolean => {
    if (typeof window === 'undefined') {
      toast({ variant: "destructive", title: "Error", description: "Cannot save, window not available." });
      return false;
    }
    const trimmedSaveName = rawSaveName.trim();
    console.log("[SAVE_LAYOUT] Attempting to save with name:", `'${trimmedSaveName}'`);

    if (!trimmedSaveName) {
      toast({ variant: "destructive", title: "Error", description: "Layout name cannot be empty." });
      console.log("[SAVE_LAYOUT] Save failed: Name is empty.");
      return false;
    }
    
    const layoutToSave: HallLayout = {
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

    try {
      const currentStoredNames = getStoredLayoutNames();
      console.log("[SAVE_LAYOUT] Current stored names in localStorage:", currentStoredNames);

      const insensitiveMatchOriginalCase = currentStoredNames.find(
        storedName => storedName.toLowerCase() === trimmedSaveName.toLowerCase()
      );
      console.log("[SAVE_LAYOUT] Found existing (case-insensitive):", insensitiveMatchOriginalCase);

      if (insensitiveMatchOriginalCase) {
        console.log("[SAVE_LAYOUT] Existing name found. Preparing to call confirm().");
        const confirmed = confirm(
          `Layout "${insensitiveMatchOriginalCase}" already exists. Overwrite with current edits and save as "${trimmedSaveName}"?`
        );
        console.log("[SAVE_LAYOUT] confirm() returned:", confirmed);

        if (!confirmed) {
          toast({ title: "Save Cancelled", description: `Overwrite of layout "${insensitiveMatchOriginalCase}" was cancelled by the user.`, variant: "default" });
          console.log("[SAVE_LAYOUT] Overwrite cancelled by user.");
          return false;
        }

        console.log("[SAVE_LAYOUT] Overwrite confirmed by user. Proceeding to update.");
        // Remove all case-insensitive matches of the original name before saving the new one
        let updatedNames = currentStoredNames.filter(
          name => name.toLowerCase() !== insensitiveMatchOriginalCase.toLowerCase()
        );
        currentStoredNames.forEach(storedName => {
            if (storedName.toLowerCase() === insensitiveMatchOriginalCase.toLowerCase()) {
                console.log(`[SAVE_LAYOUT] Removing old item from localStorage: ${LOCAL_STORAGE_LAYOUT_PREFIX + storedName}`);
                localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + storedName);
            }
        });
        
        updatedNames.push(trimmedSaveName);
        updatedNames.sort();

        console.log(`[SAVE_LAYOUT] Saving updated layout as: ${LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName}`);
        localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName, JSON.stringify(layoutToSave));
        console.log(`[SAVE_LAYOUT] Updating index in localStorage with names:`, updatedNames);
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedNames));
        
        setLayout(layoutToSave);
        refreshStoredLayoutNames();
        toast({ title: "Success", description: `Layout "${trimmedSaveName}" updated in browser.` });
        console.log("[SAVE_LAYOUT] Layout updated successfully.");
        return true;

      } else {
        // Save as a new layout
        console.log("[SAVE_LAYOUT] No existing name found. Saving as new.");
        let updatedNames = [...currentStoredNames, trimmedSaveName];
        updatedNames.sort();
        
        console.log(`[SAVE_LAYOUT] Saving new layout as: ${LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName}`);
        localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + trimmedSaveName, JSON.stringify(layoutToSave));
        console.log(`[SAVE_LAYOUT] Updating index in localStorage with names:`, updatedNames);
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(updatedNames));

        setLayout(layoutToSave);
        refreshStoredLayoutNames();
        toast({ title: "Success", description: `Layout "${trimmedSaveName}" saved as new to browser.` });
        console.log("[SAVE_LAYOUT] Layout saved as new successfully.");
        return true;
      }
    } catch (e: any) {
      console.error("[SAVE_LAYOUT] Error during save operation:", e);
      toast({ variant: "destructive", title: "Error", description: `Could not save layout: ${e.message || 'Unknown error'}` });
      return false;
    }
  }, [layout, toast, refreshStoredLayoutNames, getStoredLayoutNames]);

  const loadLayoutFromStorage = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    try {
      const layoutJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
      if (layoutJson) {
        const loadedLayout = JSON.parse(layoutJson) as HallLayout;
        loadLayout(loadedLayout);
        setSelectedSeatsForPurchase([]);
      } else {
        toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found in browser storage.` });
      }
    } catch (error: any) {
      console.error("Failed to parse stored layout from localStorage:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to parse stored layout "${layoutName}". ${error.message || 'Unknown error'}` });
    }
  }, [loadLayout, toast]);

  const deleteStoredLayout = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
      const currentStoredNames = getStoredLayoutNames();
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(currentStoredNames.filter(name => name !== layoutName).sort()));
      refreshStoredLayoutNames();
      toast({ title: "Success", description: `Layout "${layoutName}" deleted from browser.` });
    } catch (e: any) {
      console.error("Failed to delete layout from localStorage:", e);
      toast({ variant: "destructive", title: "Error", description: `Could not delete layout: ${e.message || 'Unknown error'}` });
    }
  }, [toast, refreshStoredLayoutNames, getStoredLayoutNames]);

  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') return prevLayout;

      if (cell.status === 'available') {
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => {
          // Prevent adding a seat if one with the same ID is already in the list.
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


  return (
    <LayoutContext.Provider value={{
      layout, setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout, getStoredLayoutNames,
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

    