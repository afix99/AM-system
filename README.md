# Area Manager Dashboard System

A clean, mobile-friendly dashboard for managing 5 Japanese streetwear jersey retail stores.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite via Prisma ORM v7
- **UI:** Tailwind CSS + custom components
- **Charts:** Recharts
- **Icons:** Lucide React
- **Export:** xlsx

## Features

- **Dashboard** — Weekly checklist, task board, store snapshot
- **Store Detail** — Overview, Staff, Schedule, Attendance, Stock, Performance tabs
- **Schedule** — Master weekly view across all 5 stores with export
- **Tasks** — Priority-sorted task manager (Urgent → Low)
- **Stock** — All-stores stock overview with low-stock alerts
- **Performance** — Monthly rankings, charts, staff ratings

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env

# 3. Push database schema
npx prisma db push

# 4. Seed with sample data
npm run seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Seed Data

- 5 stores: Sakura Store, Harajuku Hub, Shibuya Branch, Omotesando Outlet, Akihabara Point
- 20 staff with Malaysian names (4 per store)
- 3 weeks of schedule data
- 2 weeks of attendance records
- 3 months of performance data
- 80 stock items (bomber jackets, track tops, varsity jackets, oversized tees)
- 5 tasks including 1 overdue
- Weekly checklist for current week

## Currency & Date Format

- Currency: `RM` prefix (e.g., RM 12,500)
- Dates: `DD MMM YYYY` format
