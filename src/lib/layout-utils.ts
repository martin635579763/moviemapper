import type { HallLayout, CellData, CellType, SeatCategory } from '@/types/layout'; // SeatStatus removed

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
      // No status set here
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
    // No status default setting needed here anymore
    return { ...layout, grid: newGrid };
  }

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
        // No status check or default setting needed
        if (r < minScreenRow) { 
            // This seat might occlude seats behind it, but doesn't get occluded itself by screen logic
        } else if (occludedBySeatInColumn) {
          cell.isOccluded = true;
        } else {
          cell.hasGoodView = true; 
        }
        occludedBySeatInColumn = true; 
      }
    }
  }
  return { ...layout, grid: newGrid };
}
