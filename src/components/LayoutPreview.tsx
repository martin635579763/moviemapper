
"use client";
import React, { useMemo } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from '@/components/ui/button';
import type { PreviewMode, SeatStatus } from '@/types/layout';
import { Ticket } from 'lucide-react';
import { calculatePreviewStates } from '@/lib/layout-utils';

export const LayoutPreview: React.FC = () => {
  const { layout, previewMode, setPreviewMode, toggleSeatSelection, selectedSeatsForPurchase, confirmTicketPurchase, clearSeatSelection } = useLayoutContext();

  const displayedGrid = useMemo(() => {
    if (!layout) return [];
    if (previewMode === 'normal') {
      return layout.grid.map(row => row.map(cell => {
        if (cell.type === 'seat' && !cell.status) {
          return { ...cell, status: 'available' as SeatStatus };
        }
        return cell;
      }));
    }
    const previewLayout = calculatePreviewStates(layout);
    return previewLayout.grid;
  }, [layout, previewMode]);

  if (!layout) return <p>Loading preview...</p>;

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    toggleSeatSelection(rowIndex, colIndex);
  };

  const mergedCellsToSkip = new Set<string>();

  return (
    <Card className="h-full flex flex-col m-2 shadow-lg">
      <CardHeader>
        <CardTitle>{layout.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-4 pt-0 overflow-hidden">
        <div className="mb-3">
          <Label className="mb-1.5 block text-sm font-medium">Preview Mode:</Label>
          <RadioGroup
            value={previewMode}
            onValueChange={(value: PreviewMode) => setPreviewMode(value)}
            className="flex space-x-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="normal" id="mode-normal" />
              <Label htmlFor="mode-normal" className="text-xs">Normal</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="screen-view" id="mode-screen-view" />
              <Label htmlFor="mode-screen-view" className="text-xs">Screen View</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="occlusion" id="mode-occlusion" />
              <Label htmlFor="mode-occlusion" className="text-xs">Occlusion</Label>
            </div>
          </RadioGroup>
        </div>
        <ScrollArea className="flex-1 w-full border rounded-md p-1 bg-muted/20">
          <div
            className="grid gap-px bg-background"
             style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(10px, 1fr))`,
            }}
            role="grid"
            aria-label={`Cinema hall preview grid, ${layout.rows} rows by ${layout.cols} columns`}
          >
            {displayedGrid.map((rowArr, rowIndex) => {
              let seatInRowCount = 0;
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);

              return rowArr.map((cell, colIndex) => {
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
                  let colSpan = 1;
                  while (colIndex + colSpan < rowArr.length && rowArr[colIndex + colSpan].type === 'screen') {
                    mergedCellsToSkip.add(rowArr[colIndex + colSpan].id);
                    colSpan++;
                  }
                  cellStyle.gridColumn = `span ${colSpan}`;
                }

                return (
                  <GridCell
                    key={cell.id}
                    cell={cell}
                    seatNumber={currentSeatNumberDisplay}
                    isPreviewCell
                    currentPreviewMode={previewMode}
                    onPreviewClick={cell.type === 'seat' && cell.status !== 'sold' ? () => handleSeatClick(rowIndex, colIndex) : undefined}
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                    className="min-w-[10px] min-h-[10px]"
                    style={cellStyle}
                  />
                );
              });
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t flex-col items-start gap-2">
        <div className="flex justify-between w-full items-center">
            <p className="text-sm font-medium">
                Selected Seats: <span className="text-primary font-semibold">{selectedSeatsForPurchase.length}</span>
            </p>
            {selectedSeatsForPurchase.length > 0 && (
                 <Button variant="outline" size="sm" onClick={clearSeatSelection} className="text-xs">
                    Clear Selection
                 </Button>
            )}
        </div>
        {selectedSeatsForPurchase.length > 0 && (
          <Button onClick={confirmTicketPurchase} className="w-full text-sm" size="sm">
            <Ticket className="mr-2 h-4 w-4" /> Confirm Purchase
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
