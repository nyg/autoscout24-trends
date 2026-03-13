# AutoScout24 Trends — Frontend

Next.js application that visualizes car listing data scraped by the crawler.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Updating shadcn/ui Components](#updating-shadcnui-components)
- [Project Structure](#project-structure)

## Features

- Built with Next.js 16, Tailwind CSS 4, shadcn/ui-generated primitives, and Recharts 2
- Search-based navigation via dynamic routes
- Active listings table with detailed specifications
- Historical charts for listing count, average price, and mileage

## Installation

Install dependencies:

```bash
pnpm install
```

Create a `.env` file:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
```

## Usage

Start the development server:

```bash
pnpm dev
```

## Updating shadcn/ui Components

This frontend uses the shadcn CLI with the config in `components.json`:

- generated components live under `src/components/ui/`
- Tailwind CSS is configured through `src/app/globals.css`
- imports use the `@/` aliases from `components.json` and `jsconfig.json`

To add a new component from the registry:

```bash
pnpm dlx shadcn@latest add <component>
```

To refresh an existing generated component, run the same command again for that component and review the diff before keeping local customizations:

```bash
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add chart
```

After regenerating components, run:

```bash
pnpm lint
pnpm build
```

Notes for this repo:

- Keep generated UI code aligned with the existing style rules: 3-space indentation, single quotes, and no semicolons.
- Prefer the existing local primitives in `src/components/ui/` over introducing another component system.
- `components.json` still uses `"iconLibrary": "lucide"`, so adding or refreshing components that depend on icons may re-introduce `lucide-react`.

## Project Structure

```
frontend/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.js                   # Root layout
│   │   ├── page.js                     # Home page
│   │   ├── globals.css                 # Tailwind CSS v4 config
│   │   └── [searchName]/
│   │       └── page.js                 # Search detail page
│   ├── components/
│   │   ├── navbar.js                   # Navigation bar
│   │   ├── cars.js                     # Car listings table
│   │   ├── daily-listing-count.js      # Listing count chart
│   │   └── mileage-price-comparison.js # Mileage vs price chart
│   └── lib/
│       ├── data.js                     # Database queries
│       └── format.js                   # Formatting utilities
├── postcss.config.mjs                  # PostCSS / Tailwind plugin
└── package.json                        # Dependencies and scripts
```
