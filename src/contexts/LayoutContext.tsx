
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType } from '@/types/layout'; // SeatStatus removed
import { createDefaultLayout, calculatePreviewStates, DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';
import { useToast } from "@/hooks/use-toast";

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LOCAL_STORAGE_INDEX_KEY = 'seatLayout_index_v1';
const LOCAL_STORAGE_LAYOUT_PREFIX = 'seatLayout_item_v1_';

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  // const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]); // Removed
  const { toast } = useToast();

  const initializeLayout = useCallback((rows: number, cols: number, name?: string) => {
    setLayout(createDefaultLayout(rows, cols, name));
    // setSelectedSeatsForPurchase([]); // Removed
  }, []); // setSelectedSeatsForPurchase removed from deps

  useEffect(() => {
    initializeLayout(DEFAULT_ROWS, DEFAULT_COLS);
  }, [initializeLayout]);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];

      if (cell.type === 'screen' && selectedTool !== 'screen') {
        newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
      }
      
      // Removed status-related logic for seat deselection if tool changes
      // if (cell.type === 'seat' && selectedTool !== 'seat' && selectedTool !== 'select') {
      //   delete cell.status;
      //   setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
      // }
      
      switch (selectedTool) {
        case 'seat':
          cell.type = 'seat';
          cell.category = selectedSeatCategory;
          // delete cell.status; // No status to manage
          break;
        case 'aisle':
          cell.type = 'aisle';
          delete cell.category;
          // delete cell.status; // No status to manage
          // setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id)); // Removed
          break;
        case 'screen':
          cell.type = 'screen';
          delete cell.category;
          // delete cell.status; // No status to manage
          if (!newScreenCellIds.includes(cell.id)) {
            newScreenCellIds.push(cell.id);
          }
          // setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id)); // Removed
          break;
        case 'eraser':
          cell.type = 'empty';
          delete cell.category;
          // delete cell.status; // No status to manage
          // setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id)); // Removed
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
  }, [selectedTool, selectedSeatCategory]); // setSelectedSeatsForPurchase removed from deps
  
  const loadLayout = useCallback((newLayout: HallLayout) => {
    try {
      if (!newLayout || !newLayout.grid || !newLayout.rows || !newLayout.cols) {
        throw new Error("Invalid layout structure.");
      }
      // Removed logic that added default status to seats
      setLayout(newLayout);
      // setSelectedSeatsForPurchase([]); // Removed
      toast({ title: "Success", description: `Layout "${newLayout.name}" loaded.` });
    } catch (error) {
      console.error("Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load layout file. Ensure it's a valid JSON." });
    }
  }, [toast]); // setSelectedSeatsForPurchase removed from deps

  const exportLayout = () => {
    const layoutToExport = { ...layout };
    layoutToExport.grid = layoutToExport.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell; // status would be naturally excluded if not in CellData
        return restOfCell;
    }))

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
    const indexJson = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    return indexJson ? JSON.parse(indexJson) : [];
  }, []);

  const saveLayoutToStorage = useCallback((saveName: string): boolean => {
    if (typeof window === 'undefined') return false;
    if (!saveName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Layout name cannot be empty." });
      return false;
    }
    const names = getStoredLayoutNames();
    if (names.includes(saveName) && !confirm(`Layout "${saveName}" already exists. Overwrite?`)) {
      return false;
    }
    
    const layoutToSave = { ...layout, name: saveName };
    layoutToSave.grid = layoutToSave.grid.map(row => row.map(cell => {
        const { isOccluded, hasGoodView, ...restOfCell } = cell; // status naturally excluded
        return restOfCell;
    }));

    localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + saveName, JSON.stringify(layoutToSave));
    
    if (!names.includes(saveName)) {
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify([...names, saveName]));
    }
    setLayout(prev => ({...prev, name: saveName}));
    toast({ title: "Success", description: `Layout "${saveName}" saved to browser.` });
    return true;
  }, [layout, getStoredLayoutNames, toast]);

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
    const names = getStoredLayoutNames();
    localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(names.filter(name => name !== layoutName)));
    toast({ title: "Success", description: `Layout "${layoutName}" deleted from browser.` });
  }, [getStoredLayoutNames, toast]);

  // All ticket purchasing related functions removed:
  // toggleSeatSelection, confirmTicketPurchase, clearSeatSelection

  return (
    <LayoutContext.Provider value={{
      layout, setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout, getStoredLayoutNames,
      // selectedSeatsForPurchase, toggleSeatSelection, confirmTicketPurchase, clearSeatSelection // Removed
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
