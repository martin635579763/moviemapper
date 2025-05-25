
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { HallLayout, CellData } from '@/types/layout';

interface LayoutParams {
  params: { layoutName: string };
}

// GET /api/layouts/[layoutName] - Fetch a specific layout by name
export async function GET(request: Request, { params }: LayoutParams) {
  try {
    const layoutName = decodeURIComponent(params.layoutName);
    const hall = await prisma.hall.findUnique({
      where: { name: layoutName },
    });

    if (!hall) {
      return NextResponse.json({ message: 'Layout not found' }, { status: 404 });
    }

    // Reconstruct HallLayout from Hall model
    const layoutData: HallLayout = {
      name: hall.name,
      rows: hall.rows,
      cols: hall.cols,
      grid: JSON.parse(hall.gridJson) as CellData[][],
      screenCellIds: [], // This needs to be derived or stored differently if critical
    };
    // Derive screenCellIds if needed for frontend (example)
    layoutData.grid.forEach(row => row.forEach(cell => {
        if (cell.type === 'screen') {
            layoutData.screenCellIds.push(cell.id);
        }
    }));


    return NextResponse.json(layoutData);
  } catch (error) {
    console.error(`API_GET_LAYOUT_${params.layoutName}_ERROR:`, error);
    return NextResponse.json({ message: 'Failed to fetch layout' }, { status: 500 });
  }
}

// PUT /api/layouts/[layoutName] - Update a layout by name
export async function PUT(request: Request, { params }: LayoutParams) {
  try {
    const layoutName = decodeURIComponent(params.layoutName);
    const body = await request.json() as Omit<HallLayout, 'name' | 'screenCellIds'> & { grid: any };
    const { rows, cols, grid } = body;

    if (!rows || !cols || !grid) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const updatedLayout = await prisma.hall.update({
      where: { name: layoutName },
      data: {
        rows,
        cols,
        gridJson: JSON.stringify(grid),
      },
    });
    return NextResponse.json(updatedLayout);
  } catch (error: any) {
    console.error(`API_PUT_LAYOUT_${params.layoutName}_ERROR:`, error);
     if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: `Layout with name "${params.layoutName}" not found.` }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update layout', error: error.message }, { status: 500 });
  }
}

// DELETE /api/layouts/[layoutName] - Delete a layout by name
export async function DELETE(request: Request, { params }: LayoutParams) {
  try {
    const layoutName = decodeURIComponent(params.layoutName);
    // Before deleting a hall, ensure it's not used in any schedules or handle accordingly
    // For now, we'll just delete. In a real app, you'd check dependencies.
    // const schedulesUsingHall = await prisma.schedule.count({ where: { hall: { name: layoutName } } });
    // if (schedulesUsingHall > 0) {
    //   return NextResponse.json({ message: 'Cannot delete hall, it is used in schedules.' }, { status: 400 });
    // }

    await prisma.hall.delete({
      where: { name: layoutName },
    });
    return NextResponse.json({ message: 'Layout deleted successfully' });
  } catch (error: any) {
    console.error(`API_DELETE_LAYOUT_${params.layoutName}_ERROR:`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ message: `Layout with name "${params.layoutName}" not found.` }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete layout', error: error.message }, { status: 500 });
  }
}
