# ReturnDesk

A comprehensive system for managing product returns, replacements, and refunds.

## Features

- **Raise Requests**: Submit return requests with customer, order, and item details. Enforces business rules like one live request per item.
- **Request Lifecycle**: Strict state machine (`Open` -> `InReview` -> `Approved`/`Rejected` -> `Completed`).
- **Resolutions**: Handled via specific resolutions (Refund, Replacement, Store Credit). Refund amounts are strictly validated.
- **Notes System**: Add internal notes to track the history of a request.
- **Search & Filter**: Find requests quickly with server-side pagination, search by reference or customer, and filter by status and reason.
- **Soft Delete**: Remove Open or Rejected requests without losing historical data.

## Tech Stack

- Next.js 15 (App Router, React Server Components)
- Tailwind CSS
- Prisma ORM 7
- PostgreSQL (Dockerized)
- Lucide React (Icons)
- date-fns

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose

### Setup

1. Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```

2. Start the PostgreSQL database
   ```bash
   docker-compose up -d
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Run database migrations and seed
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
