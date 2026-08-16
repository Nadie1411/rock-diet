# Rock Diet (روك دايت) — Project Documentation for AI Agents

> **Last Updated:** 2026-08-10
> **Read this file FIRST before making any changes.**

---

## 🚀 Project Overview

**Rock Diet** is a **React 19 + Vite** single-page application for a **healthy gourmet meal delivery service** based in Cairo, Egypt (brand name: روك دايت). It is currently a **frontend-only prototype** — no backend, no database, no authentication. All data is served from central mock JavaScript arrays (`src/data/menuItems.js`).

The app markets chef-crafted nutritious meals with macro tracking (protein/carbs/fat), fast delivery, and diet plans (Healthy Bowls, High Protein, Keto & Low Carb, Detox & Juices).

---

## 🛠 Tech Stack

| Layer      | Technology                                                                    | Version         |
| ---------- | ----------------------------------------------------------------------------- | --------------- |
| Framework  | React (StrictMode)                                                            | ^19.2.8         |
| Build Tool | Vite                                                                          | ^8.2.0          |
| Routing    | React Router DOM                                                              | ^7.18.2         |
| Styling    | Tailwind CSS (v4, via `@tailwindcss/vite` plugin — **no tailwind.config.js**) | ^4.3.3          |
| Icons      | lucide-react                                                                  | ^1.31.0         |
| Utilities  | clsx + tailwind-merge                                                         | ^2.1.1 / ^3.6.0 |
| Linter     | oxlint                                                                        | ^1.75.0         |

**Entry point:** `index.html` → `src/main.jsx` → `src/App.jsx`

---

## 📁 File Structure

```
TC1/
├── index.html                     → HTML entry, title "Rock Diet", logo favicon
├── package.json                   → Scripts & dependencies
├── vite.config.js                 → React + Tailwind v4 plugins
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── rock-diet-logo.png
└── src/
    ├── main.jsx                   → React root render (imports index.css)
    ├── App.jsx                    → Router configuration
    ├── index.css                  → Tailwind @theme tokens + global styles ⭐
    ├── App.css                    → EMPTY — do not add global styles here
    ├── assets/                    → Local images (logo, hero)
    ├── components/
    │   ├── Navbar.jsx             → Sticky header, desktop + mobile drawer
    │   └── Footer.jsx             → Site footer
    ├── data/
    │   └── menuItems.js           → Centralized meal items data source ⭐
    └── pages/
        ├── Home.jsx               → Landing page (hero, categories, gallery, map, CTA)
        ├── Menu.jsx               → Interactive menu (filters, search, add-to-cart)
        ├── MenuItemDetail.jsx     → Individual meal detail page with quantity picker & macros
        └── Orders.jsx             → Order tracking (active + history tabs)
```

---

## 🎨 THEME SYSTEM (CRITICAL — Read This!)

All colors are defined as **Tailwind v4 `@theme` tokens** in `src/index.css`. **NEVER use hardcoded color classes** (`bg-gray-*`, `text-teal-*`, `bg-amber-*`, hex values, etc.).

### Current Teal Theme (`src/index.css`)

```css
@theme {
  /* Primary brand — teal */
  --color-primary: #0d7377; /* Main CTAs, active nav, headlines highlight */
  --color-primary-light: #5eead4; /* Hover states, lighter variant */
  --color-secondary: #0fa68b; /* Secondary brand green */
  --color-accent: #14b8a6; /* Sparingly: price tags, star ratings, small highlights */

  /* Text on brand colors */
  --color-on-primary: #ffffff; /* Text on primary bg */
  --color-on-primary-muted: #d9f5f2; /* Muted text on primary bg */

  /* Neutrals */
  --color-bg: #f5f7f7; /* Page backgrounds */
  --color-surface: #ffffff; /* Cards, inputs, elevated surfaces */
  --color-text: #1a2e2e; /* Headings, body text */
  --color-text-secondary: #5c6b68; /* Muted/secondary text */
  --color-border: #e2e8e6; /* Borders, dividers */
  --color-disabled: #c4cac7; /* Disabled states */

  /* Macro / data colors */
  --color-protein: #0d7377; /* Protein badge */
  --color-carbs: #f5b700; /* Carbs badge */
  --color-fat: #3b82f6; /* Fat badge */

  /* Semantic */
  --color-success: #16a34a; /* Delivered state, added-to-cart */
  --color-warning: #f59e0b; /* Spicy badge */
  --color-error: #dc2626; /* Error / destructive actions */
}
```

