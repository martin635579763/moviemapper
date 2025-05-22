
"use client";
import React, { useMemo } from 'react'; // Added useMemo
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from '@/components/ui/button';
import type { PreviewMode, SeatStatus } from '@/types/layout'; // Added SeatStatus
import { Ticket } from 'lucide-react';
import { calculatePreviewStates } from '@/lib/layout-utils'; // Added import

export const LayoutPreview: React.FC = () => {
  const { layout, previewMode, setPreviewMode, toggleSeatSelection, selectedSeatsForPurchase, confirmTicketPurchase, clearSeatSelection } = useLayoutContext();

  const displayedGrid = useMemo(() => {
    if (!layout) return [];
    if (previewMode === 'normal') {
      // For normal mode, just use the layout grid, ensuring seats have a status
      return layout.grid.map(row => row.map(cell => {
        if (cell.type === 'seat' && !cell.status) {
          return { ...cell, status: 'available' as SeatStatus };
        }
        return cell;
      }));
    }
    // For other preview modes, calculate preview states (isOccluded, hasGoodView)
    // calculatePreviewStates also ensures default statuses for seats
    const previewLayout = calculatePreviewStates(layout);
    return previewLayout.grid;
  }, [layout, previewMode]);

  if (!layout) return <p>Loading preview...</p>;

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    toggleSeatSelection(rowIndex, colIndex);
  };

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
            {displayedGrid.map((rowArr, rowIndex) => { // Use displayedGrid
              let seatInRowCount = 0;
              const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);

              return rowArr.map((cell, colIndex) => {
                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
                }
                return (
                  <GridCell
                    key={cell.id}
                    cell={cell} // cell from displayedGrid will have preview properties if mode is active
                    seatNumber={currentSeatNumberDisplay}
                    isPreviewCell
                    currentPreviewMode={previewMode} // GridCell uses this to apply styles
                    onPreviewClick={cell.type === 'seat' && cell.status !== 'sold' ? () => handleSeatClick(rowIndex, colIndex) : undefined}
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                    className="min-w-[10px] min-h-[10px]"
                  />
                );
              });
            })}
          </div>
        </ScrollArea>
        {previewMode !== 'normal' && (
          <div className="mt-2 text-xs space-y-0.5 pt-1">
            {previewMode === 'screen-view' && <p><span className="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-sky-400 mr-1 align-middle"></span> Seats with good view.</p>}
            {(previewMode === 'screen-view' || previewMode === 'occlusion') && <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/30 opacity-50 mr-1 align-middle"></span> Occluded seats.</p>}
            <p className="text-muted-foreground">Note: View/occlusion are estimations.</p>
          </div>
        )}
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
