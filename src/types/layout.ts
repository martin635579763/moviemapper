
export type CellType = 'empty' | 'seat' | 'aisle' | 'screen';
export type SeatCategory = 'standard' | 'premium' | 'accessible' | 'loveseat';
export type EditorTool = 'select' | 'seat' | 'aisle' | 'screen' | 'eraser';
export type PreviewMode = 'normal' | 'screen-view' | 'occlusion';
export type SeatStatus = 'available' | 'selected' | 'sold';

export interface CellData {
  id: string; // e.g., "r0c0"
  type: CellType;
  category?: SeatCategory; // For seats
  status?: SeatStatus; 
  isOccluded?: boolean; 
  hasGoodView?: boolean; 
}

export interface HallLayout {
  name: string;
  rows: number;
  cols: number;
  grid: CellData[][];
  screenCellIds: string[]; // Store IDs of cells marked as screen
}

export interface LayoutContextType {
  layout: HallLayout;
  setLayout: React.Dispatch<React.SetStateAction<HallLayout>>;
  selectedTool: EditorTool;
  setSelectedTool: React.Dispatch<React.SetStateAction<EditorTool>>;
  selectedSeatCategory: SeatCategory;
  setSelectedSeatCategory: React.Dispatch<React.SetStateAction<SeatCategory>>;
  previewMode: PreviewMode;
  setPreviewMode: React.Dispatch<React.SetStateAction<PreviewMode>>;
  initializeLayout: (rows?: number, cols?: number, name?: string) => void;
  updateCell: (row: number, col: number) => void;
  loadLayout: (newLayoutOrName: HallLayout | string | null) => Promise<void> | void;
  exportLayout: () => void;

  saveLayoutToStorage: (saveName: string) => Promise<boolean>; 
  loadLayoutFromStorage: (layoutName: string) => Promise<void>; 
  deleteStoredLayout: (layoutName: string) => Promise<void>; 
  
  storedLayoutNames: string[]; 
  refreshStoredLayoutNames: () => Promise<void>; 

  selectedSeatsForPurchase: CellData[];
  toggleSeatSelection: (row: number, col: number) => void;
  confirmTicketPurchase: (
    filmId: string, 
    filmTitle: string, 
    day: string | null, 
    time: string | null
  ) => Promise<void>; // Modified signature
  clearSeatSelection: () => void;

  isLoadingLayouts: boolean; 
}
