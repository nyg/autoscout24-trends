# AutoScout24 Trends — Frontend

A Next.js web application for visualizing AutoScout24 car listing data. Features interactive charts, real-time data from PostgreSQL, and a responsive interface built with Tailwind CSS and DaisyUI.

## Introduction

This frontend application provides a user-friendly interface to analyze car listings scraped by the AutoScout24 crawler. It offers:

- **Search-based navigation**: Browse different saved searches via dynamic routes
- **Active listings view**: Table of current cars with detailed specifications
- **Historical charts**: Visualize trends in listing count, average price, and mileage
- **Responsive design**: Mobile-friendly layout that works on all devices
- **Server-side rendering**: Fast initial page loads with Next.js App Router

### Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4 + [DaisyUI](https://daisyui.com/) 5
- **Charts**: [Recharts](https://recharts.org/) 3
- **Database**: PostgreSQL via [`postgres`](https://github.com/porsager/postgres)
- **React**: React 19

## Installation

### Prerequisites

- **Node.js** 18.17 or higher
- **pnpm** package manager
- **PostgreSQL** database with crawler data
- **Environment variables** configured (see below)

### Setup

1. **Navigate to frontend directory**:

```bash
cd frontend
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Configure environment variables**:

Create a `.env.local` file in the frontend directory:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
```

**Note**: `.env.local` is gitignored by default and is the preferred way to store local environment variables in Next.js.

#### Environment Variable Details

- `PGSQL_URL`: PostgreSQL connection string
  - Format: `postgresql://[user[:password]@][host][:port][/dbname]`
  - Must point to the same database used by the crawler
  - User needs SELECT permissions on `cars` and `sellers` tables

## Usage

### Development Mode

Run the development server with hot reload:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.js                # Root layout with navbar
│   │   ├── page.js                  # Home page
│   │   ├── globals.css              # Global styles (Tailwind CSS v4 config)
│   │   └── [searchName]/            # Dynamic route for searches
│   │       └── page.js              # Search-specific listing page
│   ├── components/                  # React components
│   │   ├── navbar.js                # Navigation with search links
│   │   ├── cars.js                  # Car listings table
│   │   ├── daily-listing-count.js   # Daily listing count chart
│   │   └── mileage-price-comparison.js # Mileage vs price chart
│   └── lib/
│       ├── data.js                  # Database queries and data fetching
│       └── format.js                # Formatting utilities
├── .env.local                       # Environment variables (create this)
├── eslint.config.mjs                # ESLint configuration
├── jsconfig.json                    # Path alias configuration
├── next.config.mjs                  # Next.js configuration
├── postcss.config.mjs               # PostCSS / Tailwind CSS plugin
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```
