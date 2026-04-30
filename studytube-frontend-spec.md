# StudyTube — Frontend Design Specification
> For use with Antigravity + Stitch UI Builder
> Version 1.0 | Author: Ayush Srivastava | Date: 28-04-2026

---

## 1. Project Overview

**Product Name:** StudyTube  
**Type:** Web Application (Full-stack, React/Next.js)  
**Purpose:** A YouTube-inspired educational video platform that shows ONLY curated study content from approved channels. Zero distractions, fully focused on learning.  
**Core Tagline:** *"YouTube, but only for studying."*

---

## 2. Design Direction & Aesthetic

**Theme:** Dark mode first (YouTube-inspired dark UI)  
**Aesthetic:** Clean, modern, educational — familiar but focused  
**Primary Inspiration:** YouTube Dark UI — but stripped of all entertainment noise  
**Tone:** Professional, focused, student-friendly

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0f0f0f` | Main page background |
| `--bg-secondary` | `#212121` | Cards, sidebar, panels |
| `--bg-hover` | `#3f3f3f` | Hover states |
| `--accent-primary` | `#3ea6ff` | Primary CTA, links, active states |
| `--accent-success` | `#4caf50` | Progress indicators, completed |
| `--accent-warning` | `#ff9800` | Sync status, alerts |
| `--text-primary` | `#f1f1f1` | Main text |
| `--text-secondary` | `#aaaaaa` | Subtitles, meta info |
| `--text-muted` | `#717171` | Placeholder, disabled |
| `--border-color` | `#303030` | Dividers, card borders |
| `--chip-bg` | `#272727` | Category chips background |

### Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Logo / Brand | `YouTube Sans` or `Outfit` | 20px | 700 |
| Headings | `Outfit` | 16–22px | 600 |
| Body / UI Text | `Roboto` | 14px | 400 |
| Video Titles | `Roboto` | 14px | 500 |
| Meta / Timestamps | `Roboto` | 12px | 400 |
| Chips / Badges | `Roboto` | 13px | 500 |

---

## 3. Page-by-Page UI Specification

---

### PAGE 1: Home Feed (`/` or `/home`)

**Layout:** YouTube Homepage clone — dark theme, educational only

#### Components Required:

**A. Top Navigation Bar (Full Width)**
- Left: Hamburger menu icon + StudyTube Logo (book icon + "StudyTube" text in blue)
- Center: Search bar (rounded, dark bg `#121212`, placeholder: "Search study videos...")
  - Search icon on left inside bar
  - Voice search icon on right inside bar (optional)
- Right:
  - Notification bell icon
  - Upload icon (for admins only, hidden for normal users)
  - User Avatar (circular, 32px) → opens profile dropdown
  - If not logged in: "Sign In" button (blue, outlined)

**B. Category Filter Chips (Horizontal Scroll Row)**
- Below navbar, horizontally scrollable
- Pill-shaped chips with dark bg, white text
- Active chip: blue bg (`#3ea6ff`), dark text
- Chips: `All` | `Engineering` | `Medical` | `Law` | `Science` | `Mathematics` | `Commerce` | `UPSC` | `JEE/NEET` | `Programming`
- Thin scrollbar, no visible scrollbar on mobile

**C. Left Sidebar (Collapsible)**
- Width: 240px expanded, 72px collapsed (icon only)
- Items:
  - 🏠 Home
  - 🔔 Subscriptions
  - 📚 My Library
  - 🕐 History
  - ▶️ Watch Later
  - ✅ Progress
  - ─── (divider)
  - **Subscribed Channels** (list of channel avatars + names)
  - ─── (divider)
  - ⚙️ Settings
  - ❓ Help

**D. Main Content Grid**
- Responsive CSS grid: 4 cols (desktop) → 3 cols (tablet) → 2 cols (mobile) → 1 col (small)
- Gap: 16px
- Each item = **Video Card** (see component spec below)

#### Video Card Component:
```
┌─────────────────────────────┐
│   [Thumbnail Image 16:9]    │
│                    [9:45] ← duration badge (dark pill, bottom-right) │
└─────────────────────────────┘
[Channel Avatar 36px]  [Video Title - 2 lines max]
                       [Channel Name ← clickable]
                       [1.2M views • 3 days ago]
```
- Thumbnail: rounded corners 8px, hover → slight scale up (1.02)
- Duration badge: bottom-right corner, dark semi-transparent bg
- Channel avatar: circular, 36px, left of text block
- Title: 2-line clamp, font-weight 500, color `--text-primary`
- Channel name + views + date: color `--text-secondary`, 12px
- Hover state on card: no border, just thumbnail zoom
- Right-click / three-dot menu on hover: Save to Watch Later, Share

---

### PAGE 2: Video Watch Page (`/watch?v={videoId}`)

