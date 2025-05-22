import type { HTMLAttributes } from 'react';
import React from 'react';
import type { CellData, SeatCategory } from '@/types/layout';
import { cn } from '@/lib/utils';
import { SeatIcon } from './icons/SeatIcon';
import { ScreenIcon } from './icons/ScreenIcon';
import { AisleIcon } from './icons/AisleIcon';
import { Accessibility } from 'lucide-react';

interface GridCellProps extends HTMLAttributes<HTMLButtonElement> {
  cell: CellData;
  isEditorCell?: boolean;
  isPreviewCell?: boolean;
  currentPreviewMode?: 'normal' | 'screen-view' | 'occlusion';
}

const getSeatColor = (category?: SeatCategory) => {
  switch (category) {
    case 'premium':
      return 'text-accent fill-accent/20'; // Amber
    case 'accessible':
      return 'text-blue-400 fill-blue-400/20';
    case 'loveseat':
      return 'text-pink-400 fill-pink-400/20';
    case 'standard':
    default:
      return 'text-primary fill-primary/20'; // Deep Blue
  }
};

export const GridCell: React.FC<GridCellProps> = ({ cell, isEditorCell = false, isPreviewCell = false, currentPreviewMode = 'normal', className, ...props }) => {
  const baseStyle = "w-full h-full aspect-square flex items-center justify-center border border-border/50 rounded-sm transition-colors duration-150";
  const editorHoverStyle = isEditorCell ? "hover:bg-secondary/50" : "";
  
  let content = null;
  let cellStyle = "";

  switch (cell.type) {
    case 'seat':
      const seatColor = getSeatColor(cell.category);
      cellStyle = cn(seatColor, 
        isPreviewCell && currentPreviewMode === 'occlusion' && cell.isOccluded && 'opacity-30 bg-red-500/30',
        isPreviewCell && currentPreviewMode === 'screen-view' && cell.hasGoodView && 'ring-2 ring-green-500',
        isPreviewCell && currentPreviewMode === 'screen-view' && !cell.hasGoodView && cell.isOccluded && 'opacity-30 bg-red-500/30'
      );
      content = cell.category === 'accessible' ? <Accessibility className="w-3/4 h-3/4" /> : <SeatIcon className="w-3/4 h-3/4" />;
      break;
    case 'aisle':
      cellStyle = "bg-muted/30";
      content = isEditorCell || isPreviewCell ? <AisleIcon className="w-1/2 h-1/2 text-muted-foreground" /> : null; // Show icon in editor/preview
      break;
    case 'screen':
      cellStyle = "bg-foreground/80 text-background";
      content = <ScreenIcon className="w-3/4 h-3/4" />;
      break;
    case 'empty':
    default:
      cellStyle = isEditorCell ? "bg-background hover:bg-muted/20" : "bg-muted/10";
      break;
  }

  if (isEditorCell) {
    return (
      <button
        aria-label={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}`}
        className={cn(baseStyle, editorHoverStyle, cellStyle, className)}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(baseStyle, cellStyle, className)} title={`Cell ${cell.id}, type ${cell.type}`}>
      {content}
    </div>
  );
};
