
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';

export const LayoutEditor: React.FC = () => {
  const { layout, updateCell } = useLayoutContext();

  if (!layout) return <p>Loading editor...</p>;

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
               // Ensure a minimum size for cells, but allow them to grow. Max width to prevent overly large cells.
              maxWidth: `${layout.cols * 40}px` // Max width for a cell is 40px
            }}
            role="grid"
            aria-label={`Cinema hall editor grid, ${layout.rows} rows by ${layout.cols} columns`}
          >
            {layout.grid.map((rowArr, rowIndex) => {
              let seatInRowCount = 0;
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);

              return rowArr.map((cell, colIndex) => {
                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
                }
                // No special styling or skipping for screen cells in this simplified version
                return (
                  <GridCell
                    key={cell.id}
                    cell={cell}
                    seatNumber={currentSeatNumberDisplay}
                    onClick={() => updateCell(rowIndex, colIndex)}
                    isEditorCell
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
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
