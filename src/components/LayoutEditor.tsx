
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

  // Pre-calculate which cells to skip based on horizontal screen merging
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
        // No vertical skipping logic needed anymore for single-height screens
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
                  // This cell is the primary (top-left) of a screen block. Calculate its horizontal span.
                  let colSpan = 1;
                  while (colIndex + colSpan < rowArr.length && rowArr[colIndex + colSpan].type === 'screen') {
                    colSpan++;
                  }
                  cellStyle.gridColumn = `span ${colSpan}`;
                  // No gridRow span needed for single-height screens
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