### Usage Mapping

| Intended Use              | Utility Classes                           |
| ------------------------- | ----------------------------------------- |
| Primary CTAs / active nav | `bg-primary` / `text-primary`             |
| Hover on primary          | `hover:bg-primary-light`                  |
| Headings / dark text      | `text-text`                               |
| Body / muted text         | `text-text-secondary`                     |
| Page backgrounds          | `bg-bg`                                   |
| Cards / surfaces          | `bg-surface` (or `bg-bg` for card bg)     |
| Borders / dividers        | `border-border`                           |
| Text on brand colors      | `text-on-primary`                         |
| Price tags / star ratings | `text-accent` / `fill-accent` (SPARINGLY) |
| Protein badge             | `bg-protein/10 text-protein` border       |
| Carbs badge               | `bg-carbs/10 text-carbs` border           |
| Fat badge                 | `bg-fat/10 text-fat` border               |
| Success state             | `bg-success text-white`                   |
| Warning / spicy           | `bg-warning text-white`                   |
| Error                     | `text-error`                              |
| Breadcrumb/CTA accents    | `text-accent`                             |

---

## 🧭 Routing

| Path        | Component            | Description                                  |
| ----------- | -------------------- | -------------------------------------------- |
| `/`         | `Home.jsx`           | Landing page                                 |
| `/menu`     | `Menu.jsx`           | Meal catalog with filtering/search           |
| `/menu/:id` | `MenuItemDetail.jsx` | Dynamic meal detail page (quantity & macros) |
| `/orders`   | `Orders.jsx`         | Order tracking                               |
| `*`         | Redirect → `/`       | Fallback                                     |

Configured in `src/App.jsx` with `BrowserRouter`, wrapped in `min-h-screen bg-bg text-text` shell with `Navbar` and `Footer`.

---

## 📄 Page Guide for AI Agents

### 1. `src/pages/Home.jsx` — Landing Page

Sections in order:

1. **Hero (100vh)** — Full-viewport background image + dark gradient overlay. Contains:
   - Entrance animations via `useState`/`useEffect` (`visible` state triggers opacity/translate transitions)
   - Announcement pill, headline with SVG underline accent, CTAs
   - Trust indicators (customer avatars + star rating)
   - Right side: glassmorphic product card with floating badges (bounce-slow animation)
   - Scroll indicator that smooth-scrolls to `#categories`
2. **Categories** — shadcn-style Cards (media on top, body below). 4 diet-plan cards:
   - Card structure: `flex flex-col overflow-hidden rounded-xl border border-border bg-bg`
   - Media: `h-64` image with hover zoom
   - Body: `p-5`, tag (accent), title, item count
   - Action overlay: circle arrow appears on group-hover
3. **Popular Meals (Gallery Grid)** — Uniform Grid via CSS Grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
   - White border frames (`border-4 border-white`), same height (`h-72`)
   - Badge (left) + price pill (right) always visible
   - Hover overlay slides up (`translate-y-full → group-hover:translate-y-0`) showing: calories, name, desc, macro chips, Order Now button (navigates to meal detail page `/menu/:id`)
4. **Special Offers & Deals (Carousel)** — Slide-based carousel with custom animations and auto-play:
   - Contains slides of current promotions with promo code copy boxes, and link to `/menu`.
   - Controls: ChevronLeft and ChevronRight navigation buttons, indicator dots.
5. **Why Rock Diet** — Dark teal section (`bg-secondary`), 6 feature cards with icons
6. **Map Section** — Embedded Google Maps iframe (Cairo) + location info card
7. **CTA Banner** — Gradient (`from-primary to-primary-light`) repeat-order promo

