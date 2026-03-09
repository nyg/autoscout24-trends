# AutoScout24 Trends - Frontend

A modern Next.js web application for visualizing AutoScout24 car listing data. Features interactive charts, real-time data from PostgreSQL, and a responsive interface built with TailwindCSS and DaisyUI.

## Introduction

This frontend application provides a user-friendly interface to analyze car listings scraped by the AutoScout24 crawler. It offers:

- **Search-based navigation**: Browse different saved searches via dynamic routes
- **Active listings view**: Table of current cars with detailed specifications
- **Historical charts**: Visualize trends in listing count, average price, and mileage
- **Responsive design**: Mobile-friendly layout that works on all devices
- **Server-side rendering**: Fast initial page loads with Next.js App Router

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS 4 + DaisyUI 5
- **Charts**: Recharts 3
- **Database**: PostgreSQL via `postgres` client
- **React**: React 19

## Installation

### Prerequisites

- **Node.js** 18.17 or higher
- **npm**, **pnpm**, or **yarn** package manager
- **PostgreSQL** database with crawler data
- **Environment variables** configured (see below)

### Setup

1. **Navigate to frontend directory**:

```bash
cd frontend
```

2. **Install dependencies**:

Using npm:
```bash
npm install
```

Using pnpm (recommended):
```bash
pnpm install
```

Using yarn:
```bash
yarn install
```

3. **Configure environment variables**:

Create a `.env.local` file in the frontend directory:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
```

Or alternatively, create a `.env` file (not recommended for production as it may be committed):

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
```

**Important**: `.env.local` is gitignored by default and is the preferred way to store local environment variables in Next.js.

#### Environment Variable Details

- `PGSQL_URL`: PostgreSQL connection string
  - Format: `postgresql://[user[:password]@][host][:port][/dbname]`
  - Must point to the same database used by the crawler
  - User needs SELECT permissions on `cars` and `sellers` tables

## Usage

### Development Mode

Run the development server with hot reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

#### Development Features

- **Hot Module Replacement**: Changes reflect immediately
- **Error overlay**: Detailed error messages in browser
- **Fast Refresh**: Preserves component state during edits


## Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.js         # Root layout with navbar
│   │   ├── page.js           # Home page
│   │   ├── globals.css       # Global styles
│   │   └── [searchName]/     # Dynamic route for searches
│   │       └── page.js       # Search-specific listing page
│   ├── components/           # React components
│   │   ├── navbar.js         # Navigation with search links
│   │   ├── listing-table.js  # Car listings table
│   │   └── trend-chart.js    # Historical data charts
│   └── lib/
│       └── data.js           # Database queries and data fetching
├── public/                   # Static assets
├── .env.local                # Environment variables (create this)
├── package.json              # Dependencies and scripts
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # TailwindCSS configuration
└── README.md                 # This file
```
