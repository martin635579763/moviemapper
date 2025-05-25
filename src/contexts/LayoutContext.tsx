
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

  const [ctxStoredLayoutNames, setCtxStoredLayoutNames] = useState<string[]>([]);

  const refreshStoredLayoutNames = useCallback(() => {
    if (typeof window === 'undefined') {
      setCtxStoredLayoutNames([]);
      return;
    }
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      setCtxStoredLayoutNames(Array.isArray(names) ? [...names] : []);
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
          if(cell.status !== 'sold') delete cell.status; // Keep sold status
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
  }, []);

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
          return newCell;
        }))
      };
      setLayout(processedLayout);
      setSelectedSeatsForPurchase([]); 
      toast({ title: "Success", description: `Layout "${processedLayout.name}" loaded.` });
    } catch (error: any) {
      console.error("Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to load layout. ${error.message}` });
    }
  }, [toast]); 

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

  const getStoredLayoutNames = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const names = indexJson ? JSON.parse(indexJson) : [];
      return Array.isArray(names) ? names : [];
    } catch (e) {
      console.error("Failed to parse stored layout names from localStorage during get:", e);
      return [];
    }
  }, []);

  const saveLayoutToStorage = useCallback((saveName: string): boolean => {
    if (typeof window === 'undefined') {
      toast({ variant: "destructive", title: "Error", description: "Cannot save, window not available." });
      return false;
    }
    if (!saveName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Layout name cannot be empty." });
      return false;
    }

    const currentStoredNames = getStoredLayoutNames();
    if (currentStoredNames.includes(saveName)) {
      if (!confirm(`Layout "${saveName}" already exists. Overwrite?`)) {
        toast({ title: "Save Cancelled", description: `Overwrite of layout "${saveName}" was cancelled.`, variant: "default" });
        return false;
      }
    }
    
    const layoutToSave = { ...layout, name: saveName };
    layoutToSave.grid = layoutToSave.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell;
        if (restOfCell.type === 'seat' && restOfCell.status === 'selected') {
          return { ...restOfCell, status: 'available' as SeatStatus };
        }
        return restOfCell;
    }));

    try {
      localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + saveName, JSON.stringify(layoutToSave));
      if (!currentStoredNames.includes(saveName)) {
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify([...currentStoredNames, saveName]));
      }
      setLayout(layoutToSave); // Ensure editor context reflects the exact saved state
      refreshStoredLayoutNames(); 
      toast({ title: "Success", description: `Layout "${saveName}" saved to browser.` });
      return true;
    } catch (e: any) {
      console.error("Failed to save layout to localStorage:", e);
      toast({ variant: "destructive", title: "Error", description: `Could not save layout: ${e.message}` });
      return false;
    }
  }, [layout, toast, refreshStoredLayoutNames, getStoredLayoutNames]);

  const loadLayoutFromStorage = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    try {
      const layoutJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
      if (layoutJson) {
        const loadedLayout = JSON.parse(layoutJson);
        loadLayout(loadedLayout); 
        setSelectedSeatsForPurchase([]);
      } else {
        toast({ variant: "destructive", title: "Error", description: `Layout "${layoutName}" not found in browser storage.` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to parse stored layout "${layoutName}". ${error.message}` });
    }
  }, [loadLayout, toast]);
  
  const deleteStoredLayout = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
      const currentStoredNames = getStoredLayoutNames(); 
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(currentStoredNames.filter(name => name !== layoutName)));
      refreshStoredLayoutNames(); 
      toast({ title: "Success", description: `Layout "${layoutName}" deleted from browser.` });
    } catch (e: any) {
      console.error("Failed to delete layout from localStorage:", e);
      toast({ variant: "destructive", title: "Error", description: `Could not delete layout: ${e.message}` });
    }
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
    