### 2. `src/pages/Menu.jsx` — Menu Page

- **Data:** Imported from `src/data/menuItems.js` (`MENU_ITEMS` array)
- **Categories:** `['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack']`
- **State:** `selectedCategory`, `searchQuery`, `addedItems` (per-item count object)
- **Features:**
  - Category tab filtering (client-side)
  - Live search (name + description)
  - Interactive cards with link to `/menu/:id` detail view
  - Add to cart: button shows "Added (n)" with check icon when count > 0
  - Spicy badge uses `bg-warning`, Bestseller uses `bg-primary`
  - Star rating uses `text-accent fill-accent`
  - Macro badges: protein → `bg-surface text-primary`, carbs → `bg-carbs/10 text-carbs`, fat → `bg-fat/10 text-fat`
  - Empty state with Reset Filters button

### 3. `src/pages/MenuItemDetail.jsx` — Meal Detail Page

- **Route:** `/menu/:id`
- **Features:**
  - Reads `id` param to display individual meal data from `src/data/menuItems.js`
  - Back button (navigates back to previous page)
  - High-res product image showcase with rating & category badges
  - Macro highlights (protein, carbs, fat chips)
  - Interactive quantity counter (`+` / `-` buttons)
  - Dynamic "Add to Cart" button calculating total price based on quantity
  - Value propositions section (25-Min Delivery, 100% Organic, Fresh Daily)

### 4. `src/pages/Orders.jsx` — Orders Page

- **Data:** `ACTIVE_ORDERS` (1) and `PAST_ORDERS` (2) constant arrays
- **Tabs:** Active / History via `activeTab` state
- **Active order card:** header with order ID + status pill, ETA, 4-step progress bar (Confirmed → Preparing → On The Way → Delivered), itemized details, courier info, address, total
- **Progress bar:** absolute positioned track + step circles (`bg-primary` for current/done, `bg-surface` for pending)
- **Past orders:** condensed cards with Delivered badge (`bg-success/10 text-success border-success/30`) + Reorder button

---

## 🧩 Components

### `src/components/Navbar.jsx`

- Sticky top header (`sticky top-0 z-50`)
- Desktop: brand logo + nav links (active = `bg-primary text-white`, inactive = `text-text-secondary hover:text-primary`)
- "Order Now" CTA (accent bg)
- Mobile: hamburger toggles drawer (state: `isOpen`), drawer slides down with nav links + CTA
- Uses `NavLink` for active route detection (`end` prop on Home)

### `src/components/Footer.jsx`

- 4-column grid: Brand (logo + tagline), Quick Links, Diet Plans, Why Rock Diet
- Icons use `text-primary`
- Simple centered copyright bar

---

