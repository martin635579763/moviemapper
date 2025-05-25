
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { HallLayout } from '@/types/layout';

// GET /api/layouts - Fetch all layout names
export async function GET() {
  try {
    const layouts = await prisma.hall.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    const layoutNames = layouts.map(layout => layout.name);
    return NextResponse.json(layoutNames);
  } catch (error) {
    console.error('API_GET_LAYOUT_NAMES_ERROR:', error);
    return NextResponse.json({ message: 'Failed to fetch layout names' }, { status: 500 });
  }
}

// POST /api/layouts - Create a new layout
export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<HallLayout, 'screenCellIds'> & { grid: any }; // Grid is complex
    
    const { name, rows, cols, grid } = body;

    if (!name || !rows || !cols || !grid) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if layout with this name already exists
    const existingLayout = await prisma.hall.findUnique({
      where: { name },
    });

    if (existingLayout) {
      return NextResponse.json({ message: `Layout with name "${name}" already exists.` }, { status: 409 }); // Conflict
    }
    
    const newLayout = await prisma.hall.create({
      data: {
        name,
        rows,
        cols,
        gridJson: JSON.stringify(grid), // Store the grid as a JSON string
      },
    });
    return NextResponse.json(newLayout, { status: 201 });
  } catch (error: any) {
    console.error('API_POST_LAYOUT_ERROR:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
         return NextResponse.json({ message: `Layout with name "${(error.meta?.values as any)?.name || 'provided'}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create layout', error: error.message }, { status: 500 });
  }
}
