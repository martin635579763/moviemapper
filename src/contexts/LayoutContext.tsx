
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HallLayout, CellData, EditorTool, SeatCategory, PreviewMode, LayoutContextType } from '@/types/layout';
import { createDefaultLayout, calculatePreviewStates, DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';
import { useToast } from "@/hooks/use-toast";

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<HallLayout>(createDefaultLayout());
  const [selectedTool, setSelectedTool] = useState<EditorTool>('seat');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory>('standard');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const { toast } = useToast();

  const initializeLayout = useCallback((rows: number, cols: number, name?: string) => {
    setLayout(createDefaultLayout(rows, cols, name));
  }, []);

  useEffect(() => {
    // Initialize with a default layout on mount
    initializeLayout(DEFAULT_ROWS, DEFAULT_COLS);
  }, [initializeLayout]);

  const updateCell = (row: number, col: number) => {
    setLayout(prevLayout => {
      const newGrid = prevLayout.grid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      let newScreenCellIds = [...prevLayout.screenCellIds];

      // If current cell is screen and tool is not screen, remove from screenCellIds
      if (cell.type === 'screen' && selectedTool !== 'screen') {
        newScreenCellIds = newScreenCellIds.filter(id => id !== cell.id);
      }
      
      switch (selectedTool) {
        case 'seat':
          cell.type = 'seat';
          cell.category = selectedSeatCategory;
          break;
        case 'aisle':
          cell.type = 'aisle';
          delete cell.category;
          break;
        case 'screen':
          cell.type = 'screen';
          delete cell.category;
          if (!newScreenCellIds.includes(cell.id)) {
            newScreenCellIds.push(cell.id);
          }
          break;
        case 'eraser':
          cell.type = 'empty';
          delete cell.category;
          break;
        case 'select':
          // Potentially for modifying properties of an existing seat, e.g. category
          if (cell.type === 'seat') {
            cell.category = selectedSeatCategory;
          }
          break;
      }
      return { ...prevLayout, grid: newGrid, screenCellIds: newScreenCellIds };
    });
  };
  
  const loadLayout = (newLayout: HallLayout) => {
    try {
      // Basic validation
      if (!newLayout || !newLayout.grid || !newLayout.rows || !newLayout.cols) {
        throw new Error("Invalid layout structure.");
      }
      setLayout(newLayout);
      toast({ title: "Success", description: `Layout "${newLayout.name}" loaded.` });
    } catch (error) {
      console.error("Failed to load layout:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load layout file. Ensure it's a valid JSON." });
    }
  };

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
      calculatePreview
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
