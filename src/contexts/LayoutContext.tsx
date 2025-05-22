
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType, SeatStatus } from '@/types/layout';
import { createDefaultLayout, calculatePreviewStates, DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';
import { useToast } from "@/hooks/use-toast";

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LOCAL_STORAGE_INDEX_KEY = 'seatLayout_index_v1'; // Added _v1 for potential future structure changes
const LOCAL_STORAGE_LAYOUT_PREFIX = 'seatLayout_item_v1_';

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const [selectedSeatsForPurchase, setSelectedSeatsForPurchase] = useState<CellData[]>([]);
  const { toast } = useToast();

  const initializeLayout = useCallback((rows: number, cols: number, name?: string) => {
    setLayout(createDefaultLayout(rows, cols, name));
    setSelectedSeatsForPurchase([]); // Clear selection on new layout
  }, []);

  useEffect(() => {
    initializeLayout(DEFAULT_ROWS, DEFAULT_COLS);
  }, [initializeLayout]);

  const updateCell = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];

      const oldType = cell.type;
      const oldCategory = cell.category;

      // If current cell is screen and tool is not screen, remove from screenCellIds
      if (cell.type === 'screen' && selectedTool !== 'screen') {
        newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
      }
      
      // Clear status if type changes from seat or becomes non-seat
      if (cell.type === 'seat' && selectedTool !== 'seat' && selectedTool !== 'select') {
        delete cell.status;
        setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
      }
      
      switch (selectedTool) {
        case 'seat':
          cell.type = 'seat';
          cell.category = selectedSeatCategory;
          cell.status = 'available'; // New seats are available
          break;
        case 'aisle':
          cell.type = 'aisle';
          delete cell.category;
          delete cell.status;
          setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          break;
        case 'screen':
          cell.type = 'screen';
          delete cell.category;
          delete cell.status;
          if (!newScreenCellIds.includes(cell.id)) {
            newScreenCellIds.push(cell.id);
          }
          setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          break;
        case 'eraser':
          cell.type = 'empty';
          delete cell.category;
          delete cell.status;
          setSelectedSeatsForPurchase(prev => prev.filter(s => s.id !== cell.id));
          break;
        case 'select':
          if (cell.type === 'seat') {
             if (cell.category !== selectedSeatCategory) { // only update if category actually changes
                cell.category = selectedSeatCategory;
                // Retain status if only category changes
             }
          }
          break;
      }
      return { ...prevLayout, grid: newGrid, screenCellIds: newScreenCellIds };
    });
  }, [selectedTool, selectedSeatCategory, setSelectedSeatsForPurchase]);
  
  const loadLayout = useCallback((newLayout: HallLayout) => {
    try {
      if (!newLayout || !newLayout.grid || !newLayout.rows || !newLayout.cols) {
        throw new Error("Invalid layout structure.");
      }
      // Ensure seats in loaded layout have a status
      const layoutWithStatuses = {
        ...newLayout,
        grid: newLayout.grid.map(row => row.map(cell => {
          if (cell.type === 'seat' && !cell.status) {
            return { ...cell, status: 'available' as SeatStatus };
          }
          return cell;
        }))
      };
      setLayout(layoutWithStatuses);
      setSelectedSeatsForPurchase([]); // Clear selection on new layout
      toast({ title: "Success", description: `Layout "${newLayout.name}" loaded.` });
    } catch (error) {
      console.error("Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load layout file. Ensure it's a valid JSON." });
    }
  }, [toast, setSelectedSeatsForPurchase]);

  const exportLayout = () => {
    const jsonString = JSON.stringify(layout, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${layout.name.replace(/\s+/g, '_') || 'hall_layout'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast({ title: "Success", description: `Layout "${layout.name}" exported.` });
  };

  // localStorage functions
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
    
    const layoutToSave = { ...layout, name: saveName }; // Ensure the layout's internal name matches saveName
    localStorage.setItem(LOCAL_STORAGE_LAYOUT_PREFIX + saveName, JSON.stringify(layoutToSave));
    
    if (!names.includes(saveName)) {
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify([...names, saveName]));
    }
    setLayout(prev => ({...prev, name: saveName})); // Update current layout name in context
    toast({ title: "Success", description: `Layout "${saveName}" saved to browser.` });
    return true;
  }, [layout, getStoredLayoutNames, toast]);

  const loadLayoutFromStorage = useCallback((layoutName: string) => {
    if (typeof window === 'undefined') return;
    const layoutJson = localStorage.getItem(LOCAL_STORAGE_LAYOUT_PREFIX + layoutName);
    if (layoutJson) {
      try {
        const loadedLayout = JSON.parse(layoutJson);
        loadLayout(loadedLayout); // Use the existing loadLayout function for consistency
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
    // Potentially refresh a list if displayed
  }, [getStoredLayoutNames, toast]);

  // Ticket selling functions
  const toggleSeatSelection = useCallback((row: number, col: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];

      if (cell.type === 'seat') {
        if (cell.status === 'available') {
          cell.status = 'selected';
          setSelectedSeatsForPurchase(prevSelected => [...prevSelected, cell]);
        } else if (cell.status === 'selected') {
          cell.status = 'available';
          setSelectedSeatsForPurchase(prevSelected => prevSelected.filter(s => s.id !== cell.id));
        }
        // 'sold' seats are not interactive for selection
      }
      return { ...prevLayout, grid: newGrid };
    });
  }, [setSelectedSeatsForPurchase]);

  const confirmTicketPurchase = useCallback(() => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => {
        if (c.type === 'seat' && c.status === 'selected') {
          return { ...c, status: 'sold' as SeatStatus };
        }
        return c;
      }));
      return { ...prevLayout, grid: newGrid };
    });
    setSelectedSeatsForPurchase([]);
    toast({ title: "Purchase Confirmed", description: "Selected seats are now marked as sold." });
  }, [setSelectedSeatsForPurchase, toast]);
  
  const clearSeatSelection = useCallback(() => {
     setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => {
        if (c.type === 'seat' && c.status === 'selected') {
          return { ...c, status: 'available' as SeatStatus };
        }
        return c;
      }));
      return { ...prevLayout, grid: newGrid };
    });
    setSelectedSeatsForPurchase([]);
  }, [setSelectedSeatsForPurchase]);


  const calculatePreview = useCallback(() => {
    setLayout(prevLayout => calculatePreviewStates(prevLayout));
  }, []);

  useEffect(() => {
    if (previewMode !== 'normal') {
      calculatePreview();
    }
  }, [previewMode, layout.grid, layout.screenCellIds, calculatePreview]);


  return (
    <LayoutContext.Provider value={{
      layout, setLayout,
      selectedTool, setSelectedTool,
      selectedSeatCategory, setSelectedSeatCategory,
      previewMode, setPreviewMode,
      initializeLayout, updateCell,
      loadLayout, exportLayout,
      calculatePreview,
      saveLayoutToStorage, loadLayoutFromStorage, deleteStoredLayout, getStoredLayoutNames,
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