**Layout:** YouTube Watch Page — 70/30 split

#### Left Column (70%) — Video Player Area:
- **Embedded YouTube Player** — full width, 16:9 ratio
  - No YouTube branding override needed (legal)
  - Autoplay: optional (user setting)
- **Video Title** — 18px, font-weight 600, `--text-primary`
- **Meta Row:**
  - Channel avatar (40px circular) + Channel name (clickable) + Subscriber count
  - Right side: Subscribe button (red if not subscribed, outlined if subscribed)
- **Action Row (below meta):**
  - 👍 Like count | 👎 | ➦ Share | 🔖 Save | ✅ Mark Complete
  - Style: pill buttons, dark bg, icon + text
- **Progress Indicator:**
  - Small linear progress bar below actions
  - Label: "Lecture 3 of 12 completed in this series"
- **Description Box:**
  - Collapsed by default (show more / show less)
  - Dark bg card, rounded, padding 16px

#### Right Column (30%) — Related Videos:
- Header: "More from this Channel" or "Related Study Videos"
- Compact video card list (horizontal thumbnail + text)
- Each: thumbnail (120×68px) + title (2 line) + channel + views
- NO autoplay next recommendation to random videos — only same domain

---

### PAGE 3: Authentication Pages

#### 3A. Login Page (`/login`)
- Centered card on dark bg
- Card: dark bg `#212121`, border-radius 12px, padding 32px, width 400px
- StudyTube logo + tagline at top
- Fields:
  - Email input (dark, rounded)
  - Password input (with show/hide toggle)
- "Sign In" button — full width, blue bg
- Divider: "or"
- "Continue with Google" button — outlined, white icon
- Link: "Don't have an account? Sign Up"

#### 3B. Register Page (`/register`)
- Same card layout
- Fields: Full Name, Email, Password, Confirm Password
- "Create Account" button — full width, blue bg
- After register → redirect to Domain Selection

#### 3C. Domain Selection Page (`/onboarding`)
- Full screen centered layout
- Heading: "What do you want to study?" (large, 28px)
- Subtext: "We'll personalize your feed based on your selection"
- Grid of domain cards (2×3 or 3×2):

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  🔧       │  │  🩺       │  │  ⚖️       │
│Engineering│  │  Medical  │  │   Law     │
└──────────┘  └──────────┘  └──────────┘
┌──────────┐  ┌──────────┐  ┌──────────┐
│  🔬       │  │  💻       │  │  📊       │
│  Science  │  │Programming│  │ Commerce  │
└──────────┘  └──────────┘  └──────────┘
```

- Each card: dark bg, large emoji icon, domain name
- Selected state: blue border + blue bg tint + checkmark
- Multi-select allowed
- "Continue" button at bottom — enabled only if ≥1 domain selected

---

### PAGE 4: Channel Page (`/channel/{channelId}`)

**Layout:** YouTube Channel page style

- **Banner:** Full width banner image (from YouTube API or placeholder)
- **Channel Info Row:**
  - Channel avatar (80px circular)
  - Channel name (24px bold)
  - Subscriber count + video count
  - Subscribe / Subscribed button
  - Domain badge: e.g., `Engineering` chip
- **Tab Bar:** Videos | Playlists | About
- **Videos Grid:** Same video card component as home feed

---

### PAGE 5: Search Results Page (`/search?q={query}`)

- Search bar at top (pre-filled with query)
- Filter row: All | Channels | By Domain | Sort (Latest / Most Viewed)
- Results list (vertical, not grid):
  - Wider thumbnail (246×138px)
  - Title, channel name, view count, upload date
  - Short description snippet
- "No results found" state: illustration + "Try different keywords"

---

### PAGE 6: Progress / Dashboard Page (`/progress`)

- **Header:** "My Learning Progress"
- **Stats Row (cards):**
  - 📹 Videos Watched: `42`
  - ✅ Completed: `18`
  - ⏱️ Watch Time: `14h 32m`
  - 📚 Domains Active: `3`
- **Domain Progress Section:**
  - Per domain: label + linear progress bar + percentage
  - e.g., Engineering ████████░░ 78%
- **Continue Watching Section:**
  - Horizontal scroll row of in-progress video cards
- **Recently Watched:**
  - Compact list view with timestamp

---

### PAGE 7: Admin Panel (`/admin`)

> Only visible to admin role users

- **Sidebar:** Dashboard | Channels | Categories | Sync Status | Users
- **Channel Management:**
  - Table: Channel Name | Domain | Videos Synced | Status | Actions
  - Add Channel button → modal with YouTube Channel URL input
  - Actions: Edit | Disable | Remove
- **Sync Status Panel:**
  - Last sync time
  - Channels synced count
  - Failed syncs (if any)
  - "Trigger Manual Sync" button
- **Category Management:**
  - CRUD interface for domain categories

---

## 4. Reusable Component Inventory

| Component | Description |
|---|---|
| `<Navbar />` | Top navigation bar with search |
| `<Sidebar />` | Left collapsible sidebar |
| `<VideoCard />` | Grid video card with thumbnail |
| `<VideoCardCompact />` | Horizontal compact card for sidebar/search |
| `<CategoryChips />` | Horizontal scrollable filter chips |
| `<VideoPlayer />` | Embedded YouTube player wrapper |
| `<ChannelBadge />` | Avatar + name + subscriber count |
| `<ProgressBar />` | Linear progress with label |
| `<DomainCard />` | Onboarding domain selection card |
| `<AuthCard />` | Login / Register form card |
| `<StatCard />` | Dashboard stat display card |
| `<AdminTable />` | Channel management data table |
| `<SyncStatus />` | Sync indicator with timestamp |
| `<SearchBar />` | Standalone search input component |
| `<Button />` | Primary, secondary, outlined, danger variants |
| `<Avatar />` | Circular image with fallback initials |
| `<Badge />` | Domain tag / status chip |
| `<Modal />` | Generic modal overlay |
| `<Toast />` | Notification toast (success/error/info) |

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|---|---|---|
| Mobile | < 640px | Sidebar hidden, 1-col grid, bottom nav |
| Tablet | 640–1024px | Sidebar icon-only, 2-col grid |
| Desktop | 1024–1280px | Sidebar expanded, 3-col grid |
| Wide | > 1280px | Sidebar expanded, 4-col grid |

---

## 6. Navigation Flow

```
/login or /register
        ↓
