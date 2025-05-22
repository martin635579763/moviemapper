import type { HallLayout } from '@/types/layout';
import { createDefaultLayout } from '@/lib/layout-utils';

const smallHall = createDefaultLayout(8, 10, 'Small Hall');
// Add some seats and a screen for Small Hall
for (let r = 2; r < 7; r++) {
  for (let c = 1; c < 9; c++) {
    if (c === 4 || c === 5) {
      smallHall.grid[r][c] = { id: `r${r}c${c}`, type: 'aisle' };
    } else {
      smallHall.grid[r][c] = { id: `r${r}c${c}`, type: 'seat', category: 'standard' };
    }
  }
}
for (let c = 2; c < 8; c++) {
  smallHall.grid[0][c] = { id: `r0c${c}`, type: 'screen' };
  smallHall.screenCellIds.push(`r0c${c}`);
}


const standardCinema = createDefaultLayout(12, 20, 'Standard Cinema');
// Screen
for (let c = 3; c < 17; c++) {
    standardCinema.grid[0][c] = { id: `r0c${c}`, type: 'screen'};
    standardCinema.screenCellIds.push(`r0c${c}`);
}
// Aisles
for(let r=2; r<12; r++) {
    standardCinema.grid[r][5] = { id: `r${r}c5`, type: 'aisle'};
    standardCinema.grid[r][14] = { id: `r${r}c14`, type: 'aisle'};
}
// Seats
for (let r = 2; r < 12; r++) {
    for (let c = 0; c < 20; c++) {
        if (standardCinema.grid[r][c].type === 'empty') { // if not already aisle or screen
            if (c < 5 || (c > 5 && c < 14) || c > 14) { // seat sections
                let category: 'standard' | 'premium' = 'standard';
                if (r >= 8 && (c > 5 && c < 14)) category = 'premium'; // Premium seats in the back-middle
                 standardCinema.grid[r][c] = { id: `r${r}c${c}`, type: 'seat', category };
            }
        }
    }
}


export const sampleLayouts: HallLayout[] = [
  createDefaultLayout(10,15, 'Empty Default'),
  smallHall,
  standardCinema,
];
