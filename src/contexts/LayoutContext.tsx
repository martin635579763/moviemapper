
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType, SeatStatus } from '@/types/layout';
import { createDefaultLayout, DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';
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

  // Reactive list of stored layout names
  const [ctxStoredLayoutNames, setCtxStoredLayoutNames] = useState<string[]>([]);

  const refreshStoredLayoutNames = useCallback(() => {
    if (typeof window === 'undefined') {
      setCtxStoredLayoutNames([]);
      return;
    }
    const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    const names = indexJson ? JSON.parse(indexJson) : [];
    setCtxStoredLayoutNames(names);
  }, []);

  useEffect(() => {
    refreshStoredLayoutNames(); // Initial load of stored names
  }, [refreshStoredLayoutNames]);

  const initializeLayout = useCallback((rows: number, cols: number, name?: string) => {
    const newLayout = createDefaultLayout(rows, cols, name);
    setLayout(newLayout);
    setSelectedSeatsForPurchase([]);
  }, []);

  useEffect(() => {
    initializeLayout(DEFAULT_ROWS, DEFAULT_COLS);
  }, [initializeLayout]);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];

      if (cell.type === 'seat' && selectedTool !== 'seat' && selectedTool !== 'select') {
        delete cell.status; 
        setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
      }
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
          if (selectedTool === 'aisle') cell.type = 'aisle';
          else if (selectedTool === 'screen') cell.type = 'screen';
          else if (selectedTool === 'eraser') cell.type = 'empty';
          
          delete cell.category;
          delete cell.status;
          setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          
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
  }, []);

  const loadLayout = useCallback((newLayoutData: HallLayout) => {
    try {
      if (!newLayoutData || !newLayoutData.grid || !newLayoutData.rows || !newLayoutData.cols) {
        throw new Error("Invalid layout structure.");
      }
      const processedLayout = {
        ...newLayoutData,
        name: newLayoutData.name || 'Untitled Hall', // Ensure name exists
        grid: newLayoutData.grid.map(row => row.map(cell => {
          if (cell.type === 'seat' && !cell.status) { 
            return { ...cell, status: 'available' as SeatStatus };
          }
          return cell;
        }))
      };
      setLayout(processedLayout);
      clearSeatSelection();
      toast({ title: "Success", description: `Layout "${processedLayout.name}" loaded.` });
    } catch (error) {
      console.error("Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load layout file. Ensure it's a valid JSON." });
    }
  }, [toast, clearSeatSelection]);

  const exportLayout = () => {
    const layoutToExport = { ...layout };
    layoutToExport.grid = layoutToExport.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell;
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
    }));

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
  };

  // This is now a direct localStorage reader, not for reactive UI updates primarily
  const getStoredLayoutNames = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    return indexJson ? JSON.parse(indexJson) : [];
  }, []);

  const saveLayoutToStorage = useCallback((saveName: string): boolean => {
    if (typeof window === 'undefined') return false;
    if (!saveName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Layout name cannot be empty." });
      return false;
    }
    const currentStoredNames = getStoredLayoutNames(); // Use direct getter for check
    if (currentStoredNames.includes(saveName) && !confirm(`Layout "${saveName}" already exists. Overwrite?`)) {
      return false;
    }
    
    const layoutToSave = { ...layout, name: saveName };
    layoutToSave.grid = layoutToSave.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell;
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
    }));

    localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + saveName, JSON.stringify(layoutToSave));
    
    if (!currentStoredNames.includes(saveName)) {
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify([...currentStoredNames, saveName]));
    }
    setLayout(prev => ({...prev, name: saveName}));
    refreshStoredLayoutNames(); // Update reactive list in context
    toast({ title: "Success", description: `Layout "${saveName}" saved to browser.` });
    return true;
  }, [layout, toast, refreshStoredLayoutNames, getStoredLayoutNames]);

  const loadLayoutFromStorage = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    const layoutJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
    if (layoutJson) {
      try {
        const loadedLayout = JSON.parse(layoutJson);
        loadLayout(loadedLayout); 
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: `Failed to parse stored layout "${layoutName}".` });
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found in browser storage.` });
    }
  }, [loadLayout, toast]);
  
  const deleteStoredLayout = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
    const currentStoredNames = getStoredLayoutNames(); // Use direct getter
    localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(currentStoredNames.filter(name => name !== layoutName)));
    refreshStoredLayoutNames(); // Update reactive list in context
    toast({ title: "Success", description: `Layout "${layoutName}" deleted from browser.` });
  }, [toast, refreshStoredLayoutNames, getStoredLayoutNames]);

  const toggleSeatSelection = useCallback((rowIndex: number, colIndex: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[rowIndex][colIndex];

      if (cell.type !== 'seat' || cell.status === 'sold') return prevLayout;

      if (cell.status === 'available') {
        cell.status = 'selected';
        setSelectedSeatsForPurchase(prevSelected => [...prevSelected, cell]);
      } else if (cell.status === 'selected') {
        cell.status = 'available';
        setSelectedSeatsForPurchase(prevSelected => prevSelected.filter(s => s.id !== cell.id));
      }
      return { ...prevLayout, grid: newGrid };
    });
  }, []);

  const confirmTicketPurchase = useCallback(() => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(row => row.map(cell => {
        if (selectedSeatsForPurchase.find(s => s.id === cell.id)) {
          return { ...cell, status: 'sold' as SeatStatus };
        }
        return cell;
      }));
      return { ...prevLayout, grid: newGrid };
    });
    setSelectedSeatsForPurchase([]);
    toast({ title: "Purchase Confirmed!", description: "Your selected seats are now booked." });
  }, [selectedSeatsForPurchase, toast]);


  return (
    <LayoutContext.Provider value={{
      layout, setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout, getStoredLayoutNames,
      storedLayoutNames: ctxStoredLayoutNames, // Provide reactive list
      refreshStoredLayoutNames, // Provide refresher function
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
