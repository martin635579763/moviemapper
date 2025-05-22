
import type { HTMLAttributes } from 'react';
import React from 'react';
import Image from 'next/image'; // Re-added import
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
  onPreviewClick?: () => void; // For ticket selection
}

const getSeatColorAndStyle = (category?: SeatCategory, status?: SeatStatus) => {
  let colorClass = '';
  let statusStyle = '';

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

  switch (status) {
    case 'selected':
      statusStyle = 'ring-2 ring-offset-1 ring-offset-background ring-green-500 shadow-lg';
      break;
    case 'sold':
      statusStyle = 'opacity-40 cursor-not-allowed';
      colorClass = 'text-muted-foreground fill-muted-foreground/10'; // Muted color for sold seats
      break;
    case 'available':
    default:
      // No specific status style for available, uses base colorClass
      break;
  }
  return cn(colorClass, statusStyle);
};

export const GridCell: React.FC<GridCellProps> = ({ cell, seatNumber, isEditorCell = false, isPreviewCell = false, currentPreviewMode = 'normal', className, onPreviewClick, ...props }) => {
  const baseStyle = "w-full h-full aspect-square flex items-center justify-center border border-border/50 rounded-sm transition-colors duration-150 relative overflow-hidden";
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
      cellDynamicStyle = "bg-foreground/80 text-background"; // Default style for editor
      if (isPreviewCell) {
        // For preview, revert to showing an image for the screen
        content = (
          <div className="relative w-full h-full">
            <Image
              src="https://source.unsplash.com/100x50/?cinema,screen" // Or a more specific placeholder if needed
              alt="Cinema Screen Preview"
              fill
              sizes="100px" // Provide a reasonable size hint
              className="object-cover"
              data-ai-hint="cinema screen"
            />
          </div>
        );
        // For preview, the cellDynamicStyle might need adjustment if the image itself doesn't fill or if you want a specific background
        // For now, let's assume the image covers the cell.
        // If you want a background behind/around the image, you can set cellDynamicStyle here:
        // cellDynamicStyle = "bg-black"; // For example
      } else {
        // For editor, use the icon
        content = <ScreenIcon className="w-3/4 h-3/4" />;
      }
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

  if (isPreviewCell && cell.type === 'seat' && cell.status !== 'sold' && onPreviewClick) {
    return (
      <button
        onClick={onPreviewClick}
        aria-label={`Select seat ${seatNumber}, type ${cell.type}, category ${cell.category}, status ${cell.status}`}
        className={combinedClassName}
        disabled={cell.status === 'sold'}
        {...props}
      >
        {content}
      </button>
    );
  }

  // This renders non-clickable preview cells (like aisles, empty, or sold seats)
  // and also preview screen cells.
  return (
    <div className={combinedClassName} title={`Cell ${cell.id}, type ${cell.type}${seatNumber ? `, seat ${seatNumber}` : ''}${cell.status ? `, status ${cell.status}` : ''}`}>
      {content}
    </div>
  );
};
