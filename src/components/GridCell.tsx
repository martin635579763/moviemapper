
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
  seatNumber?: number | string;
  isEditorCell?: boolean;
  isPreviewCell?: boolean;
  currentPreviewMode?: 'normal' | 'screen-view' | 'occlusion';
  onPreviewClick?: () => void;
  style?: React.CSSProperties; // Explicitly define style prop
}

const getSeatColorAndStyle = (category?: SeatCategory) => {
  let colorClass = '';
  switch (category) {
    case 'premium':
      colorClass = 'text-accent fill-accent/20'; 
      break;
    case 'accessible':
      colorClass = 'text-blue-400 fill-blue-400/20';
      break;
    case 'loveseat':
      colorClass = 'text-pink-400 fill-pink-400/20';
      break;
    case 'standard':
    default:
      colorClass = 'text-primary fill-primary/20'; 
      break;
  }
  return cn(colorClass);
};

export const GridCell: React.FC<GridCellProps> = ({ cell, seatNumber, isEditorCell = false, isPreviewCell = false, currentPreviewMode = 'normal', className, onPreviewClick, style, ...props }) => {
  
  const baseClasses = "w-full h-full flex items-center justify-center border border-border/50 rounded-sm transition-colors duration-150 relative overflow-hidden";
  
  let shouldApplyAspectSquare: boolean;

  if (isEditorCell) {
    // In editor, only apply aspect-square if it's NOT a merged screen cell
    if (cell.type === 'screen' && style && typeof style.gridColumn === 'string' && style.gridColumn.startsWith('span')) {
      shouldApplyAspectSquare = false; // Merged screen in editor: use full width, natural height
    } else {
      shouldApplyAspectSquare = true; // All other editor cells (seats, aisles, single screens) are square
    }
  } else if (isPreviewCell) {
    // In preview, only apply aspect-square to non-screen cells
    if (cell.type === 'screen') {
      shouldApplyAspectSquare = false; // Screen in preview (merged or single) is not aspect-square
    } else {
      shouldApplyAspectSquare = true; // Seats, aisles in preview are square
    }
  } else {
    shouldApplyAspectSquare = true; // Default, though one of the above should always be true
  }

  const editorHoverStyle = isEditorCell ? "hover:bg-secondary/50" : "";
  const previewClickableStyle = isPreviewCell && cell.type === 'seat' && onPreviewClick ? "cursor-pointer hover:brightness-110" : "";
  
  let content = null;
  let cellDynamicStyle = "";

  switch (cell.type) {
    case 'seat':
      cellDynamicStyle = getSeatColorAndStyle(cell.category);
      
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
      if (isPreviewCell) {
        cellDynamicStyle = "bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600"; 
        content = <ScreenIcon className="w-full h-full text-gray-400 dark:text-gray-500" />; 
      } else { // Editor cell
        cellDynamicStyle = "bg-foreground/80 text-background";
        // If it's an editor cell and part of a merged screen (shouldApplyAspectSquare is false),
        // constrain icon height and let width be auto to maintain aspect ratio without stretching the cell.
        const iconClass = (isEditorCell && !shouldApplyAspectSquare) ? "h-3/4 w-auto max-w-full" : "w-3/4 h-3/4";
        content = <ScreenIcon className={iconClass} />;
      }
      break;
    case 'empty':
    default:
      cellDynamicStyle = isEditorCell ? "bg-background hover:bg-muted/20" : "bg-muted/10";
      break;
  }
  
  const combinedClassName = cn(
    baseClasses, 
    { 'aspect-square': shouldApplyAspectSquare }, 
    editorHoverStyle, 
    previewClickableStyle, 
    cellDynamicStyle, 
    className
  );

  const commonProps = {
    className: combinedClassName,
    style: style, // Apply the style from parent (for gridColumn spans)
    ...props       // Spread other HTML attributes
  };

  if (isEditorCell) {
    return (
      <button
        aria-label={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}${seatNumber ? `, seat ${seatNumber}` : ''}`}
        {...commonProps}
        onClick={onPreviewClick || (props as any).onClick} // Ensure onClick from props is used if onPreviewClick is not there for editor
      >
        {content}
      </button>
    );
  }

  // For preview cells that are seats (and thus potentially clickable for selection - though selection is currently removed)
  if (isPreviewCell && cell.type === 'seat' && onPreviewClick) {
    return (
      <button
        onClick={onPreviewClick}
        aria-label={`Seat ${seatNumber}, type ${cell.type}, category ${cell.category}`}
        {...commonProps}
      >
        {content}
      </button>
    );
  }
  
  // For all other preview cells (aisles, non-merged screens, empty) or cells not matching above conditions
  return (
    <div 
        title={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}${seatNumber ? `, seat ${seatNumber}` : ''}`}
        {...commonProps}
    >
      {content}
    </div>
  );
};
