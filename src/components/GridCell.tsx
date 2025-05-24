
import type { HTMLAttributes } from 'react';
import React from 'react';
import type { CellData, SeatCategory, SeatStatus } from '@/types/layout'; 
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

const getSeatColorAndStyle = (category?: SeatCategory, status?: SeatStatus) => {
  let colorClass = '';
  let statusClass = '';

  switch (category) {
    case 'premium':
      colorClass = 'text-yellow-400 fill-yellow-400/20 group-hover:text-yellow-300'; 
      break;
    case 'accessible':
      colorClass = 'text-blue-400 fill-blue-400/20 group-hover:text-blue-300';
      break;
    case 'loveseat':
      colorClass = 'text-pink-400 fill-pink-400/20 group-hover:text-pink-300';
      break;
    case 'standard':
    default:
      colorClass = 'text-primary fill-primary/20 group-hover:text-primary/80'; 
      break;
  }

  switch (status) {
    case 'selected':
      statusClass = 'ring-2 ring-offset-1 ring-offset-background ring-green-500 brightness-110';
      break;
    case 'sold':
      statusClass = 'opacity-40 cursor-not-allowed bg-muted/50 fill-muted/30 text-muted-foreground';
      break;
    case 'available':
    default:
      // No specific class for available, relies on base color and hover.
      break;
  }
  return cn(colorClass, statusClass);
};

export const GridCell: React.FC<GridCellProps> = ({ cell, seatNumber, isEditorCell = false, isPreviewCell = false, currentPreviewMode = 'normal', className, onPreviewClick, style, ...props }) => {
  
  const baseClasses = "w-full h-full flex items-center justify-center border border-border/50 rounded-sm transition-colors duration-150 relative overflow-hidden group";
  
  let shouldApplyAspectSquare: boolean;
  const isMergedScreen = cell.type === 'screen' && style && typeof style.gridColumn === 'string' && style.gridColumn.startsWith('span');

  if (isMergedScreen) {
    // Merged screens (editor or preview) are NOT square cells, they span columns.
    shouldApplyAspectSquare = false;
  } else {
    // All other cells, including single (non-merged) screen cells, default to square.
    // For non-screen types, this ensures they remain square.
    // For single screen cells, this makes their icon proportions consistent between editor and preview.
    shouldApplyAspectSquare = true;
  }

  const editorHoverStyle = isEditorCell ? "hover:bg-secondary/50" : "";
  const previewClickableStyle = isPreviewCell && cell.type === 'seat' && cell.status !== 'sold' && onPreviewClick ? "cursor-pointer hover:brightness-110" : "";
  
  let content = null;
  let cellDynamicStyle = "";

  switch (cell.type) {
    case 'seat':
      cellDynamicStyle = getSeatColorAndStyle(cell.category, cell.status);
      
      if (isPreviewCell && currentPreviewMode === 'occlusion' && cell.isOccluded && cell.status !== 'sold') {
         cellDynamicStyle = cn(cellDynamicStyle, 'opacity-30 bg-red-500/30');
      }
      if (isPreviewCell && currentPreviewMode === 'screen-view' && cell.hasGoodView && cell.status !== 'sold') {
         cellDynamicStyle = cn(cellDynamicStyle, 'ring-2 ring-offset-1 ring-offset-background ring-sky-400');
      }
       if (isPreviewCell && currentPreviewMode === 'screen-view' && !cell.hasGoodView && cell.isOccluded && cell.status !== 'sold') {
         cellDynamicStyle = cn(cellDynamicStyle, 'opacity-30 bg-red-500/30');
      }

      content = (
        <>
          {cell.category === 'accessible' ? <Accessibility className="w-3/4 h-3/4" /> : <SeatIcon className="w-3/4 h-3/4" />}
          {seatNumber && (
            <span className={cn(
              "absolute text-xs font-semibold",
              cell.status === 'sold' ? 'text-muted-foreground/70' : 'text-white'
            )} style={{ textShadow: '0px 0px 2px rgba(0,0,0,0.7)' }}>
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
      // Icon sizing depends on whether the screen is merged (not square cell) or single (square cell)
      const iconSizingClass = !shouldApplyAspectSquare /* i.e., isMergedScreen */ ? "h-3/4 w-auto max-w-full" : "w-3/4 h-3/4";

      if (isPreviewCell) {
        // Previewed screen cell: neutral background, icon sized like editor's
        cellDynamicStyle = "border border-border/60 bg-muted/20"; 
        content = <ScreenIcon className={`${iconSizingClass} text-muted-foreground/80`} />;
      } else { // Editor cell
        cellDynamicStyle = "bg-foreground/80 text-background"; // Editor screens have a distinct dark background
        content = <ScreenIcon className={iconSizingClass} />; // Icon is white by default, sized based on merge status
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
    style: style, 
    ...props       
  };

  const isSeatClickableInPreview = isPreviewCell && cell.type === 'seat' && cell.status !== 'sold' && onPreviewClick;

  if (isEditorCell || isSeatClickableInPreview) {
    return (
      <button
        aria-label={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}${cell.status ? `, status ${cell.status}` : ''}${seatNumber ? `, seat ${seatNumber}` : ''}`}
        {...commonProps}
        onClick={onPreviewClick || (props as any).onClick}
        disabled={isPreviewCell && cell.type === 'seat' && cell.status === 'sold'}
      >
        {content}
      </button>
    );
  }
  
  return (
    <div 
        title={`Cell ${cell.id}, type ${cell.type}${cell.category ? `, category ${cell.category}` : ''}${cell.status ? `, status ${cell.status}` : ''}${seatNumber ? `, seat ${seatNumber}` : ''}`}
        {...commonProps}
    >
      {content}
    </div>
  );
};
