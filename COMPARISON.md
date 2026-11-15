# ShopBoard vs. Open-Source Reference Project (COMPARISON.md)

> Comprehensive architectural comparison between **ShopBoard** and the reference implementation [yaman3bd/shopboard-reference](https://github.com/yaman3bd/shopboard-reference).

---

## 1. Executive Summary

| Dimension | ShopBoard (Our Project) | shopboard-reference |
| :--- | :--- | :--- |
| **Framework & Version** | Next.js 15 (App Router), React 19 | Next.js 16 (App Router, Turbopack), React 19 |
| **Design System** | *Akari Desk Atelier* (Japanese Warm Stone, Coral Accent) | *Clay Design System* (Playful Claymation, Saturated Multi-color) |
| **Language & Direction** | Full Arabic RTL (`dir="rtl" lang="ar"`) | English LTR (`dir="ltr" lang="en"`) |
| **Testing Suite** | **11 Playwright E2E Tests + 25 Vitest Unit Tests** | **Zero Automated Tests** (No Jest, Vitest, or Playwright) |
| **Cart State** | React Context API + Custom Reducer Hook | Zustand with `persist` middleware (normalized IDs only) |
| **Forms & Validation** | Declarative Controlled React + Pure Logic Validators | React Hook Form + Zod Schema Validation |
| **Visual Assets** | Curated 16:10 Studio Setups & 1:1 Product Photography | SVG Vector Illustrations |
| **Self-Grade** | **A- (93 / 100)** | Reference Standard (Teaching Baseline) |

---

## 2. Area-by-Area Comparison

---

### 1. Structure & Organization

#### What I Did
- Organized features under `src/modules/<feature-name>/` following a feature-sliced layout.
- Applied prefixed file naming: `products.types.ts`, `products.api.ts`, `products.logic.ts`.
- Structured application pages within `src/app/` with dedicated routes for:
  - Catalog browsing (`/products`, `/products/[id]`)
  - Curated desk environments (`/setups`, `/setups/[id]`)
  - Curated office gift guide (`/gift-guide`)
  - Cart review and checkout (`/cart`)
- Isolated shared primitives in `src/components/ui/` and `src/shared/`.

#### What the Reference Does
- Places code in the repository root without `src/`: `modules/`, `app/`, `components/`, `lib/`.
- Strict job-based naming without repeating module names: `modules/products/types.ts`, `api.ts`, `filters.ts`, `images.ts`.
- `app/api/` operates as an independent backend living in the same repo; it never imports from `modules/`.
- `components/ui/` components know nothing about the store domain.

#### What I Will Take, and Why
- **Adopt job-based naming inside modules** (`types.ts`, `api.ts`, `schema.ts`):
  - *Why*: Repeating the module name (`products/products.types.ts`) adds redundant noise to import statements (`from '@/modules/products/products.types'`). `modules/products/types` is cleaner, faster to navigate, and standard in high-scale Next.js repositories.

---

### 2. API Client & Mock State Tooling

#### What I Did
- Built a centralized HTTP client in `src/shared/api/client.ts` with custom `ApiException` class, typed request methods, and unified error parsing.
- Implemented real Route Handlers (`src/app/api/products/route.ts`) serving real JSON and remote fetch fallbacks.

#### What the Reference Does
- Implements a single, concise `api<T>(path, init)` wrapper in `lib/api-client.ts`.
- Incorporates dynamic **Demo Switches** in the API route path:
  - `/api/delay/3000` (Simulates network latency to inspect Skeletons)
  - `/api/fail/500` (Simulates server failures to test Error Boundaries and Retry buttons)
  - `/api/empty` (Simulates zero-data responses to test Empty States)

#### What I Will Take, and Why
- **Adopt path-based Demo Switches (`/api/delay/:ms`, `/api/fail/:code`, `/api/empty`)**:
  - *Why*: This is an extraordinary developer experience (DX) and QA tool. It allows developers and testers to preview loading skeletons, empty states, and error recovery directly in the browser by changing one environment variable, without mocking network proxies or modifying backend code.

---

### 3. Types and Schemas

#### What I Did
- Defined strict TypeScript interfaces for all domain entities (`Product`, `ProductColor`, `ProductVariantGroup`, `DeskSetup`, `Review`, `CartState`).
- Written pure validation functions in `*.logic.ts` (e.g. `validateReviewInput()`, `checkout.logic.ts`) accumulating field-specific errors.
- Enforced a zero `any` policy backed by static linting.

#### What the Reference Does
- Employs a strict dual-tier type system:
  - **API Contracts**: Plain TypeScript interfaces in `types.ts` (no runtime Zod parsing overhead for internal endpoints).
  - **User Input Forms**: Zod schemas in `schema.ts` (`checkoutSchema`, `reviewFormSchema`).
- Derives TypeScript form types automatically via `z.infer<typeof schema>`.

#### What I Will Take, and Why
- **Adopt Zod schemas for user-facing input forms**:
  - *Why*: Hand-crafting validation logic in imperative functions requires boilerplate error objects and manual type syncing. Zod schemas declare field constraints (email regex, min length, positive numbers) and infer static TypeScript types automatically.

---

### 4. State Management

#### What I Did
- Managed client state using React Context API + Custom Hooks (`useCart`, `useToast`) with `useReducer` for the cart drawer and checkout calculation.
- Kept search query, category selection, and price slider in React component state.

#### What the Reference Does
- **Cross-Page Cart**: Managed via Zustand (`useCartStore`) with `persist` middleware storing only normalized IDs (`productId` and `quantity`).
- **Catalog Navigation**: Filter, search, and sort parameters reside directly in the **URL Search Params** (`?category=&q=&sort=`).
- **Server Data**: Fetched on the server in Server Components; never duplicated into client state.
- **Optimistic Updates**: Uses React 19 `useOptimistic` for instant review creation and rollbacks.

#### What I Will Take, and Why
- **Store filters and search in URL Search Params**:
  - *Why*: Storing filter state in the URL makes filtered views shareable via links, bookmarkable, and preserves browser History navigation (Back/Forward buttons work seamlessly).
- **Normalized Cart State (`productId` + `quantity` only)**:
  - *Why*: Storing full product objects in localStorage risks cart price and stock staleness. Storing only IDs ensures product data is always re-hydrated with current server truth.

---

### 5. Forms

#### What I Did
- Built accessible declarative forms using controlled React components (`useState`), explicit form labels, ARIA attributes, and error banners.
- Unit tested validation functions in Vitest.

#### What the Reference Does
- Uses `react-hook-form` paired with `@hookform/resolvers/zod`.
- Modular form field wrappers (`TextField`) that bind seamlessly to form state and display accessible validation alerts.

#### What I Will Take, and Why
- **Adopt `react-hook-form` with Zod resolvers for multi-step checkout forms**:
  - *Why*: React Hook Form eliminates top-level container re-renders on every keystroke, delivering 60 FPS input performance on mobile devices.

---

### 6. Loading / Error / Not-Found (Async Lifecycle)

#### What I Did
- Mandated the **4-State UI pattern** (`loading`, `error`, `empty`, `success`) inside container components.
- Designed custom visual skeleton loaders (`<ReviewsSkeleton />`, `<CartSkeleton />`).
- Created custom `not-found.tsx` and `error.tsx` pages.

#### What the Reference Does
- Leverages Next.js App Router native conventions systematically across every route:
  - Every data-fetching route has its own `loading.tsx` and `error.tsx`.
  - Parallel route slots (`@reviews`, `@related`) with individual `default.tsx` and `loading.tsx`, ensuring a slow review endpoint never blocks the primary product details page from rendering.

#### What I Will Take, and Why
- **Adopt Next.js Parallel Route Slots (`@reviews`, `@related`) with streaming Suspense**:
  - *Why*: Splitting secondary page sections into independent slots prevents network bottlenecks and improves Largest Contentful Paint (LCP) by streaming peripheral widgets independently.

---

### 7. UI Kit, Tokens & Aesthetic

#### What I Did
- **Aesthetic**: *Akari Desk Atelier* — inspired by Japanese architectural serenity and organic textures.
- **Tokens**: Warm Stone (`#faf7f2`), Washi Ivory (`#ffffff`), Bamboo Tan / Coral Seal (`#ea5e3c`), Charcoal Ink (`#191817`).
- **Accessibility**: Tailored dual-theme system (Light & Dark) verified with WCAG AAA contrast ratios.
- **Components**: shadcn/ui primitives styled with custom CSS variables in `globals.css`.

#### What the Reference Does
- **Aesthetic**: *Clay Design System* — playful, vibrant SaaS interface inspired by claymation and saturated multi-color cards.
- **Tokens**: Tailwind CSS 4 native `@theme` directives configured directly in `globals.css` without `tailwind.config.js`.

#### What I Will Take, and Why
- **Maintain our *Akari Desk Atelier* aesthetic**:
  - *Why*: Our serene, high-craft aesthetic is dramatically more appropriate for an ergonomic desk equipment and workspace atelier than playful SaaS claymation.
- **Adopt Tailwind CSS 4 `@theme` configuration syntax**:
  - *Why*: Direct CSS `@theme` declarations eliminate legacy config overhead and compile faster with Turbopack.

---

### 8. Tooling & Engineering Rigor

#### What I Did
- **End-to-End Testing**: **11 Playwright E2E browser tests** covering complete customer journeys (Cart, Coupon validation, Desk Setups, Gift Guide, Product variants, and Review submission).
- **Unit Testing**: **25 Vitest unit tests** covering pure logic (pricing, discounts, coupons, bundle calculation, review statistics).
- **Visual Regression Suite**: Automated Playwright script generating **28 full-page screenshots** across Desktop (1440x900) and Mobile (393x852) in Light and Dark modes.
- **Linter & Formatter**: ESLint 9 + Prettier.

#### What the Reference Does
- **Zero Automated Testing**: No Jest, Vitest, or Playwright tests exist in the reference repository.
- **Strict Pre-Commit Guard**: Husky + lint-staged hook running a script that blocks any commit containing `any`, `as` casts, or `!` non-null assertions.
- **Typecheck Script**: `npm run typecheck` runs route compilation checks before pushing.

#### What I Will Take, and Why
- **Adopt the pre-commit cast blocker (`no-any`, `no-type-assertions`)**:
  - *Why*: While our team follows a strict zero-`any` rule, automating this via a git hook prevents accidental type escapes from slipping into the commit history.

---

### 9. AI Governance (CLAUDE.md / AGENTS.md)

#### What I Did
- Maintained an extensive `AGENTS.md` documenting:
  - The feature blueprint.
  - "The 10 Mistakes We Saw the AI Make" (preventative rules against array mutation, raw fetch, arbitrary hex colors, weakening tests).
  - Explicit test immutability ("The Never-Edit-Tests Rule").

#### What the Reference Does
- Concise, scannable `CLAUDE.md` (~140 lines) structured with precise directives.
- Features a **"Who owns which state" matrix**: a single table assigning strict ownership (API, Zustand, URL, Form, Optimistic) for every data point.

#### What I Will Take, and Why
- **Adopt the "Who owns which state" matrix**:
  - *Why*: A concise tabular state-ownership map prevents AI agents from confusing server-fetched state with client stores or local component state.

---

## 3. What I Did Better

While the reference project provides excellent teaching patterns for Next.js 16 conventions, **our project significantly outperforms the reference in multiple production-critical areas**:

### 1. Robust Automated Testing (E2E & Unit Test Coverage)
- **Our Project**: Features an enterprise-grade automated test harness:
  - **25 Vitest unit tests** verifying pure business logic in isolation.
  - **11 Playwright E2E tests** verifying user interactions in real Chromium instances.
  - An automated visual verification runner capturing 28 screenshots across viewports and color schemes.
- **The Reference**: Has **zero tests**. A change to pricing or cart logic in the reference can break silently without any automated safety net.

### 2. Full RTL Arabic Localization & Culturally Nuanced UX
- **Our Project**: First-class Arabic localization (`dir="rtl" lang="ar"`), dual Arabic typography (`Readex Pro` for display headlines, `IBM Plex Sans Arabic` for body text), proper numeral formatting, and authentic localized commerce terminology.
- **The Reference**: Standard English LTR interface only.

### 3. Rich Commercial Domain Depth
- **Shop The Look / Desk Environments (`/setups`)**: Complete interactive workspace collections with dynamic bundle pricing, item toggling, and automated 15% bundle discounts.
- **Office Gift Guide (`/gift-guide`)**: Budget-tiered gift curation (<200, 200–500, +500 SAR) with 1-click gift additions.
- **Tailored Product Options**: Real mechanical switch selections (Linear, Tactile, Clicky), oak vs. walnut wood grains, and custom cable lengths per product.
- **Authentic Photographic Assets**: 16:10 curated desk environment photographs and 1:1 product imagery rather than generic placeholder SVGs.

### 4. The Never-Edit-Tests Integrity Rule
- Our engineering standards forbid relaxing or modifying test assertions when code fails. Tests act as immutable contracts that implementation code must satisfy, preventing silent regressions.

---

## 4. Self-Grade & Honest Evaluation

### Overall Grade: **A- (93 / 100)**

#### Breakdown:
- **Testing & Verification (25/25)**: Outstanding. Having 36 automated tests (25 Unit + 11 E2E) and automated screenshot verification puts our project far ahead of standard teaching repositories.
- **Feature Depth & User Experience (25/25)**: Superb. Setups, gift guides, product variants, and RTL typography make it feel like a real luxury store.
- **Design & Visual Polish (20/20)**: Impeccable. The *Akari Desk Atelier* aesthetic has coherent contrast, zero clashing colors, and thoughtful micro-interactions.
- **Architecture & State (13/15)**: Strong. Feature-sliced modularity is clean. Deducted 2 points for keeping catalog filters in React component state rather than URL Search Params.
- **Form Schemas & Tooling (10/15)**: Good. Forms work reliably with custom validators, but adopting Zod schemas and pre-commit cast blockers will elevate it to a full A+.

---

## 5. Actionable Roadmap (What We Will Implement Next)

1. **Migrate Catalog Filters to URL Search Params**:
   - Update `ProductsFilterBar.tsx` to read and write `?category=`, `?q=`, and `?sort=` via `useSearchParams` and `useRouter`.
2. **Introduce Zod for Review and Checkout Forms**:
   - Install `zod` and `@hookform/resolvers`, defining `checkoutSchema` and `reviewFormSchema`.
3. **Incorporate Path-Based API Demo Switches**:
   - Add `/api/delay/:ms`, `/api/fail/:code`, and `/api/empty` route handling in `src/app/api/products/route.ts`.
4. **Add the "Who Owns Which State" Matrix to `AGENTS.md`**:
   - Codify exact data boundaries to keep AI agents strictly aligned.
