# AB Prime Academy Admin Fee Manager

A premium student fee management system built with Next.js and Supabase.

## ✨ Features
- **iOS Glassmorphism UI**: High-end modern design with fluid animations.
- **Automated Dues**: Monthly due generation and advance adjustment logic.
- **Financial Analytics**: Dashboard with revenue charts and collection tracking.
- **Audit Ledger**: Complete transaction history and admin activity log.
- **Bulk Import**: Quickly register students via Excel/CSV.

## 🚀 Getting Started

### 1. Database Setup
Execute the contents of `supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables and functions.

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-cron-secret
```

### 3. Installation
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## ⚙️ Automated Dues
Set up a Cron job (using Vercel Cron or GitHub Actions) to hit the following endpoint on the 1st of every month at 12:00 AM:
`GET /api/cron/generate-dues`
Include the `Authorization: Bearer [CRON_SECRET]` header for security.

## 🛠 Tech Stack
- **Frontend**: Next.js (App Router)
- **Database**: Supabase
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Parsing**: SheetJS (XLSX)
