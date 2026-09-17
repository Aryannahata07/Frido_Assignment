import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  try {
    const existingRequest = await prisma.request.findUnique({
      where: { id, isRemoved: false },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Business Rule 4: Notes can still be added at any point.
    // They are never edited or deleted once written. (Implemented by not providing PUT/DELETE endpoints for notes).
    const note = await prisma.requestNote.create({
      data: {
        requestId: id,
        content,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
