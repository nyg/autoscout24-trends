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

Or with Turbopack (faster):
```bash
npm run dev --turbopack
```

The application will be available at [http://localhost:3000](http://localhost:3000)

#### Development Features

- **Hot Module Replacement**: Changes reflect immediately
- **Error overlay**: Detailed error messages in browser
- **Fast Refresh**: Preserves component state during edits

### Production Build

Build the application for production:

```bash
npm run build
```

This command:
- Compiles and optimizes the application
- Generates static pages where possible
- Creates production bundles
- Validates all routes and data fetching

### Production Server

Start the production server:

```bash
npm start
```

The server will run on [http://localhost:3000](http://localhost:3000) by default.

To use a different port:

```bash
PORT=8080 npm start
```

### Linting

Check code quality and style:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

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

## Features

### Navigation

The navbar dynamically loads all unique search names from the database and provides links to view each search's data.

### Search Pages

Each search has its own route at `/[searchName]` that displays:

1. **Active Listings Table**
   - Shows cars from the latest batch
   - Includes: title, price, mileage, fuel type, registration date, seller info
   - Sortable and scrollable

2. **Historical Trends Chart**
   - Daily listing count over time
   - Average price trends
   - Average mileage trends
   - Interactive tooltips with Recharts

### Server Components

All pages use Next.js Server Components for:
- Direct database access without API routes
- Reduced JavaScript bundle size
- Improved SEO and initial load performance
- Automatic request deduplication

## Configuration

### Next.js Configuration

Edit `next.config.mjs` to customize:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom configuration here
  output: 'standalone', // For Docker deployments
  images: {
    domains: ['www.autoscout24.ch'], // If displaying images
  },
}

export default nextConfig
```

### TailwindCSS & DaisyUI

Customize theming in `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake'], // Available themes
  },
}
```

### Database Queries

Modify queries in `src/lib/data.js`:

```javascript
// Example: Add a new query
export async function fetchCarsByPriceRange(searchName, minPrice, maxPrice) {
  return pgSql`
    SELECT * FROM cars
    WHERE search_name = ${searchName}
      AND price BETWEEN ${minPrice} AND ${maxPrice}
    ORDER BY price
  `
}
```

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:

```bash
npm install -g vercel
```

2. **Deploy**:

```bash
vercel
```

3. **Set environment variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `PGSQL_URL` with your production database URL

4. **Deploy to production**:

```bash
vercel --prod
```

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'standalone',
}
```

Build and run:

```bash
docker build -t autoscout24-frontend .
docker run -p 3000:3000 -e PGSQL_URL="your_db_url" autoscout24-frontend
```

### Traditional VPS/Server

1. **Build the application**:

```bash
npm run build
```

2. **Copy files to server**:

```bash
rsync -avz --exclude node_modules . user@server:/path/to/app
```

3. **Install dependencies on server**:

```bash
ssh user@server
cd /path/to/app
npm ci --production
```

4. **Run with PM2** (process manager):

```bash
npm install -g pm2
pm2 start npm --name "autoscout24-frontend" -- start
pm2 save
pm2 startup
```

5. **Set up reverse proxy** (nginx):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables for Production

Ensure the following are set in production:

```env
PGSQL_URL=postgresql://user:password@production-host:5432/dbname
NODE_ENV=production
```

For security:
- Use SSL/TLS for database connections
- Store credentials in secure secret managers
- Enable connection pooling for better performance

## Troubleshooting

### Build Errors

**Issue**: `Module not found` errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

**Issue**: `ECONNREFUSED` or timeout errors

**Solution**:
- Verify `PGSQL_URL` is correct
- Check database is running: `pg_isready -h host -p 5432`
- Ensure firewall allows connections
- Test connection: `psql "$PGSQL_URL"`

**Issue**: Permission errors

**Solution**:
```sql
-- Grant necessary permissions
GRANT SELECT ON cars, sellers TO your_user;
```

### No Data Displayed

**Issue**: Pages load but show no listings

**Solution**:
- Verify crawler has run at least once
- Check database has data: `SELECT COUNT(*) FROM cars;`
- Ensure search names match between crawler and frontend
- Check browser console for errors

### Styling Issues

**Issue**: TailwindCSS classes not applied

**Solution**:
```bash
# Rebuild with Tailwind
npm run build
```

Check `tailwind.config.js` includes all source files:
```javascript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
```

### Performance Issues

**Issue**: Slow page loads with large datasets

**Solutions**:
- Add pagination to database queries
- Implement client-side filtering
- Use database indexes:
  ```sql
  CREATE INDEX idx_cars_search_name ON cars(search_name);
  CREATE INDEX idx_cars_batch_id ON cars(batch_id);
  ```
- Enable response caching in Next.js

## Performance Optimization

### Caching

Add revalidation to data fetching in `src/lib/data.js`:

```javascript
export async function fetchActiveListings(searchName) {
  return pgSql`...`
  // Revalidate every hour
  .then(results => {
    return results
  })
}
```

In page components:

```javascript
export const revalidate = 3600 // Revalidate every hour
```

### Database Optimization

Create indexes for better query performance:

```sql
CREATE INDEX idx_cars_search_batch ON cars(search_name, batch_id);
CREATE INDEX idx_cars_date_in ON cars(date_in);
CREATE INDEX idx_sellers_id ON sellers(id);
```

### Bundle Size

Analyze bundle size:

```bash
npm install --save-dev @next/bundle-analyzer
```

Add to `next.config.mjs`:

```javascript
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig = {}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
```

Run analysis:

```bash
ANALYZE=true npm run build
```

## Contributing

Contributions are welcome! Areas for improvement:

- **Filtering & Search**: Add filters for price, mileage, fuel type, etc.
- **Comparison**: Compare multiple searches side-by-side
- **Export**: Download data as CSV or PDF
- **Notifications**: Price drop alerts
- **Dark mode**: Implement theme switching
- **Internationalization**: Multi-language support

### Development Guidelines

1. Follow Next.js App Router conventions
2. Use Server Components by default, Client Components when needed
3. Keep components small and reusable
4. Add PropTypes or TypeScript for type safety
5. Test responsive design on mobile devices

## License

This project is provided as-is for educational and personal use.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Recharts Documentation](https://recharts.org/)
- [PostgreSQL postgres.js](https://github.com/porsager/postgres)

---

**[← Back to Project README](../README.md)**
