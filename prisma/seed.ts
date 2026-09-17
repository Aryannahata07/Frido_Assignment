import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean up existing data
  await prisma.requestNote.deleteMany()
  await prisma.request.deleteMany()
  await prisma.item.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Alice Smith', email: 'alice@example.com' } }),
    prisma.customer.create({ data: { name: 'Bob Johnson', email: 'bob@example.com' } }),
    prisma.customer.create({ data: { name: 'Charlie Brown', email: 'charlie@example.com' } })
  ])

  // Create Orders
  const orders = await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
      prisma.order.create({
        data: {
          orderNumber: `ORD-${1000 + i}`,
          customerId: customers[i % customers.length].id,
        },
      })
    )
  )

  // Create Items
  const items = await Promise.all([
    prisma.item.create({ data: { name: 'Wireless Mouse', sku: 'MS-W-01' } }),
    prisma.item.create({ data: { name: 'Mechanical Keyboard', sku: 'KB-M-02' } }),
    prisma.item.create({ data: { name: 'USB-C Hub', sku: 'USB-C-03' } })
  ])

  const reasons = ['Damaged', 'WrongItem', 'SizeIssue', 'NotAsDescribed', 'ChangedMind']
  const statuses = ['Open', 'InReview', 'Approved', 'Completed', 'Rejected']

  for (let i = 1; i <= 30; i++) {
    const customer = customers[i % customers.length]
    const order = orders[i % orders.length]
    const item = items[i % items.length]
    
    // Assign a reason and status somewhat deterministically to get a good spread
    const reason = reasons[i % reasons.length] as 'Damaged' | 'WrongItem' | 'SizeIssue' | 'NotAsDescribed' | 'ChangedMind'
    const status = statuses[i % statuses.length] as 'Open' | 'InReview' | 'Approved' | 'Completed' | 'Rejected'
    
    // Only add resolution/refundAmount if status is Approved or Completed
    let resolution = null
    let refundAmount = null
    
    if (status === 'Approved' || status === 'Completed') {
      const resTypes = ['Refund', 'Replacement', 'StoreCredit']
      resolution = resTypes[i % resTypes.length] as 'Refund' | 'Replacement' | 'StoreCredit'
      
      if (resolution === 'Refund') {
        refundAmount = 25.00 + (i * 2)
      }
    }

    const request = await prisma.request.create({
      data: {
        reference: `REQ-${1000 + i}`,
        customerId: customer.id,
        orderId: order.id,
        itemId: item.id,
        units: 1 + (i % 3),
        reason,
        status,
        resolution,
        refundAmount,
      }
    })

    // Add notes to some requests
    if (i % 2 === 0) {
      await prisma.requestNote.create({
        data: {
          requestId: request.id,
          content: `Initial review notes for request ${request.reference}.`
        }
      })
      if (status === 'Approved' || status === 'Rejected') {
        await prisma.requestNote.create({
          data: {
            requestId: request.id,
            content: `Decision made: ${status}. Resolution: ${resolution || 'None'}.`
          }
        })
      }
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
