# Chart Review

## Scope
This review focuses on the two charts currently shown on the search detail page:
- `DailyListingCount`
- `MileagePriceComparison`

The comments below are from a business / product perspective rather than a code-quality perspective.

## Executive summary
The current charts already answer two useful questions:
1. **How big is this market over time?**
2. **How does asking price relate to mileage in the current market snapshot?**

That is a strong start. The app already has the right data foundation to become much more valuable for buyers, sellers, and market watchers. The main gap is not lack of data; it is that the UI still shows only a small part of the insight hidden in the crawler history.

My overall view:
- the charts are **useful**, not decorative
- the chart names are **mostly understandable**, but one of them undersells what it contains
- the app would become much more decision-useful with a few **market movement** and **inventory quality** metrics

---

## 1. `DailyListingCount`

### What it currently shows
Despite the name, this chart shows three daily metrics:
- listing count
- average price
- average mileage

That means it is really a compact **market-over-time overview** chart.

### Business value
This is probably the most valuable chart in the app today.

Why:
- it shows whether a market is **tightening or loosening**
- it gives a quick signal of whether prices are **moving up or down**
- it hints at whether the mix of cars is changing, via average mileage

For a user tracking one model search over time, this is very meaningful. It helps answer:
- “Are there more or fewer cars available than before?”
- “Is the average asking price trending down?”
- “Is the current inventory getting more worn / older / cheaper?”

### Naming review
`DailyListingCount` is technically true, but too narrow.

It suggests the chart is only about inventory count, while it also includes price and mileage averages.

Better business-facing names:
- **Market Overview**
- **Market Trend Overview**
- **Inventory, Price & Mileage Over Time**
- **Daily Market Snapshot**

My preference: **Market Overview**

Reason:
- short
- understandable by non-technical users
- broad enough to include future additions without renaming again

### What works well
- Combining supply (`car_count`) and quality/price signals in one place is efficient
- Using daily aggregation is appropriate for a crawler-driven product
- The chart answers “what changed over time?” better than a table alone ever could

### Main business limitations
1. **Averages can be misleading**
   - average price can move because the market changed
   - but it can also move because the mix of listings changed
   - example: if many low-mileage premium cars enter the search, average price rises even if the underlying market did not really tighten

2. **It mixes stock and composition**
   - listing count is a stock/inventory signal
   - average price and mileage are composition signals
   - users may read them as causal when they are not necessarily causal

3. **It does not show volatility or spread**
   - a stable average can hide a very wide market
   - users would benefit from median / percentiles / min-max bands

### Product recommendation
Keep this chart, but think of it as the app’s **headline market summary chart**, not just a listing-count chart.

---

## 2. `MileagePriceComparison`

### What it currently shows
This chart shows the current active listings as a scatter plot of:
- mileage on X
- price on Y

### Business value
This is a very good chart for the current active market snapshot.

It helps users answer:
- “Is this listing expensive for its mileage?”
- “Where is the market cluster right now?”
- “Are there obvious overpriced or underpriced outliers?”

For a buyer, this is very practical. It is probably the chart that most directly supports a purchase decision.

### Naming review
`MileagePriceComparison` is clear enough for developers, but a little dry for end users.

Better business-facing names:
- **Price vs Mileage**
- **Current Market Positioning**
- **Asking Price vs Mileage**

My preference: **Price vs Mileage**

Reason:
- short
- obvious immediately
- matches what users expect from a scatter plot

### What works well
- scatter is the right chart type here
- it reveals outliers better than a table
- it complements the active listings table nicely

### Main business limitations
1. **It only uses two dimensions**
   - price and mileage matter, but year / seller type / accident history / warranty also matter
   - without those, users may overinterpret a point as “cheap” or “expensive”

2. **No trend line / reference model**
   - users can see clusters
   - but they still must visually estimate the “fair” price curve

3. **It is only a current snapshot**
   - useful for shopping today
   - less useful for understanding how the market is evolving

