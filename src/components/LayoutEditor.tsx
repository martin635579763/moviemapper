
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';

export const LayoutEditor: React.FC = () => {
  const { layout, updateCell } = useLayoutContext();

  if (!layout) return <p>Loading editor...</p>;

  // This Set will store the IDs of cells that are "covered" by a preceding merged cell
  const mergedCellsToSkip = new Set<string>();

  // Pre-calculate which cells to skip
  // This logic is simplified to only merge two adjacent horizontal screen cells
  layout.grid.forEach((rowArr, rowIndex) => {
    for (let colIndex = 0; colIndex < rowArr.length - 1; colIndex++) {
      const currentCell = rowArr[colIndex];
      const nextCell = rowArr[colIndex + 1];
      if (currentCell.type === 'screen' && nextCell.type === 'screen') {
        // If current cell is screen and next cell is screen, nextCell will be skipped
        // and currentCell will span. Add nextCell's ID to the skip set.
        if (!mergedCellsToSkip.has(currentCell.id)) { // Ensure we don't double-add if S-S-S
             mergedCellsToSkip.add(nextCell.id);
        }
      }
    }
  });

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
                if (mergedCellsToSkip.has(cell.id)) {
                  // This cell is part of a merge and is not the primary cell, so skip rendering.
                  // We still need a key for React, but it won't render anything visible.
                  return <React.Fragment key={cell.id} />;
                }

                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
                }

                let cellStyle: React.CSSProperties = {};
                if (cell.type === 'screen') {
                  const nextCell = rowArr[colIndex + 1];
                  if (nextCell && nextCell.type === 'screen' && mergedCellsToSkip.has(nextCell.id)) {
                    // This screen cell should span 2 columns
                    cellStyle.gridColumn = 'span 2';
                  }
                }

                return (
                  <GridCell
                    key={cell.id} // Ensure key is always cell.id
                    cell={cell}
                    seatNumber={currentSeatNumberDisplay}
                    onClick={() => updateCell(rowIndex, colIndex)}
                    isEditorCell
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                    style={cellStyle} // Apply the style for spanning
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
