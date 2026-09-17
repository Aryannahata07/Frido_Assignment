import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Generate a random reference like REQ-XXXXX
const generateReference = () => `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const search = searchParams.get('search');
  const status = searchParams.get('status') as any;
  const reason = searchParams.get('reason') as any;
  
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  const where: Prisma.RequestWhereInput = {
    isRemoved: false,
  };

  if (status) where.status = status;
  if (reason) where.reason = reason;

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  try {
    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          customer: true,
          order: true,
          item: true,
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderId, itemId, units, reason, notes } = body;

    // Validate required fields
    if (!customerId || !orderId || !itemId || !units || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Business Rule 3: One live request per item
    // A customer cannot have two live requests for the same item on the same order.
    // If a request for that order and item already exists and has not yet reached Rejected or Completed, creating another must be refused.
    const existingLiveRequest = await prisma.request.findFirst({
      where: {
        orderId,
        itemId,
        isRemoved: false,
        status: {
          notIn: ['Completed', 'Rejected'],
        },
      },
    });

    if (existingLiveRequest) {
      return NextResponse.json(
        { error: 'A live request already exists for this order item.' },
        { status: 409 }
      );
    }

    const reference = generateReference();

    // Create the request
    const newRequest = await prisma.request.create({
      data: {
        reference,
        customerId,
        orderId,
        itemId,
        units: parseInt(units),
        reason,
        status: 'Open',
        notes: notes ? {
          create: {
            content: notes,
          }
        } : undefined,
      },
      include: {
        customer: true,
        order: true,
        item: true,
      }
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
