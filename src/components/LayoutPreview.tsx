
"use client";
import React, { useMemo } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from '@/components/ui/button';
import type { PreviewMode, SeatStatus, CellData } from '@/types/layout';
import type { Film } from '@/data/films'; 
import { Ticket } from 'lucide-react';
import { calculatePreviewStates } from '@/lib/layout-utils';

interface LayoutPreviewProps {
  film?: Film; 
  selectedDay?: string | null; 
  selectedTime?: string | null; 
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ film, selectedDay, selectedTime }) => {
  const { 
    layout, 
    previewMode, 
    setPreviewMode, 
    selectedSeatsForPurchase, 
    toggleSeatSelection, 
    confirmTicketPurchase, 
    clearSeatSelection 
  } = useLayoutContext();

  const displayedGrid = useMemo(() => {
    if (!layout) return [];
    
    // Start with the grid from the context, potentially processed by calculatePreviewStates
    let sourceGrid = layout.grid;
    if (previewMode !== 'normal') {
      // calculatePreviewStates returns a new layout object with a new grid
      // It's important that calculatePreviewStates preserves existing statuses like 'sold'
      sourceGrid = calculatePreviewStates(layout).grid;
    }
    
    return sourceGrid.map(row => row.map(cell => {
      const newCell = { ...cell }; // Copy cell data from sourceGrid

      if (newCell.type === 'seat') {
        let finalStatus = newCell.status;

        // If status is missing, default to 'available'
        if (!finalStatus) {
          finalStatus = 'available';
        }

        // If the seat is not 'sold', check if it's selected
        if (finalStatus !== 'sold') {
          if (selectedSeatsForPurchase && selectedSeatsForPurchase.find(s => s.id === newCell.id)) {
            finalStatus = 'selected';
          }
        }
        // If it was 'selected' but no longer in selectedSeatsForPurchase (and not 'sold'), revert to 'available'
        else if (finalStatus === 'selected' && (!selectedSeatsForPurchase || !selectedSeatsForPurchase.find(s => s.id === newCell.id))) {
           // This case is mostly handled by toggleSeatSelection setting it to 'available',
           // but this ensures consistency if selectedSeatsForPurchase is cleared externally.
           // Crucially, don't change 'sold' seats.
        }
        newCell.status = finalStatus as SeatStatus;
      }
      return newCell;
    }));
  }, [layout, previewMode, selectedSeatsForPurchase]);

  const selectedSeatDisplayNames = useMemo(() => {
    if (!layout || !selectedSeatsForPurchase || selectedSeatsForPurchase.length === 0) return "None";
    
    const seatIdToDisplayNameMap = new Map<string, string>();
    layout.grid.forEach((rowArr, rowIndex) => {
      let seatInRowCount = 0;
      const rowLetter = String.fromCharCode('A'.charCodeAt(0) + rowIndex);
      rowArr.forEach((cell) => {
        if (cell.type === 'seat') {
          seatInRowCount++;
          seatIdToDisplayNameMap.set(cell.id, `${rowLetter}${seatInRowCount}`);
        }
      });
    });

    return selectedSeatsForPurchase
      .map(seat => seatIdToDisplayNameMap.get(seat.id))
      .filter(Boolean)
      .sort((a, b) => { 
        const letterA = a!.match(/[A-Z]+/)![0];
        const numA = parseInt(a!.match(/\d+/)![0]);
        const letterB = b!.match(/[A-Z]+/)![0];
        const numB = parseInt(b!.match(/\d+/)![0]);
        if (letterA !== letterB) return letterA.localeCompare(letterB);
        return numA - numB;
      })
      .join(', ');
  }, [layout, selectedSeatsForPurchase]);

  if (!layout) return <p className="p-4 text-center">Loading layout preview...</p>;

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
      // Use the raw layout grid for finding the cell to toggle,
      // as displayedGrid might have temporary visual states.
      const cellToToggle = layout.grid[rowIndex]?.[colIndex];
      if (cellToToggle?.type === 'seat' && cellToToggle.status !== 'sold') {
           toggleSeatSelection(rowIndex, colIndex);
      }
  };

  const handleConfirmPurchase = () => {
    if (film && film.id && film.title) {
      confirmTicketPurchase(film.id, film.title, selectedDay || null, selectedTime || null);
    } else {
      console.warn("Attempted to confirm purchase without full film details. Using current layout name as fallback.");
      confirmTicketPurchase("unknown_film_id", layout?.name || "Unknown Film", selectedDay || null, selectedTime || null);
    }
  };
  
  const mergedScreenCellsToSkip = new Set<string>();
  const gridCellStyles: { [cellId: string]: React.CSSProperties } = {};

  if (layout && layout.grid) {
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; ) {
        const currentCell = layout.grid[r][c];
        if (currentCell.type === 'screen') {
          let colSpan = 1;
          for (let k = c + 1; k < layout.cols; k++) {
            if (layout.grid[r][k].type === 'screen') {
              colSpan++;
              mergedScreenCellsToSkip.add(layout.grid[r][k].id);
            } else {
              break;
            }
          }
          if (colSpan > 1) {
            gridCellStyles[currentCell.id] = { gridColumn: `span ${colSpan}` };
          }
          c += colSpan;
        } else {
          c++;
        }
      }
    }
  }

  return (
    <Card className="h-full flex flex-col m-2 shadow-lg">
      <CardHeader>
        <CardTitle>{layout.name}</CardTitle>
        <CardDescription>Select available seats below.</CardDescription>
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
                if (mergedScreenCellsToSkip.has(cell.id) && cell.type === 'screen') {
                  return null; 
                }

                let currentSeatNumberDisplay: string | undefined = undefined;
                if (cell.type === 'seat') {
                  seatInRowCount++;
                  currentSeatNumberDisplay = `${rowLetter}${seatInRowCount}`;
                }
                
                const onCellPreviewClick = cell.type === 'seat' && cell.status !== 'sold'
                  ? () => handleSeatClick(rowIndex, colIndex)
                  : undefined;

                return (
                  <GridCell
                    key={cell.id}
                    cell={cell} // Pass the cell from displayedGrid which has the final computed status
                    seatNumber={currentSeatNumberDisplay}
                    isPreviewCell
                    currentPreviewMode={previewMode}
                    onPreviewClick={onCellPreviewClick}
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                    className="min-w-[10px] min-h-[10px]"
                    style={gridCellStyles[cell.id]}
                  />
                );
              });
            })}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 border-t flex-col items-start gap-2">
        <div className="flex justify-between w-full items-center mb-1">
            <p className="text-sm font-medium truncate">
                Selected Seats: <span className="text-primary font-semibold">{selectedSeatDisplayNames}</span>
            </p>
            {selectedSeatsForPurchase && selectedSeatsForPurchase.length > 0 && (
                 <Button variant="outline" size="sm" onClick={clearSeatSelection} className="text-xs">
                    Clear Selection
                 </Button>
            )}
        </div>
        {selectedSeatsForPurchase && selectedSeatsForPurchase.length > 0 && (
          <Button 
            onClick={handleConfirmPurchase} 
            className="w-full text-sm" 
            size="sm" 
            disabled={!film || (selectedSeatsForPurchase && selectedSeatsForPurchase.length === 0)}
          >
            <Ticket className="mr-2 h-4 w-4" /> Confirm Purchase ({selectedSeatsForPurchase ? selectedSeatsForPurchase.length : 0})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
