
"use client";
import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { GridCell } from './GridCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import type { PreviewMode } from '@/types/layout';

export const LayoutPreview: React.FC = () => {
  const { layout, previewMode, setPreviewMode } = useLayoutContext();

  if (!layout) return <p>Loading preview...</p>;

  return (
    <Card className="flex-1 m-2 shadow-lg w-1/3 lg:w-1/2 xl:w-2/5"> {/* Adjust width */}
      <CardHeader>
        <CardTitle>Layout Preview: {layout.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label className="mb-2 block">Preview Mode:</Label>
          <RadioGroup
            defaultValue="normal"
            value={previewMode}
            onValueChange={(value: PreviewMode) => setPreviewMode(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="mode-normal" />
              <Label htmlFor="mode-normal">Normal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="screen-view" id="mode-screen-view" />
              <Label htmlFor="mode-screen-view">Screen View</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="occlusion" id="mode-occlusion" />
              <Label htmlFor="mode-occlusion">Occlusion</Label>
            </div>
          </RadioGroup>
        </div>
        <ScrollArea className="w-full h-[calc(100vh-260px)] lg:h-auto"> {/* Adjust height */}
          <div
            className="grid gap-0.5 bg-muted/10 p-1 rounded"
             style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(10px, 1fr))`,
              maxWidth: `${layout.cols * 30}px` // Max cell width for preview
            }}
            role="grid"
            aria-label={`Cinema hall preview grid, ${layout.rows} rows by ${layout.cols} columns`}
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
                return (
                  <GridCell
                    key={cell.id}
                    cell={cell}
                    seatNumber={currentSeatNumberDisplay}
                    isPreviewCell
                    currentPreviewMode={previewMode}
                    aria-rowindex={rowIndex + 1}
                    aria-colindex={colIndex + 1}
                  />
                );
              });
            })}
          </div>
        </ScrollArea>
        {previewMode !== 'normal' && (
          <div className="mt-4 text-xs space-y-1">
            {previewMode === 'screen-view' && <p><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-green-500 mr-1 align-middle"></span> Seats with good view.</p>}
            {(previewMode === 'screen-view' || previewMode === 'occlusion') && <p><span className="inline-block w-3 h-3 rounded-sm bg-red-500/30 opacity-50 mr-1 align-middle"></span> Occluded seats.</p>}
            <p className="text-muted-foreground">Note: Screen view and occlusion are simplified estimations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