### Product recommendation
Keep this chart. It is useful and intuitive. Over time, it would get much stronger with one of these additions:
- regression / trend line
- color by seller type or year bucket
- tooltip additions like title, first registration year, seller, and days seen

---

## Suggested new charts and statistics

Below are the additions I think would create the most business value from the data you already store.

### Tier 1: highest-value additions

#### A. Median price over time
Why it matters:
- median is more robust than average
- it reduces distortion from a few very expensive or very cheap listings

Best use:
- either replace average price in the current overview chart
- or show average and median together

#### B. New listings vs removed listings per batch/day
Why it matters:
- tells users whether the market is actually refreshing
- separates “market size” from “market churn”

Questions answered:
- “Are new listings entering the market?”
- “Are cars disappearing quickly?”
- “Is this a slow or fast market?”

This would be one of the strongest business signals in the app.

#### C. Days-on-market / listing survival
Why it matters:
- one of the best signals of market health and pricing realism
- fast-selling markets look very different from stale markets

Possible views:
- average / median days visible
- histogram of listing age
- survival curve by cohort

#### D. Price-per-km or price-per-age-normalized metric
Why it matters:
- helps users compare listings more fairly
- especially useful inside one model search where cars are broadly comparable

Caution:
- should be presented as a heuristic, not true valuation

### Tier 2: very useful next layer

#### E. Price distribution histogram
Why it matters:
- shows where most listings actually sit
- makes the market shape obvious

Questions answered:
- “Is the market concentrated in one band or split in two?”
- “Are there clear premium and budget submarkets?”

#### F. First registration year vs price
Why it matters:
- for many buyers, age is easier to reason about than mileage
- often complements mileage better than replacing it

#### G. Seller mix statistics
Possible cuts:
- dealer vs private seller share
- average price by seller type
- days-on-market by seller type

Why it matters:
- helps users understand whether the search is dominated by dealers or private sellers
- can reveal pricing premiums by seller type

#### H. Change in active inventory vs previous batch
Why it matters:
- a compact summary card can be extremely powerful

Examples:
- `+12 new listings`
- `-8 removed listings`
- `average price -2.3% vs previous batch`
- `median mileage +4,500 km vs previous batch`

This would make the page feel much more actionable immediately.

### Tier 3: advanced but high-potential

#### I. Fair-price / outlier score
Using simple regression or a rules-based model, estimate whether an active listing is:
- below market
- near market
- above market

This would likely become one of the most-used features if communicated carefully.

#### J. Cohort chart by registration year or mileage bucket
Why it matters:
- separates market composition changes from real price movement
- useful when averages become misleading

#### K. Mileage-adjusted price trend over time
Why it matters:
- gets closer to “is the market becoming more expensive?”
- instead of “is the average listing this week more expensive?”

---

## Suggested summary stats for the page header
These would add a lot of value even before adding more charts.

Recommended quick stats:
- active listings count
- median price
- median mileage
- median first registration year
- new listings since previous batch
- removed listings since previous batch
- median days visible
- dealer share vs private share

This kind of compact summary is often the fastest way for a user to understand the market before reading the charts.

---

## Final opinion
The current charts are a good foundation.

If I think as a user of the application:
- the **time-series chart** tells me whether the market is moving
- the **scatter chart** tells me where current opportunities or outliers may exist

That is already meaningful.

If I think as a product person:
- the app is one step away from becoming much more valuable
- the next big leap is to add **market churn**, **days-on-market**, and **median-based metrics**
- those would turn the product from “interesting listing tracker” into a more serious **market intelligence tool**

## Recommended naming changes
If you want to make the UI more business-friendly without changing the underlying logic:
- `Daily Listing Count` → **Market Overview**
- `Mileage vs Price` → **Price vs Mileage**

These names are simpler, more accurate for end users, and better aligned with the decisions users are trying to make.

## Repo context used for this review
- `frontend/src/app/[searchName]/page.js`
- `frontend/src/lib/data.js`
- `frontend/src/components/daily-listing-count.js`
- `frontend/src/components/mileage-price-comparison.js`
- `crawler/SCHEMA.sql`
