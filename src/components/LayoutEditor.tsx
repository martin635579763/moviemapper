
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';

export const LayoutEditor: React.FC = () => {
  const { layout, updateCell } = useLayoutContext();

  if (!layout) return <p>Loading editor...</p>;

  // Pre-calculate styles for merged screen cells and identify cells to skip
  const mergedCellsToSkip = new Set<string>();
  const gridCellStyles: { [cellId: string]: React.CSSProperties } = {};

  if (layout && layout.grid) {
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; /* c is incremented based on colSpan */) {
        const currentCell = layout.grid[r][c];
        if (currentCell.type === 'screen') {
          let colSpan = 1;
          // Look ahead for more screen cells in the same row
          for (let k = c + 1; k < layout.cols; k++) {
            if (layout.grid[r][k].type === 'screen') {
              colSpan++;
              mergedCellsToSkip.add(layout.grid[r][k].id);
            } else {
              break; // Non-screen cell, stop counting
            }
          }
          if (colSpan > 1) {
            gridCellStyles[currentCell.id] = { gridColumn: `span ${colSpan}` };
          }
          c += colSpan; // Move column index past the entire merged block
        } else {
          c++; // Not a screen cell or not the start of a merge, move to the next cell
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
        <ScrollArea className="w-full h-[calc(100vh-200px)] lg:h-auto"> {/* Adjusted height */}
          <div
            className="grid gap-0.5 bg-muted/20 p-1 rounded"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(20px, 1fr))`,
              maxWidth: `${layout.cols * 40}px` // Max width for a cell is 40px
            }}
            role="grid"
            aria-label={`Cinema hall editor grid, ${layout.rows} rows by ${layout.cols} columns`}
          >
            {layout.grid.map((rowArr, rowIndex) => {
              let seatInRowCount = 0;
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);

              return rowArr.map((cell, colIndex) => {
                if (mergedCellsToSkip.has(cell.id)) {
                  return null; // Skip rendering this cell as it's part of a merged screen
                }

                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
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
                    style={gridCellStyles[cell.id]} // Apply styles for merged screens
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
