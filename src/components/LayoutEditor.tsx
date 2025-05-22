
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';

export const LayoutEditor: React.FC = () => {
  const { layout, updateCell } = useLayoutContext();

  if (!layout) return <p>Loading editor...</p>;

  let seatCounter = 0;

  return (
    <Card className="flex-1 m-2 shadow-lg">
      <CardHeader>
        <CardTitle>Layout Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full h-[calc(100vh-200px)] lg:h-auto"> {/* Adjust height as needed */}
          <div
            className="grid gap-0.5 bg-muted/20 p-1 rounded"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(20px, 1fr))`,
              maxWidth: `${layout.cols * 40}px` // Max cell width
            }}
            role="grid"
            aria-label={`Cinema hall editor grid, ${layout.rows} rows by ${layout.cols} columns`}
          >
            {layout.grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                let currentSeatNumber: number | undefined = undefined;
                if (cell.type === 'seat') {
                  seatCounter++;
                  currentSeatNumber = seatCounter;
                }
                return (
                  <GridCell
                    key={cell.id}
                    cell={cell}
                    seatNumber={currentSeatNumber}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    isEditorCell
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
