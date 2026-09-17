# ReturnDesk

**Deployed URL**: [https://your-deployed-url.vercel.app](https://your-deployed-url.vercel.app)  
**GitHub Repository**: [https://github.com/your-username/Frido_Assignment](https://github.com/your-username/Frido_Assignment)  

A comprehensive system for managing product returns, replacements, and refunds, designed to enforce strict business rules.

## Features

- **Raise Requests**: Submit return requests with customer, order, and item details. Enforces business rules like one live request per item.
- **Request Lifecycle**: Strict state machine (`Open` -> `InReview` -> `Approved`/`Rejected` -> `Completed`).
- **Resolutions**: Handled via specific resolutions (Refund, Replacement, Store Credit). Refund amounts are strictly validated.
- **Notes System**: Add internal notes to track the history of a request.
- **Search & Filter**: Find requests quickly with server-side pagination, search by reference or customer, and filter by status and reason.
- **Soft Delete**: Remove Open or Rejected requests without losing historical data.

## Tech Stack

- Next.js 15 (App Router, React Server Components, API Routes)
- Tailwind CSS & Lucide React (UI and Icons)
- Prisma ORM 7
- PostgreSQL (Database)

---

## 🚀 Setup Instructions

Follow these steps to run the project from a clean machine:

### Prerequisites

- Node.js (v18+)
- PostgreSQL (Local, Docker, or Cloud like Supabase/Neon)

### Database Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Frido_Assignment.git
   cd Frido_Assignment
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and update it with your database connection string.
   ```bash
   cp .env.example .env
   ```
   *Note: Set your `DATABASE_URL` in `.env` to a valid PostgreSQL connection string. (e.g., Supabase IPv4 connection pooler URL).*

4. **Run database migrations and seed the database:**
   This command will build the database schema from empty and execute `prisma/seed.ts` automatically.
   ```bash
   npx prisma migrate dev
   ```
   *If you need to re-run the seed script later, you can use:*
   ```bash
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🧠 Design Decisions & Architecture

- **Next.js App Router & API Routes**: I chose Next.js API Routes over pure Server Actions to create a coherent, predictable REST-like API. This ensures clear boundaries between the frontend and the business logic and allows external clients to potentially use the API in the future.
- **Prisma & PostgreSQL**: Used Prisma ORM to guarantee type safety and enforce strict database constraints. PostgreSQL was chosen for its robust relational data integrity.
- **Soft Deletes**: Business Rule 5 requires "removing" Open/Rejected requests. Instead of hard-deleting the records (which could cause historical data loss), I added an `isRemoved` boolean to the schema. This filters them out of the UI while keeping the audit trail intact in the database.
- **Single Page Dashboard with Modals**: Instead of navigating to multiple pages (`/requests/new`, `/requests/[id]`), I built the frontend as a dynamic dashboard with React Modals. This provides a significantly faster, more fluid user experience similar to modern SaaS applications.
- **Server-side Pagination & Filtering**: Filtering, searching, and sorting are executed at the database level via the API (`/api/requests`) rather than fetching all records and filtering in the client. This ensures the app scales effortlessly.
- **Business Rule Enforcement**: All 5 business rules are enforced strictly on the server (inside API routes) to guarantee data integrity, even if the client is bypassed.

## ⚠️ What is Incomplete

- **Fully Completed**: All phases and business requirements specified in the take-home assignment have been successfully implemented and tested.

## 💭 Assumptions Made

- **Authentication**: I assumed that authentication was out of scope for this assignment. Therefore, the dashboard allows any user to perform actions, and customer/order IDs are selected from a dropdown when raising a request.
- **Refund Currency**: Assumed USD ($) for refund amounts, and that refund amounts can only be mapped to up to 2 decimal places.
- **Initial Data**: Assumed that Customers, Items, and Orders exist in the system prior to a return being processed (handled by the seed script).

## ⏱️ Hours Spent

- **Approximate time spent**: ~5-6 hours
  - *Database Modeling & Backend API*: ~2 hours
  - *Frontend & UI Design*: ~2 hours
  - *Testing, Refinements, & Documentation*: ~1.5 hours
