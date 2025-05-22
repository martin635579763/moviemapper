
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';

export const LayoutEditor: React.FC = () => {
  const { layout, updateCell } = useLayoutContext();

  if (!layout) return <p>Loading editor...</p>;

  const mergedCellsToSkip = new Set<string>();

  // Pre-calculate which cells to skip based on screen merging
  for (let r = 0; r < layout.grid.length; r++) {
    for (let c = 0; c < layout.grid[r].length; c++) {
      if (mergedCellsToSkip.has(layout.grid[r][c].id)) {
        continue; // Already marked as skipped by a previous primary screen cell
      }

      const currentCell = layout.grid[r][c];
      if (currentCell.type === 'screen') {
        let colSpan = 1;
        // Calculate horizontal span
        while (c + colSpan < layout.grid[r].length && layout.grid[r][c + colSpan].type === 'screen') {
          mergedCellsToSkip.add(layout.grid[r][c + colSpan].id);
          colSpan++;
        }

        // If this screen block can be double height (spans 2 rows)
        const canBeDoubleHeight = (r + 1 < layout.grid.length);
        if (canBeDoubleHeight) {
          // Mark cells directly below the entire horizontal span for skipping
          for (let i = 0; i < colSpan; i++) {
            if (c + i < layout.grid[r + 1].length) { // check column bounds for the row below
              mergedCellsToSkip.add(layout.grid[r + 1][c + i].id);
            }
          }
        }
      }
    }
  }

  return (
    <Card className="flex-1 m-2 shadow-lg">
      <CardHeader>
        <CardTitle>Layout Editor: {layout.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full h-[calc(100vh-200px)] lg:h-auto">
          <div
            className="grid gap-0.5 bg-muted/20 p-1 rounded"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(20px, 1fr))`,
              maxWidth: `${layout.cols * 40}px` // Max cell width
            }}
            role="grid"
            aria-label={`Cinema hall editor grid, ${layout.rows} rows by ${layout.cols} columns`}
          >
            {layout.grid.map((rowArr, rowIndex) => {
              let seatInRowCount = 0;
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);

              return rowArr.map((cell, colIndex) => {
                // If this cell is part of a merge and is not the primary (top-left) cell, skip rendering.
                if (mergedCellsToSkip.has(cell.id)) {
                  return <React.Fragment key={cell.id} />;
                }

                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
                }

                let cellStyle: React.CSSProperties = {};
                if (cell.type === 'screen') {
                  // This cell is the primary (top-left) of a screen block. Calculate its span.
                  let colSpan = 1;
                  while (colIndex + colSpan < rowArr.length && rowArr[colIndex + colSpan].type === 'screen') {
                    colSpan++;
                  }
                  cellStyle.gridColumn = `span ${colSpan}`;

                  // Check if it should span 2 rows
                  if (rowIndex + 1 < layout.grid.length) {
                     // Check if all cells in the potential span area below are indeed part of the merge target
                     // This simplified check assumes if a row below exists, we attempt double height.
                     // The `mergedCellsToSkip` pre-calculation handles the actual skipping.
                     cellStyle.gridRow = 'span 2';
                  }
                }

                return (
                  <GridCell
                    key={cell.id}
                    cell={cell}
                    seatNumber={currentSeatNumberDisplay}
                    onClick={() => updateCell(rowIndex, colIndex)}
                    isEditorCell
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                    style={cellStyle}
                  />
                );
              });
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
