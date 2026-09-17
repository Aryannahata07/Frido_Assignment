import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status, Resolution } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const returnRequest = await prisma.request.findUnique({
      where: { id, isRemoved: false },
      include: {
        customer: true,
        order: true,
        item: true,
        notes: {
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(returnRequest);
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const existingRequest = await prisma.request.findUnique({
      where: { id, isRemoved: false },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, resolution, refundAmount, units, reason, customerId, itemId } = body;

    const updates: any = {};

    // Check Business Rule 4: Locked once decided
    const isDecided = ['Approved', 'Rejected', 'Completed'].includes(existingRequest.status);
    
    if (isDecided) {
      if (units !== undefined || reason !== undefined || customerId !== undefined || itemId !== undefined) {
         return NextResponse.json({ error: 'Cannot edit customer or item details of a decided request.' }, { status: 403 });
      }
    } else {
      // Allow updates to details if not decided
      if (units !== undefined) updates.units = parseInt(units);
      if (reason !== undefined) updates.reason = reason;
      if (customerId !== undefined) updates.customerId = customerId;
      if (itemId !== undefined) updates.itemId = itemId;
    }

    // Business Rule 1 & 2: Status flow and resolutions
    if (status && status !== existingRequest.status) {
      const current = existingRequest.status;
      const target = status as Status;
      
      const validTransitions: Record<string, string[]> = {
        'Open': ['InReview'],
        'InReview': ['Approved', 'Rejected'],
        'Approved': ['Completed'],
        'Rejected': [],
        'Completed': []
      };

      if (!validTransitions[current]?.includes(target)) {
         return NextResponse.json({ error: `Invalid status transition from ${current} to ${target}` }, { status: 400 });
      }

      // Check Business Rule 2: Approval needs a resolution
      if (target === 'Approved') {
        const targetResolution = resolution || existingRequest.resolution;
        const targetRefundAmount = refundAmount !== undefined ? refundAmount : existingRequest.refundAmount;

        if (!targetResolution) {
           return NextResponse.json({ error: 'Approval requires a resolution (Refund, Replacement, or StoreCredit).' }, { status: 400 });
        }
        
        if (targetResolution === 'Refund') {
          if (!targetRefundAmount || parseFloat(targetRefundAmount) <= 0) {
             return NextResponse.json({ error: 'Refund resolution requires a refund amount greater than zero.' }, { status: 400 });
          }
        } else {
          // If not refund, no refund amount may be recorded
          if (targetRefundAmount && parseFloat(targetRefundAmount) > 0) {
             return NextResponse.json({ error: 'No refund amount may be recorded for non-Refund resolutions.' }, { status: 400 });
          }
          updates.refundAmount = null; // Clear if it was set somehow
        }

        updates.resolution = targetResolution;
        if (targetResolution === 'Refund') {
          updates.refundAmount = parseFloat(targetRefundAmount);
        }
      }

      updates.status = target;
    } else if (resolution || refundAmount !== undefined) {
      // If updating resolution/refundAmount without changing status, 
      // ensure we are in a state that allows deciding these or we are currently deciding
      // Wait, we can correct details before deciding
      if (isDecided && existingRequest.status !== 'Approved') {
          return NextResponse.json({ error: 'Cannot update resolution on this request state.' }, { status: 400 });
      }
      
      const currentResolution = resolution || existingRequest.resolution;
      if (currentResolution === 'Refund' && refundAmount !== undefined) {
         updates.refundAmount = parseFloat(refundAmount);
      } else if (currentResolution !== 'Refund') {
         updates.refundAmount = null;
      }
      if (resolution) updates.resolution = resolution;
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const existingRequest = await prisma.request.findUnique({
      where: { id, isRemoved: false },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Business Rule 5: Removal
    // Only requests that are Open or Rejected may be removed; anything else must be refused.
    if (existingRequest.status !== 'Open' && existingRequest.status !== 'Rejected') {
      return NextResponse.json({ error: 'Only Open or Rejected requests can be removed.' }, { status: 403 });
    }

    await prisma.request.update({
      where: { id },
      data: { isRemoved: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing request:', error);
    return NextResponse.json({ error: 'Failed to remove request' }, { status: 500 });
  }
}
