import type { HallLayout, CellData, CellType, SeatCategory, SeatStatus } from '@/types/layout';

export const DEFAULT_ROWS = 10;
export const DEFAULT_COLS = 15;

export function createDefaultLayout(rows: number = DEFAULT_ROWS, cols: number = DEFAULT_COLS, name: string = 'New Hall'): HallLayout {
  const grid: CellData[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowCells: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      const cell: CellData = {
        id: `r${r}c${c}`,
        type: 'empty',
      };
      // Seats should get their status when type is set to 'seat'
      rowCells.push(cell);
    }
    grid.push(rowCells);
  }
  return {
    name,
    rows,
    cols,
    grid,
    screenCellIds: [],
  };
}

export function calculatePreviewStates(layout: HallLayout): HallLayout {
  const newGrid = layout.grid.map(row => row.map(cell => ({ ...cell, isOccluded: false, hasGoodView: false })));

  if (layout.screenCellIds.length === 0) {
    // Ensure all seat statuses are at least 'available' if not set, for previews
     newGrid.forEach(row => row.forEach(cell => {
      if (cell.type === 'seat' && !cell.status) {
        cell.status = 'available';
      }
    }));
    return { ...layout, grid: newGrid };
  }

  // Simplified: Find the "frontmost" screen row.
  let minScreenRow = layout.rows;
  layout.screenCellIds.forEach(id => {
    const match = id.match(/r(\d+)c(\d+)/);
    if (match) {
      minScreenRow = Math.min(minScreenRow, parseInt(match[1], 10));
    }
  });
  
  for (let c = 0; c < layout.cols; c++) {
    let occludedBySeatInColumn = false;
    for (let r = 0; r < layout.rows; r++) {
      const cell = newGrid[r][c];
      if (cell.type === 'seat') {
        if (!cell.status) cell.status = 'available'; // Default status for preview if missing
        if (r < minScreenRow) { 
            // This seat might occlude seats behind it, but doesn't get occluded itself by screen logic
        } else if (occludedBySeatInColumn) {
          cell.isOccluded = true;
        } else {
          cell.hasGoodView = true; // Simplified: if not occluded by another seat in front AND behind or in screen row
        }
        occludedBySeatInColumn = true; // Any seat in this column occludes seats further back
      }
    }
  }
  return { ...layout, grid: newGrid };
}
