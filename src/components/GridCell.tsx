
import type { HTMLAttributes } from 'react';
import React from 'react';
import type { CellData, SeatCategory } from '@/types/layout'; // SeatStatus removed
import { cn } from '@/lib/utils';
import { SeatIcon } from './icons/SeatIcon';
import { ScreenIcon } from './icons/ScreenIcon';
import { AisleIcon } from './icons/AisleIcon';
import { Accessibility } from 'lucide-react';

interface GridCellProps extends HTMLAttributes<HTMLButtonElement> {
  cell: CellData;
  seatNumber?: number | string;
  isEditorCell?: boolean;
  isPreviewCell?: boolean;
  currentPreviewMode?: 'normal' | 'screen-view' | 'occlusion';
  onPreviewClick?: () => void; // Still here, but won't do selection
}

const getSeatColorAndStyle = (category?: SeatCategory /*, status?: SeatStatus - Removed */) => {
  let colorClass = '';
  // let statusStyle = ''; // Removed statusStyle

  switch (category) {
    case 'premium':
      colorClass = 'text-accent fill-accent/20'; // Amber
      break;
    case 'accessible':
      colorClass = 'text-blue-400 fill-blue-400/20';
      break;
    case 'loveseat':
      colorClass = 'text-pink-400 fill-pink-400/20';
      break;
    case 'standard':
    default:
      colorClass = 'text-primary fill-primary/20'; // Deep Blue
      break;
  }

  // Removed status switch
  // switch (status) {
  //   case 'selected':
  //     statusStyle = 'ring-2 ring-offset-1 ring-offset-background ring-green-500 shadow-lg';
  //     break;
  //   case 'sold':
  //     statusStyle = 'opacity-40 cursor-not-allowed';
  //     colorClass = 'text-muted-foreground fill-muted-foreground/10';
  //     break;
  //   case 'available':
  //   default:
  //     break;
  // }
  return cn(colorClass /*, statusStyle - Removed */);
};

export const GridCell: React.FC<GridCellProps> = ({ cell, seatNumber, isEditorCell = false, isPreviewCell = false, currentPreviewMode = 'normal', className, onPreviewClick, ...props }) => {
  const baseStyle = "w-full h-full aspect-square flex items-center justify-center border border-border/50 rounded-sm transition-colors duration-150 relative overflow-hidden";
  const editorHoverStyle = isEditorCell ? "hover:bg-secondary/50" : "";
  // Simplified previewClickableStyle since status is gone
  const previewClickableStyle = isPreviewCell && cell.type === 'seat' && onPreviewClick ? "cursor-pointer hover:brightness-110" : "";
  
  let content = null;
  let cellDynamicStyle = "";

  switch (cell.type) {
    case 'seat':
      cellDynamicStyle = getSeatColorAndStyle(cell.category /*, cell.status - Removed */);
      
      // Occlusion/view logic doesn't depend on status, so it remains
      if (isPreviewCell && currentPreviewMode === 'occlusion' && cell.isOccluded) {
         cellDynamicStyle = cn(cellDynamicStyle, 'opacity-30 bg-red-500/30');
      }
      if (isPreviewCell && currentPreviewMode === 'screen-view' && cell.hasGoodView) {
         cellDynamicStyle = cn(cellDynamicStyle, 'ring-2 ring-offset-1 ring-offset-background ring-sky-400');
      }
      if (isPreviewCell && currentPreviewMode === 'screen-view' && !cell.hasGoodView && cell.isOccluded) {
         cellDynamicStyle = cn(cellDynamicStyle, 'opacity-30 bg-red-500/30');
      }

      content = (
        <>
          {cell.category === 'accessible' ? <Accessibility className="w-3/4 h-3/4" /> : <SeatIcon className="w-3/4 h-3/4" />}
          {seatNumber && (
            <span className="absolute text-xs font-semibold text-white" style={{ textShadow: '0px 0px 2px rgba(0,0,0,0.7)' }}>
              {seatNumber}
            </span>
          )}
        </>
      );
      break;
    case 'aisle':
      cellDynamicStyle = "bg-muted/30";
      content = isEditorCell || isPreviewCell ? <AisleIcon className="w-1/2 h-1/2 text-muted-foreground" /> : null;
      break;
    case 'screen':
      cellDynamicStyle = "bg-foreground/80 text-background";
      content = <ScreenIcon className="w-3/4 h-3/4" />;
      break;
    case 'empty':
    default:
      cellDynamicStyle = isEditorCell ? "bg-background hover:bg-muted/20" : "bg-muted/10";
      break;
  }
  
  const combinedClassName = cn(baseStyle, editorHoverStyle, previewClickableStyle, cellDynamicStyle, className);

  if (isEditorCell) {
    return (
      <button
        aria-label={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}${seatNumber ? `, seat ${seatNumber}` : ''}`}
        className={combinedClassName}
        {...props}
      >
        {content}
      </button>
    );
  }

  // Simplified preview cell for seats - no 'sold' status check
  if (isPreviewCell && cell.type === 'seat' && onPreviewClick) {
    return (
      <button
        onClick={onPreviewClick}
        aria-label={`Seat ${seatNumber}, type ${cell.type}, category ${cell.category}`} // Removed status from aria-label
        className={combinedClassName}
        // disabled={cell.status === 'sold'} // Removed disabled check
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={combinedClassName} title={`Cell ${cell.id}, type ${cell.type}${seatNumber ? `, seat ${seatNumber}` : ''}`}>
      {content}
    </div>
  );
};
