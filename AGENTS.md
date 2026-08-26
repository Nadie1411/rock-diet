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
| 2026-08-26T00:00:00Z | `src/App.jsx` | Added `ScrollToTop` component that listens to `pathname` changes via `useLocation` and calls `window.scrollTo(0, 0)` on every route navigation — fixes the issue where navigating to a new page left the viewport scrolled at the previous page's scroll position (landing on the footer). |
| 2026-08-24T18:54:00Z | `src/pages/Admin.jsx` | Fixed Support tab invisible in Admin panel: the tab strip container used `overflow-x-auto flex-nowrap scrollbar-hide`, so with 9 tabs the last one (Support) was clipped past the right edge with no scrollbar to reveal it — swapped to `flex-wrap` so all tab buttons stay visible at every width (they now wrap onto extra rows instead of scrolling away); verified `activeTab === "support"` wiring (tab button + panel render) and production build. |
| 2026-08-24T18:51:00Z | `../rock-diet-backend/src/DB/model/supportTicket.model.js` (new), `../rock-diet-backend/src/modules/support/*` (new: controller, service, validation), `../rock-diet-backend/src/DB/model/notification.model.js`, `../rock-diet-backend/src/modules/notification/notification.service.js`, `../rock-diet-backend/src/modules/notification/notification.controller.js`, `../rock-diet-backend/src/app.bootstrap.js`, `src/services/supportService.js` (new), `src/pages/CustomerService.jsx` (new), `src/components/CustomerServiceButton.jsx` (new), `src/App.jsx`, `src/pages/Admin.jsx`, `src/components/Navbar.jsx` | Added Customer Service call-back flow (guest-friendly): new `supportTicket` model (phone, query ≤1000 chars, optional userId/userName snapshot, open/resolved status) with public rate-limited `POST /support` that attaches the logged-in user when a valid token is present via an `optionalAuthentication` wrapper and fires non-blocking `sendAdminSupportNotification()` — saves a `type:"support"` DB notification for every admin ("New Support Request" + phone + query preview) and pushes FCM with deep link `/admin?tab=support`; admin-only `GET /support/admin` + `PATCH /support/admin/:ticketId/resolve`. Frontend: floating bottom-right "Customer Service" pill button (hidden on its own page, warning-dot pulse) linking to `/customer-service` — new page with phone (+965 placeholder) + question textarea (char counter, client-side validation mirroring backend Joi), success screen, detailed Joi error display; Admin panel gained a Support tab listing tickets as cards (Open/Resolved pills, tel: "Call Now" links, resolve action, open-count badge on tab) fetched on mount; Navbar notifications now render Headphones icon in warning tones for support type and deep-link to `/admin?tab=support`. Fixed 2 pre-existing backend bugs uncovered during live verification: (1) mixed inclusion/exclusion projection `"fcmTokens ... -password"` made MongoDB throw "Cannot do exclusion on field password in inclusion projection", silently killing BOTH support and existing order admin notification fan-out at the admin lookup — both now use inclusion-only selects; (2) `validation()` middleware iterates `Object.keys(schema)` so bare `Joi.object(...)` schemas crash with 500 (Joi internals like `.type` get validated as request keys) — support controller wraps schemas as `{ body }`/`{ params }` per auth-module convention, and notification.controller's four usages were fixed the same way (FCM token registration was silently broken for admins). Verified end-to-end on live server: guest POST → 200 ticket + admin DB notification saved, invalid body → 400, GET list → 200 (admin token), resolve → 200 resolved, guest → 401, non-admin → 403; probe data cleaned up. |
| 2026-08-24T15:28:00Z | `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/common/email/meal.plan.email.template.js`, `../rock-diet-backend/src/modules/cron/cron.controller.js` | Added automatic weekly meal-plan rollover: new `rolloverExpiredMealPlans()` service finds users with non-empty weeklyMeals whose weeklyMealsExpiresAt is in the past and carries the same meals into the next week — new expiry anchored to the old one (+7d, repeated until future so long-downtime backlogs self-heal), reminder flag reset to null so next week's "expires soon" email can fire, meals array untouched, no user email sent; called at the start of `notifyExpiringMealPlans()` (piggybacks existing hourly Vercel cron, no new cron entry) so rolled plans never surface as expired; admin digest template (`adminMealPlanExpiringTemplate`) now takes optional `rolledSubscribers` rendered as a "🔄 Auto-Rolled Plans" section telling admins to assign a fresh plan if they want changes (expiring table omitted when empty, fully backward compatible); cron response reports `rolled` count; verified offline renders (rolled-only/both/empty) + live DB test with throwaway probe user: expired -2d plan → rolled to exactly +5d, flag reset, meals intact, second run no-op, probe deleted. |
| 2026-08-24T15:19:00Z | `src/pages/Profile.jsx` | Surfaced subscription + weekly meal plan on the user Profile page (data already returned by getProfile — no backend change): new "My Subscription" card between profile and Food Preferences showing Active/Expired pill with days remaining, package/goal/duration chips (GOAL_LABELS map), and Start/End date boxes (formatProfileDate helper, weekday-aware en-GB format); new "My Weekly Meal Plan" card showing total planned meals, expiry pill ("Until <date>" or Expired via weeklyMealsExpiresAt), week totals strip (kcal + P/C/F chips summed from meal snapshots), 7-day grid sorted sat→fri (DAY_ORDER) where each day card lists its meals with name, kcal/P/C/F line, italic notes, and "Rest day" empty days; both cards use theme tokens only; verified npm run build. |
| 2026-08-24T15:13:00Z | `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.service.js` | Fixed "One or more selected meals no longer exist" on plan assignment: `assignMealPlanToUser` passed raw Mongoose ObjectId instances (from the live mealPlan doc) into `updateUserWeeklyMeals`, whose product lookup Map is keyed by `_id.toString()` strings — every `productMap.has(objectId)` returned false so all meals were reported missing; assign endpoint now converts IDs via `String(meal.productId)` and `updateUserWeeklyMeals` normalizes defensively (`filter(Boolean).map(String)` on collected IDs + `String(meal.productId)` snapshot lookups), same defensive lookup added to `buildSnapshotDays`; verified end-to-end on live server: create probe plan → 201, assign to admin → 200 with correct meal name + 307 kcal snapshot, plan deleted + admin weeklyMeals restored byte-for-byte. |
| 2026-08-24T15:07:00Z | `../rock-diet-backend/src/common/email/meal.plan.email.template.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.service.js` | Enriched the meal-plan assignment email with bundle identity: `mealPlanAssignedTemplate` now accepts an optional `plan {name, description}` and renders a highlighted "📋 Your Assigned Plan" card under the greeting plus a personalized intro line ("Your **Bulking Week** meal plan is ready") and plan-name-branded subject (`Your "<name>" Meal Plan Is Ready — Rock Diet`); `updateUserWeeklyMeals` gained optional `plan` param passed through to the template (undefined for manual per-subscriber saves → renders exactly as before, fully backward compatible); `assignMealPlanToUser` passes `{name, description}` from the bundle so Meal-Plans-tab assignments identify themselves; email already carried day-by-day meal cards (name + kcal/P/C/F macro line + notes) and expiry date; verified template render offline in both modes. |
| 2026-08-24T15:04:00Z | `../rock-diet-backend/src/DB/model/mealPlan.model.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.validation.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.service.js`, `src/pages/Admin.jsx` | Made meal-plan goal optional + fixed create dropping goal: root cause of the recurring "mealPlan validation failed: goal is required" was `createMealPlan` in the service not accepting/passing `goal` (controller sent it, service silently dropped it before `model.create`) — now accepts goal and spreads it conditionally; model `goal` no longer required, Joi `planGoalField` is `.allow("").optional()`, update uses `$unset` on goal when cleared so bundles become fully goal-optional (legacy goal-less plans are first-class: no badge, visible under All Bundles filter); Admin builder no longer blocks on empty goal ("Select bundle goal (optional)..."); verified end-to-end against live server with minted admin token + real product ID: POST with goal → 201 & goal persisted, POST without goal → 201, cleanup DELETEs → 200. |
| 2026-08-24T14:38:00Z | `../rock-diet-backend/src/DB/model/mealPlan.model.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.validation.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.service.js`, `../rock-diet-backend/src/modules/mealPlan/mealPlan.controller.js`, `src/pages/Admin.jsx` | Turned Custom Meal Plans into goal-based bundles with full editability: new required `goal` field on the mealPlan model (backend `GoalEnum`: weight_loss/maintenance/bulking) validated via Joi on create/update and passed through service/controller; Admin plan builder now has a "bundle goal" select (reusing GOAL_LABELS, client-side required check), Edit prefills name/description/goal/all 7 days; plan cards gained a goal chip (`bg-accent/10 text-accent`) and the plans grid is filterable by goal pill tabs (All Bundles / Weight Loss / Maintenance / Bulking) with a per-goal empty state. |
| 2026-08-24T14:32:00Z | `../rock-diet-backend/src/DB/model/mealPlan.model.js` (new), `../rock-diet-backend/src/modules/mealPlan/*` (new: controller, service, validation), `../rock-diet-backend/src/app.bootstrap.js`, `src/services/planService.js` (new), `src/pages/Admin.jsx` | Added admin Custom Meal Plans system (build once, assign to any subscriber): new `mealPlan` model with named/described reusable weekly plans whose day/meal subdocs mirror user `weeklyMeals` (productId ref + name/calories/protein/carbs/fats snapshot + notes); admin-only CRUD at `/api/meal-plan` where create/update validate all product IDs exist and snapshot macros server-side via the codebase convention (protein×4 + carbs×4 + fats×9, rounded); new `POST /api/meal-plan/:planId/assign/:userId` reuses `updateUserWeeklyMeals` so assignment refreshes snapshots from live products, stamps +7d expiry, resets reminder flag, and sends the branded assignment email; frontend gained a "Meal Plans" Admin tab with a plan builder card (name/description inputs + 7-day grid of add-meal selects and per-meal note fields matching the subscriber planner UX) and plan cards showing meals/week count, week totals kcal/P/C/F from snapshots, per-day coverage chips, Edit/Delete actions, and an inline assign panel with a subscriber dropdown + confirm dialog warning it replaces the current week and emails the user; assignment refreshes the subscribers list. |
| 2026-08-24T13:36:00Z | `src/pages/Menu.jsx` | Added macro chips to menu cards: each meal card now shows kcal + P/C/F chips between the description and price row (kcal → `bg-primary/10 text-primary`, P → protein tokens, C → carbs tokens, F → fat tokens); calories derived client-side via the shared convention (protein×4 + carbs×4 + fats×9, rounded) since products don't store calories; macros come straight from the product list API which already returns full docs. |
| 2026-08-24T13:27:00Z | `../rock-diet-backend/src/DB/model/auth.model.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/common/email/meal.plan.email.template.js`, `src/pages/Admin.jsx` | Added per-meal macro snapshots to weekly meal plans: embedded `calories`/`protein`/`carbs`/`fats` Number fields (min 0, default 0) on each `weeklyMeals.meals` subdocument; `updateUserWeeklyMeals` now selects `name protein carbs fats` from products and snapshots them per meal, deriving calories server-side via the codebase convention (protein×4 + carbs×4 + fats×9, rounded) so macros stay accurate even if the product is later edited; assigned-plan email cards now show a kcal/protein/carbs/fats line when calories exist (macros passed through in the email payload); Admin weekly-meal planner draft now carries snapshot macros with live-product fallback, renders kcal/P/C/F chips on each assigned meal block plus a per-day totals line under the day label. |
| 2026-08-23T14:51:00Z | `../rock-diet-backend/src/common/email/meal.plan.email.template.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/cron/cron.controller.js` | Added admin digest emails for expiring weekly meal plans: new `adminMealPlanExpiringTemplate` branded HTML email with a table of affected subscribers (name, email, package, exact expiry datetime) plus an action hint pointing to Admin → Subscribers; `notifyExpiringMealPlans()` now also fetches all active admins (`role=admin`, no DeletedAt) and sends each a digest when at least one newly-expiring plan was found this run — since the user query filters on unreminded plans only, the digest fires exactly once per batch (no hourly repeats); failures logged non-blocking; cron response now reports `adminsNotified`. |
| 2026-08-23T14:46:00Z | `../rock-diet-backend/src/DB/model/auth.model.js`, `../rock-diet-backend/src/common/email/meal.plan.email.template.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/cron/cron.controller.js`, `../rock-diet-backend/vercel.json`, `src/pages/Admin.jsx` | Added subscription-renewal reminder emails: new `subscriptionReminderSentAt` field on user model (reset to unset whenever admin renews via updateUserSubscription so renewed plans get future reminders); new `subscriptionExpiringTemplate` branded HTML email (package name, exact end date, urgency box, renew CTA) added alongside meal-plan templates; new `notifyExpiringSubscriptions()` service queries users with a package whose subscriptionEnd falls within the next 24h without a prior reminder, emails each via non-blocking helper, and stamps `subscriptionReminderSentAt` only on successful send; new cron route `GET /cron/subscription-reminders` guarded by the same CRON_SECRET check; backend vercel.json gained second hourly cron entry hitting it. Frontend Admin subscriber card now shows "renewal reminder sent" indicator under the subscription date range; subscribers API returns the new flag. |
| 2026-08-23T14:31:00Z | `../rock-diet-backend/src/DB/model/auth.model.js`, `../rock-diet-backend/src/common/email/meal.plan.email.template.js` (new), `../rock-diet-backend/src/common/email/send.email.js` (used), `../rock-diet-backend/src/config/config.service.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/cron/cron.controller.js` (new), `../rock-diet-backend/src/app.bootstrap.js`, `../rock-diet-backend/vercel.json`, `src/pages/Admin.jsx` | Added meal-plan email notifications: new `weeklyMealsUpdatedAt`/`weeklyMealsExpiresAt` (+7 days from assignment)/`weeklyMealsReminderSentAt` fields on user model; created branded HTML templates (`mealPlanAssignedTemplate` with day-by-day meal cards incl. notes, and `mealPlanExpiringTemplate` warning <24h left); `updateUserWeeklyMeals` now stamps expiry, resets reminder flag, and sends the assignment email non-blocking via shared `sendMealPlanEmail` helper (logs failures); new service `notifyExpiringMealPlans()` queries users whose plan expires within 24h without a prior reminder, emails each, and marks `weeklyMealsReminderSentAt`; new secret-guarded cron router `GET /cron/meal-plan-reminders` (requires Bearer/`x-cron-secret` == `CRON_SECRET`) mounted in app.bootstrap before rate-limited routers; backend `vercel.json` gained hourly Vercel cron hitting that path (Vercel auto-sends the CRON_SECRET Authorization header). Frontend Admin subscriber card now shows plan expiry status line under Weekly Meals toggle (active until / expires-soon warning / expired) with "expiry reminder sent" indicator; subscribers API now returns the three new fields. |
| 2026-08-23T14:06:00Z | `../rock-diet-backend/src/common/enum/user.enum.js`, `../rock-diet-backend/src/DB/model/auth.model.js`, `../rock-diet-backend/src/modules/user/user.validation.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/user/user.controller.js`, `src/services/userService.js`, `src/pages/Admin.jsx`, `src/data/foodPreferences.js` | Added admin weekly-meal assignment: new `WeekdayEnum` (sat–fri) in backend enums, embedded `weeklyMeals` array on user model (`day` + `meals[]` with `productId` ref→product, snapshot `name`, `notes` max 500), new `updateWeeklyMealsSchema` Joi validation (max 7 days × 10 meals), backend service `updateUserWeeklyMeals` verifies product IDs exist and snapshots product names before saving, `weeklyMeals` now included in `getSubscribers` response; new admin-only route `PUT /api/user/admin/:userId/weekly-meals`. Frontend: added `updateWeeklyMeals` to userService, built expandable per-subscriber "Weekly Meals" planner in Admin Subscribers tab — 7 day cards each with "+ Add meal" select populated from live products (name + KD price), assigned meal blocks with note input under each meal + remove button, Save Weekly Plan (replaces whole week) wired to PUT endpoint updating subscriber state from response, planned-meals count on toggle. Also aligned frontend `FORBIDDEN_FOOD_OPTIONS` (11 values) with backend enum after tree_nuts/shellfish/pork were removed server-side. |
| 2026-08-23T13:53:00Z | `../rock-diet-backend/src/modules/user/user.service.js`, `../rock-diet-backend/src/modules/user/user.controller.js`, `src/data/foodPreferences.js` (new), `src/services/userService.js` (new), `src/pages/Admin.jsx`, `src/pages/Profile.jsx` | Added admin Subscribers tab for weekly meal planning: backend `getSubscribers` service queries users with a package (sorted by soonest renewal), decrypts phone numbers, and computes `subscriptionActive`/`daysRemaining` + weekly macro targets (calories/protein/carbs/fats ×7); new admin-only route `GET /api/user/admin/subscribers`. Frontend: created shared `src/data/foodPreferences.js` (`FORBIDDEN_FOOD_OPTIONS` + `forbiddenFoodLabel` helper, refactored Profile.jsx to import it) and `src/services/userService.js` (`getSubscribers`, `updateSubscription`); added Subscribers tab to Admin panel with search (name/email/phone/package) + refresh, subscriber cards showing identity/contact, active/expired status pill with days remaining, plan chips (package/goal/duration), subscription window, daily target grid, weekly-target highlight bar, body stats (weight/height/BMI/gender/age/activity), forbidden-food chips, and inline "Edit Meal Plan / Subscription" form (package text input + goal & duration selects) wired to existing `PATCH /user/admin/:userId/subscription` endpoint with validation, success/error feedback and list refresh. |
| 2026-08-23T13:33:00Z | `../rock-diet-backend/src/common/enum/user.enum.js`, `../rock-diet-backend/src/DB/model/auth.model.js`, `../rock-diet-backend/src/modules/user/user.validation.js`, `../rock-diet-backend/src/modules/user/user.service.js`, `src/services/authService.js`, `src/context/AuthContext.jsx`, `src/pages/Profile.jsx` | Added forbidden-food (taste-based exclusions) feature: new `ForbiddenFoodEnum` (14 items: peanuts, tree nuts, dairy, eggs, gluten, seafood, shellfish, red meat, pork, chicken, soy, mushrooms, sesame, spicy) in backend enums, `forbiddenFoods` array field on user model with enum validation, added to `updateProfileSchema` Joi validation and `allowedFields` in updateProfile service with duplicate de-dupe. Frontend: added `updateProfile` PATCH call to authService, exposed `updateProfile` in AuthContext (updates user state from response), built "Food Preferences" card on Profile page between profile card and quick links — view mode shows selected forbidden foods as error-toned chips, edit mode renders toggle chip grid for all 14 options with save (primary) / cancel actions, loading state, inline error + auto-dismissing success message; empty array clears all selections. |
| 2026-08-20T15:58:00Z | `rock-diet-backend/src/DB/model/addon.model.js` (new), `rock-diet-backend/src/DB/model/product.model.js`, `rock-diet-backend/src/DB/model/cart.model.js`, `rock-diet-backend/src/DB/model/order.model.js`, `rock-diet-backend/src/modules/addon/*` (new: controller, service, validation), `rock-diet-backend/src/modules/cart/cart.service.js`, `rock-diet-backend/src/modules/cart/cart.controller.js`, `rock-diet-backend/src/modules/cart/cart.validation.js`, `rock-diet-backend/src/modules/order/order.service.js`, `rock-diet-backend/src/modules/product/product.service.js`, `rock-diet-backend/src/modules/product/product.controller.js`, `rock-diet-backend/src/modules/product/product.validation.js`, `rock-diet-backend/src/app.bootstrap.js`, `src/services/addonService.js` (new), `src/services/cartService.js`, `src/context/CartContext.jsx`, `src/components/CartDrawer.jsx`, `src/pages/Admin.jsx` | Full-stack add-ons system: created Addon model (name, price, description, image, isActive) with admin CRUD at `/api/addon`, extended Product with `availableAddons` refs, extended Cart/Order item schemas with `selectedAddons` array (addonId, name, price), updated Cart service to validate & store addons per line item, updated Order service to snapshot addons in order items + include addon prices in Stripe checkout line items + reorder, updated Product service to populate availableAddons, added addon selection UI in CartDrawer with expandable panels per cart item + checkbox toggles + addon price display in checkout summary, updated CartContext subtotal to include addon prices, updated cartService.js to send addons in add/update requests, added Addons tab to Admin panel with full CRUD (create/edit/delete) + card grid display with image, name, price, active status badge, and modal form with name, description, price, active status, and image upload. |
| 2026-08-19T17:23:00Z | `src/services/api.js`, `src/context/AuthContext.jsx`, `src/services/authService.js`, `rock-diet-backend/src/common/middleware/authentication.js`, `rock-diet-backend/src/modules/auth/auth.controller.js` | Swapped token storage system from cookies to `localStorage`. Backend `authentication.js` extracts Bearer tokens from `Authorization` header with cookie fallback. Backend `/login` and `/refresh-token` return tokens in response body. Frontend `api.js` request method sets `Authorization` header, handles token refreshing, and `AuthContext.jsx` manages `localStorage` keys for loadProfile, login, and logout. |
| 2026-08-19T12:00:00Z | `vercel.json`, `src/services/api.js` | Fixed iPhone Safari cross-origin authentication failure: added Vercel rewrite to proxy `/api/*` through frontend domain to `rock-diet-backend.vercel.app/:path*`, changed `api.js` fallback from `http://localhost:3000` to `/api` so all API calls are same-origin in production — eliminates Safari ITP cross-site cookie blocking, preflight-POST-dropping, and Set-Cookie storage failures. |
| 2026-08-19T19:30:00Z | `api/[...path].js` (new), `vercel.json`, `src/services/api.js` | Replaced Vercel rewrites proxy with a serverless proxy function (`api/[...path].js`) that runs in the SAME Vercel project as the frontend. The proxy receives browser requests at `/api/*`, forwards them to `rock-diet-backend.vercel.app/*` server-side, and streams the response back including all `Set-Cookie` headers. This guarantees cookies are set on `rock-diet.vercel.app` (same-origin), completely eliminating Safari ITP cross-site cookie issues. Updated `vercel.json` SPA rewrite to exclude `/api/` paths. |
| 2026-08-19T01:00:00Z | `src/services/api.js`, `src/pages/NotFound.jsx`, `src/pages/MenuItemDetail.jsx`, `src/pages/Home.jsx`, `src/pages/Profile.jsx`, `src/pages/Admin.jsx`, `src/components/Navbar.jsx`, `src/components/CartDrawer.jsx`, `src/components/AppDownloadBanner.jsx`, `src/App.jsx`, `src/context/AuthContext.jsx`, `rock-diet-backend/src/modules/order/order.service.js`, `rock-diet-backend/src/modules/auth/auth.service.js`, `rock-diet-backend/src/modules/notification/notification.service.js`, `rock-diet-backend/src/DB/repository/base.repository.js`, `rock-diet-backend/src/app.bootstrap.js`, `AGENTS.md` | Production readiness audit: fixed API URL trailing-slash fragility (`api.js` normalizes BASE_URL), webhook idempotency (early return if already paid), stock decrement race condition (atomic `$gte` check), duplicate admin notifications removed from `createOrder` (only webhook sends now), fixed invalid theme tokens in `NotFound.jsx`, fixed MenuItemDetail stock=0 badge and quantity=0 bugs, fixed base repository `find()` ignoring `sort` option, fixed CartDrawer state persistence across open/close, removed conflicting Tailwind color classes in Home.jsx map/CTA sections, fixed Profile.jsx auth loading flash, fixed Admin.jsx `URL.createObjectURL` memory leak, fixed auth login user enumeration (generic error message + proper 401 cause codes), excluded password hash from all user queries, fixed AppDownloadBanner hardcoded `gray-100`, fixed Navbar invalid `h-13` Tailwind class, sanitized global error handler to never leak stack traces in production, always return 200 to Stripe webhooks. |
| 2026-08-19T01:15:00Z | `rock-diet-backend/README.md` | Added comprehensive backend documentation: full API endpoint reference, data model schemas, environment variable guide, architecture overview, security features, deployment instructions, and troubleshooting guide — readable for both technical and non-technical audiences. |
| 2026-08-16T17:25:00Z | `src/pages/PaymentSuccess.jsx`, `src/pages/PaymentFailure.jsx`, `src/App.jsx`, `../rock-diet-backend/.env.development`, `AGENTS.md` | Added dedicated payment result pages: `/payment/success` (PaymentSuccess.jsx) and `/payment/failure` (PaymentFailure.jsx) with success/error icons, auto-redirect to home after 8 seconds, and CTA links (Track Order / Browse Menu / Back to Home), wired routes in `App.jsx`, and updated backend `SUCCESS_URL`/`CANCEL_URL` in `.env.development` from placeholder Google/YouTube links to `http://localhost:5173/payment/success` and `http://localhost:5173/payment/failure`. |
| 2026-08-16T17:08:00Z | `src/pages/Admin.jsx`, `src/pages/Home.jsx`, `src/components/CartDrawer.jsx`, `AGENTS.md` | Added "Included Products" multi-select checkbox list to Admin Offer create/edit form (pre-fills from existing offer `products`, appends product IDs to FormData), added "Order This Offer" button to Home offer carousel wired to `addOfferToCart` via `CartContext` + `isAuthenticated` guard, added loading/error states on the order button, fixed checkout validation error by adding client-side min-length checks for address (5 chars) and phone (8 chars) + displaying detailed backend Joi validation errors instead of generic "validation error" message, all theme-token styled. |
| 2026-08-17T16:10:00Z | `src/components/Navbar.jsx`, `rock-diet-backend/src/modules/order/order.service.js`, `rock-diet-backend/src/modules/notification/notification.service.js` | Fixed notification not firing on order: moved `sendAdminOrderNotification()` call into `createOrder()` so it fires immediately when order is placed (not just on Stripe webhook which often doesn't fire on localhost). Fixed admin query filter from `DeletedAt: null` to `DeletedAt: { $exists: false }` so admins without a `DeletedAt` field are found. Rewrote Navbar to fix layout: removed `translate-x-4` offset, unified mobile/desktop notification bell inside single `dropdownRef`, added `data-notification-bell` attribute for click-outside handling. |
| 2026-08-17T16:30:00Z | All frontend + backend files | Full Kuwait localization: changed Stripe currency from `egp` to `kwd`, replaced all `$` currency symbols with `KD` (CartDrawer, MenuItemDetail, Orders, Admin, email templates, notifications, coupon errors), changed phone placeholders from `+20` to `+965`, changed address placeholder from Cairo to Kuwait, added Kuwait phone validation regex (`+965 5xx`) to order validation, fixed broken `$KD{...}` template literal in Admin coupon table, standardized all prices to 3 decimal places (KWD format). |
| 2026-08-17T17:00:00Z | `vercel.json` (frontend), `rock-diet-backend/src/app.bootstrap.js`, `rock-diet-backend/src/config/config.service.js`, `rock-diet-backend/src/config/firebase-admin.js`, `rock-diet-backend/api/index.js` (new), `rock-diet-backend/vercel.json` (new), `.gitignore` | Prepared both frontend and backend for Vercel deployment. Frontend: added `vercel.json` with SPA rewrite rule for React Router. Backend: refactored `app.bootstrap.js` to export Express app (skips `listen()` on Vercel), wrapped dotenv loading in try/catch for Vercel env, updated Firebase admin to support `FIREBASE_SERVICE_ACCOUNT` env var (JSON string) as fallback to file, created `api/index.js` serverless entry point with cold-start DB/Redis caching, created `vercel.json` routing all requests to the serverless function. Added `.env` to frontend `.gitignore`. Changed Stripe `line_items` currency to `aed` (Stripe doesn't support KWD) while keeping UI as KD. |
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
| 2026-08-17T15:55:00Z | `src/App.jsx`, `src/main.jsx`, `src/components/Navbar.jsx`, `src/context/NotificationContext.jsx`, `src/services/notificationService.js`, `src/config/firebase.js`, `public/firebase-messaging-sw.js` | Added Firebase Cloud Messaging push notification system: frontend Firebase config, NotificationContext provider with FCM token registration (admin-only), foreground toast + background system notifications, notification bell dropdown in Navbar with unread count badge, mark-as-read functionality, 30s polling for unread count, service worker for background push. |
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

