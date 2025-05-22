
export type CellType = 'empty' | 'seat' | 'aisle' | 'screen';
export type SeatCategory = 'standard' | 'premium' | 'accessible' | 'loveseat';
export type EditorTool = 'select' | 'seat' | 'aisle' | 'screen' | 'eraser';
export type PreviewMode = 'normal' | 'screen-view' | 'occlusion';
// export type SeatStatus = 'available' | 'selected' | 'sold'; // Removed

export interface CellData {
  id: string; // e.g., "r0c0"
  type: CellType;
  category?: SeatCategory; // For seats
  // status?: SeatStatus; // For seats in ticket selling demo - Removed
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
  initializeLayout: (rows: number, cols: number, name?: string) => void;
  updateCell: (row: number, col: number) => void;
  loadLayout: (newLayout: HallLayout) => void;
  exportLayout: () => void;

  saveLayoutToStorage: (saveName: string) => boolean;
  loadLayoutFromStorage: (layoutName: string) => void;
  deleteStoredLayout: (layoutName: string) => void;
  getStoredLayoutNames: () => string[];

  // Removed ticket purchasing related functions and state
  // selectedSeatsForPurchase: CellData[];
  // toggleSeatSelection: (row: number, col: number) => void;
  // confirmTicketPurchase: () => void;
  // clearSeatSelection: () => void;
}
