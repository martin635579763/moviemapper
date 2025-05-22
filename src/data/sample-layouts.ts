import type { HallLayout, CellData, SeatCategory } from '@/types/layout';
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
                let category: SeatCategory = 'standard';
                if (r >= 8 && (c > 5 && c < 14)) category = 'premium'; // Premium seats in the back-middle
                 standardCinema.grid[r][c] = { id: `r${r}c${c}`, type: 'seat', category };
            }
        }
    }
}

const specialVipHall = createDefaultLayout(8, 10, 'Special VIP Hall');
// Screen: Row 0, Col 2-7 (6 cells wide)
for (let c = 2; c <= 7; c++) {
  specialVipHall.grid[0][c] = { id: `r0c${c}`, type: 'screen' };
  specialVipHall.screenCellIds.push(`r0c${c}`);
}

// Aisles:
// Central vertical aisle at Col 4
for (let r = 0; r < 8; r++) {
  specialVipHall.grid[r][4].type = 'aisle';
}
// Side wall aisles at Col 0 and Col 9
for (let r = 0; r < 8; r++) {
  specialVipHall.grid[r][0].type = 'aisle';
  specialVipHall.grid[r][9].type = 'aisle';
}
// Horizontal walkway at Row 1
for (let c = 0; c < 10; c++) {
  specialVipHall.grid[1][c].type = 'aisle';
}

// Seats:
// Rows 2 & 3: Loveseats, Premium
const loveseatRows = [2, 3];
loveseatRows.forEach(r => {
  specialVipHall.grid[r][2] = { id: `r${r}c2`, type: 'seat', category: 'loveseat' };
  specialVipHall.grid[r][3] = { id: `r${r}c3`, type: 'seat', category: 'loveseat' };
  specialVipHall.grid[r][6] = { id: `r${r}c6`, type: 'seat', category: 'loveseat' };
  specialVipHall.grid[r][7] = { id: `r${r}c7`, type: 'seat', category: 'loveseat' };
});

// Rows 4 & 5: Premium Seats
const premiumSeatRows = [4, 5];
premiumSeatRows.forEach(r => {
  specialVipHall.grid[r][1] = { id: `r${r}c1`, type: 'seat', category: 'premium' };
  specialVipHall.grid[r][2] = { id: `r${r}c2`, type: 'seat', category: 'premium' };
  specialVipHall.grid[r][3] = { id: `r${r}c3`, type: 'seat', category: 'premium' };
  specialVipHall.grid[r][5] = { id: `r${r}c5`, type: 'seat', category: 'premium' };
  specialVipHall.grid[r][6] = { id: `r${r}c6`, type: 'seat', category: 'premium' };
  specialVipHall.grid[r][7] = { id: `r${r}c7`, type: 'seat', category: 'premium' };
});

// Row 6: Accessible Seats
specialVipHall.grid[6][2] = { id: `r6c2`, type: 'seat', category: 'accessible' };
specialVipHall.grid[6][3] = { id: `r6c3`, type: 'seat', category: 'accessible' };
// Gap for accessible next to aisle, or wide aisle already exists with col4
specialVipHall.grid[6][5] = { id: `r6c5`, type: 'seat', category: 'accessible' };
specialVipHall.grid[6][6] = { id: `r6c6`, type: 'seat', category: 'accessible' };

// Row 7: Standard Seats at the back
specialVipHall.grid[7][1] = { id: `r7c1`, type: 'seat', category: 'standard' };
specialVipHall.grid[7][2] = { id: `r7c2`, type: 'seat', category: 'standard' };
specialVipHall.grid[7][3] = { id: `r7c3`, type: 'seat', category: 'standard' };
specialVipHall.grid[7][5] = { id: `r7c5`, type: 'seat', category: 'standard' };
specialVipHall.grid[7][6] = { id: `r7c6`, type: 'seat', category: 'standard' };
specialVipHall.grid[7][7] = { id: `r7c7`, type: 'seat', category: 'standard' };


export const sampleLayouts: HallLayout[] = [
  createDefaultLayout(10,15, 'Empty Default'),
  smallHall,
  standardCinema,
  specialVipHall,
];