/onboarding  (domain selection — first time only)
        ↓
/home  (curated feed)
  ├── click video → /watch?v={id}
  ├── click channel → /channel/{id}
  ├── search → /search?q={query}
  ├── sidebar → /progress
  ├── sidebar → /history
  ├── sidebar → /watch-later
  └── avatar → /settings or /logout

/admin  (separate protected route)
  ├── /admin/channels
  ├── /admin/categories
  └── /admin/sync
```

---

## 7. Key UI States to Design

| State | Description |
|---|---|
| Loading Skeleton | Gray shimmer cards while feed loads |
| Empty Feed | Illustration + "No videos in this domain yet" |
| Error State | "Something went wrong. Try again." + retry button |
| Subscribed State | Subscribe button turns outlined + "Subscribed" text |
| Video Completed | Green checkmark overlay on thumbnail |
| Search No Results | Empty state with suggestion |
| Sync In Progress | Animated spinner in admin panel |
| Admin Disabled Channel | Grayed out row with "Disabled" badge |

---

## 8. Interaction & Micro-interactions

- **Video card hover:** Thumbnail scale 1.02, show 3-dot menu
- **Subscribe button:** Instant toggle with optimistic UI
- **Category chip select:** Smooth bg color transition (200ms)
- **Sidebar collapse:** Smooth width transition (300ms ease)
- **Mark complete:** Checkmark animation + green flash
- **Page transitions:** Subtle fade-in (opacity 0→1, 150ms)
- **Toast notifications:** Slide in from bottom-right, auto-dismiss 3s
- **Loading skeletons:** Shimmer animation (left-to-right gradient)

---

## 9. Tech Stack Reference (for Stitch)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + custom components |
| Icons | Lucide React |
| State Management | Zustand (global) + React Query (server state) |
| Auth | NextAuth.js |
| Video Embed | YouTube IFrame API |
| HTTP Client | Axios |
| Animations | Framer Motion (page transitions, micro-interactions) |

---

## 10. Pages Priority for MVP Build

Build in this order:

```
Priority 1 (Must Have - MVP):
  ✅ Navbar + Sidebar layout shell
  ✅ Home Feed with Video Cards
  ✅ Video Watch Page
  ✅ Login / Register Pages
  ✅ Domain Onboarding Page

Priority 2 (Important):
  ⬜ Channel Page
  ⬜ Search Results Page
  ⬜ Progress Dashboard

Priority 3 (Admin):
  ⬜ Admin Panel (Channel Management)
  ⬜ Sync Status Dashboard
```

---

## 11. Notes for Stitch

- All pages use dark theme by default (`bg: #0f0f0f`)
- Use CSS variables for all colors (defined in `:root`)
- All components must be responsive by default
- Sidebar should be a persistent layout component across all pages
- Video cards use aspect-ratio 16:9 for thumbnails
- No entertainment-style content (trending, shorts, etc.) — educational only
- Domain filter chips are the primary discovery mechanism on home page
- Progress bar color: `#4caf50` (green) for completion tracking

---

*End of StudyTube Frontend Specification v1.0*
*Prepared for Antigravity + Stitch — Ready to generate UI*