## ⚙️ Scripts

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Oxlint
```

---

## 🚫 RULES FOR AI AGENTS

1. **ALWAYS use theme tokens** — never hardcode Tailwind color classes (gray-_, teal-_, amber-\*, etc.) or hex values in className strings. Use `bg-primary`, `text-text-secondary`, `border-border`, etc.
2. **No global styles in `App.css`** — it's intentionally empty. Global styles live in `index.css` only.
3. **Do NOT change layout/spacing/component structure** when fixing color issues — only swap color classes.
4. **Keep the entrance animation pattern** in Home.jsx consistent (visible state + transition classes).
5. **All page data is frontend-only** — mock data lives in `src/data/menuItems.js` or in-component constant arrays.
6. **Run `npm run build` after every edit** to verify no parse errors.
7. **The 64px sticky navbar** means hero height = `calc(100vh - 64px)` — keep this.
8. **Keep `clsx` + `tailwind-merge` available** — installed for future component utility extensions.
9. **No shadcn/ui installed** — cards are hand-rolled with shadcn anatomy (Card Media / Card Body / Card Action overlay).
10. **Home page uses Unsplash CDN images** — external URLs, not local assets.
11. **ALWAYS log the exact date, time, and details** of what was modified in the Change Log table in `AGENTS.md` whenever any change is made.

---

## 🔮 Future Roadmap (as inferred)

- Add backend (Node/Express or MongoDB via `mongosh`) — currently frontend-only
- Real cart / checkout flow (currently "Add" only increments local counters)
- Payment processing
- User authentication
- State management (Context/Zustand/Redux) — currently component-local state
- Replace Unsplash images with real product photography

---

## 📝 Change Log

| Date & Time          | File(s) Modified               | Change                                                                                                                                                            |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-16T17:25:00Z | `src/pages/PaymentSuccess.jsx`, `src/pages/PaymentFailure.jsx`, `src/App.jsx`, `../rock-diet-backend/.env.development`, `AGENTS.md` | Added dedicated payment result pages: `/payment/success` (PaymentSuccess.jsx) and `/payment/failure` (PaymentFailure.jsx) with success/error icons, auto-redirect to home after 8 seconds, and CTA links (Track Order / Browse Menu / Back to Home), wired routes in `App.jsx`, and updated backend `SUCCESS_URL`/`CANCEL_URL` in `.env.development` from placeholder Google/YouTube links to `http://localhost:5173/payment/success` and `http://localhost:5173/payment/failure`. |
| 2026-08-16T17:08:00Z | `src/pages/Admin.jsx`, `src/pages/Home.jsx`, `src/components/CartDrawer.jsx`, `AGENTS.md` | Added "Included Products" multi-select checkbox list to Admin Offer create/edit form (pre-fills from existing offer `products`, appends product IDs to FormData), added "Order This Offer" button to Home offer carousel wired to `addOfferToCart` via `CartContext` + `isAuthenticated` guard, added loading/error states on the order button, fixed checkout validation error by adding client-side min-length checks for address (5 chars) and phone (8 chars) + displaying detailed backend Joi validation errors instead of generic "validation error" message, all theme-token styled. |
| 2026-08-16T13:43:00Z | `src/pages/Admin.jsx`, `src/pages/Orders.jsx`, `src/components/CartDrawer.jsx`, `AGENTS.md` | Completed offers/coupons feature gaps: added Offer `startDate`/`endDate` fields to Admin create/edit form & submit payload (with date display on offer cards), showed `couponCode`/`discountAmount` on Admin Orders tab and user Orders page (active + history), added available promo-code discovery section in CartDrawer checkout that surfaces live active offers with one-tap code fill, and kept theme-token styling. |
| 2026-08-16T16:20:00Z | `src/context/CartContext.jsx`, `.env`, `src/services/api.js`, `src/services/orderService.js`, `src/services/authService.js`, `src/context/AuthContext.jsx`, `src/components/CartDrawer.jsx`, `src/pages/Signup.jsx`, `src/pages/Orders.jsx`, `src/pages/Home.jsx` | Full-stack integration fixes: fixed cart response shape mismatch (backend returns `{cart, warning}`), renamed `.env` `BACK_END` → `VITE_API_URL` for Vite exposure, removed stale `import.meta.env.BACK_END`, added `reorderOrder` service + Reorder button wiring, added backend `logout` token revocation, fixed order placement to read `data.order` + redirect to Stripe `paymentUrl`, added `activityLevel` to signup form, and made Home "Order Now" link to live `/menu/:id` detail routes. |
| 2026-08-16T15:44:00Z | `src/pages/Signup.jsx`         | Added disabled placeholder options to Gender and Fitness Goal dropdown selects to prevent validation bugs when values remain empty strings.                       |
| 2026-08-16T15:40:00Z | `src/pages/Signup.jsx`, `src/pages/Admin.jsx`, `src/pages/Home.jsx`, `src/pages/Profile.jsx` | Fixed signup validation mismatch by adding required health fields (weight, height, gender, goal), resolved product creation macro mismatch in Admin (protein, carbs, fats), connected Home page to live category & product APIs, and enriched Profile page with daily calorie & macro targets. |
| 2026-08-12T14:30:00Z | `src/services/*`, `src/context/*`, `src/pages/*`, `src/components/*`, `src/App.jsx` | Full end-to-end integration of Node/Express backend APIs: created `categoryService`, `productService`, `cartService`, `orderService`, updated `api.js` to support FormData file uploads, implemented `CartContext` & slide-over `CartDrawer`, created Admin CRUD page (`/admin`) for Categories, Products & Orders management, updated `Menu.jsx`, `MenuItemDetail.jsx`, `Orders.jsx`, `Navbar.jsx`, and `App.jsx` to consume live backend data. |
| 2026-08-10T15:27:00Z | `src/pages/Menu.jsx`, `src/data/menuItems.js` | Reclassified menu categories from food types to meal times: `Breakfast`, `Lunch`, `Dinner`, `Snack`.                                                              |
| 2026-08-10T15:18:00Z | `src/pages/Home.jsx`           | Added custom promotions and discounts carousel section to Home page, complete with promo code and auto-play feature.                                              |
| 2026-08-10T15:15:00Z | `AGENTS.md`                    | Added rule 11 to require exact time & date logs for all changes, updated change log structure to include timestamps.                                              |
| 2026-08-10T15:13:00Z | `src/pages/Home.jsx`           | Fixed Today's Popular Meals grid on home page to use CSS Grid with equal-sized cards (`h-72`).                                                                    |
| 2026-08-10T15:08:00Z | `AGENTS.md`                    | Updated documentation with `src/data/menuItems.js`, `/menu/:id` route, `MenuItemDetail.jsx` page guide, and recent changes.                                       |
| 2026-08-10T11:00:00Z | `src/pages/MenuItemDetail.jsx` | Added dynamic single meal detail view page with macro badges, quantity selector, and total price calculation.                                                     |
| 2026-08-10T11:00:00Z | `src/data/menuItems.js`        | Extracted `MENU_ITEMS` array into central data module for reuse across `Menu.jsx`, `Home.jsx`, and `MenuItemDetail.jsx`.                                         |
| 2026-08-10T11:00:00Z | `src/App.jsx`                  | Added `/menu/:id` route for individual meal details.                                                                                                              |
| 2026-08-09           | `src/index.css`                | Updated `@theme` to teal palette: `primary: #0D7377`, `accent: #14B8A6`, `bg: #F5F7F7`, added `on-primary` tokens                                                 |
| 2026-08-09           | `src/pages/Home.jsx`           | Redesigned landing page: 100vh hero with bg image, entrance animations, gallery grid for Popular Meals, map section, repeat-order CTA                             |
| 2026-08-09           | `src/pages/Home.jsx`           | Categories section converted to shadcn-style Card structure (media + body + action overlay), cards enlarged (`h-64`, `text-xl`, `p-5`)                            |
| 2026-08-09           | `src/pages/Menu.jsx`           | Fixed all hardcoded color classes → theme tokens (`bg-primary`, `text-text`, `border-border`, etc.)                                                               |
| 2026-08-09           | `src/pages/Orders.jsx`         | Fixed all hardcoded color classes → theme tokens                                                                                                                  |
| 2026-08-09           | `src/components/Footer.jsx`    | Fixed remaining hardcoded color classes → theme tokens (`text-gray-700` → `text-text`, `text-teal-600` → `text-primary`, `text-gray-500` → `text-text-secondary`) |
| 2026-08-09           | `src/components/Navbar.jsx`    | Updated to `bg-bg`/`bg-primary`/`text-on-primary` theme tokens                                                                                                    |
| 2026-08-09           | `src/App.jsx`                  | Updated wrapper to `bg-bg text-text selection:bg-primary`                                                                                                         |
| 2026-08-09           | `package.json`                 | Added `clsx` + `tailwind-merge` dependencies                                                                                                                      |
| 2026-08-09           | `AGENTS.md`                    | Created initial documentation file                                                                                                                                |

---

## 🏁 Quick Start

```bash
npm install     # install dependencies
npm run dev     # start dev server
npm run build   # verify production build (run after every edit!)
```

