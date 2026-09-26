<p align="center">
  <img src="public/readme-banner.jpg" alt="PCYC Space Banner" width="100%" />
</p>

<h1 align="center">🌿 PCYC Space</h1>

<p align="center">
  <strong>The digital home of the Philippine Christadelphian Youth Circle</strong><br/>
  <em>United in Faith · Growing in Christ · Connected Across Islands</em>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/features-full%20stack-e0a861?style=for-the-badge&labelColor=2c3324" alt="Features" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/next.js-16.3-fefcf1?style=for-the-badge&logo=nextdotjs&labelColor=2c3324" alt="Next.js" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/react-19-fefcf1?style=for-the-badge&logo=react&labelColor=2c3324" alt="React" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/supabase-auth%20%2B%20db-e0a861?style=for-the-badge&logo=supabase&labelColor=2c3324" alt="Supabase" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/tailwind-v4-fefcf1?style=for-the-badge&logo=tailwindcss&labelColor=2c3324" alt="Tailwind" /></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-deployment">Deploy</a>
</p>

---

## 📖 About

**PCYC Space** is the canonical digital platform for the **Philippine Christadelphian Youth Circle** — the only Christadelphian youth circle in the Philippines. It serves as the central hub where members across ecclesias in Manila, Cebu, Bukidnon, and beyond can connect, register for fellowship events, browse and order fundraising merchandise, and stay rooted in their shared faith.

> *"Success means the site is the first place members check for PCYC updates and the first thing a curious visitor finds when looking for Christadelphian youth community in the Philippines."*

### 🎯 Three Core Functions

| | Function | Description |
|---|---|---|
| 🕊️ | **Inform & Welcome** | Present PCYC's mission, history, leadership, and faith to members and newcomers alike |
| 📅 | **Organize & Connect** | Publish and manage youth events — bible camps, fellowship gatherings, study circles — with online registration |
| 🛍️ | **Fund & Sustain** | Sell branded merchandise with zero-fee manual payment verification through an admin-configured payment provider |

---

## 📚 Documentation

For an in-depth breakdown of the system architecture, database schema, folder structure, UI system, and concurrency mechanics, please refer to the **[Architecture & Developer Documentation](DOCUMENTATION.md)**.

---

## ✨ Features

### 🌐 Public Experience
- **Rich Landing Page** — Animated hero with trust statistics, three faith pillars, event previews, and merchandise highlights
- **Interactive Ecclesias Map** — Dynamic Leaflet map plotting active gathering spots across the archipelago
- **About & History** — PCYC's story, mission statement, leadership team, and statement of faith
- **Events Showcase** — Browse upcoming camps and gatherings with dates, locations, and registration details
- **Merch Catalog** — Browse branded products with multi-image galleries, size variants, and live stock availability
- **Product Reviews** — Verified buyer reviews with star ratings displayed on product detail pages

### 🔐 Authentication & Membership
- **Supabase Auth** — Secure email/password authentication with session management
- **Identity Designations** — Register as *Brother*, *Sister*, or *Friend* with optional baptism date and ecclesia affiliation
- **Role-Based Access Control** — Granular permissions for Member, Admin, and Superadmin roles
- **Protected Route Zones** — Middleware-enforced access control with zero-database JWT validation
- **User Status Management** — Active, Suspended, and Anonymized account states

### 👤 Member Portal
- **Personal Dashboard** — View profile, upcoming registrations, and notification feed
- **Order Hub** — Dedicated orders page with full lifecycle tracking and receipt management
- **Receipt Upload** — Submit payment screenshots for the provider configured by an admin, then track verification
- **Product Reviews** — Verified buyers can rate and review purchased products
- **Account Settings** — Profile editor, password management, and appearance theme selector (Light / Dark / System)
- **In-App Notifications** — Updates on event registrations, order status, and payment verification

### 🛡️ Admin Dashboard
- **Overview & Analytics** — Live metric cards for ecclesias, events, merch, pending receipts, and member count
- **User Management** — Full CRUD for member accounts: search, edit, role assignment, status changes, and admin creation
- **Events CRUD** — Create, edit, publish events with banner uploads and registration management
- **Merch Management** — Full product lifecycle with size variants, stock tracking, and availability toggles
- **Review Moderation** — Admin panel to review, approve, and hide product reviews
- **Order Verification Queue** — Review uploaded payment receipts, approve/reject with notes, update shipping status
- **Ecclesia Directory** — Maintain the Philippine ecclesia directory by region (Luzon, Visayas, Mindanao)
- **Payment Settings** — Configure the payment platform, account details, and QR code shown throughout checkout
- **Site Metrics** — Manage the home-page youth and friends counter

### 🔒 Security & Concurrency
- **Transaction Safety** — Robust Drizzle ORM transactions guarding against race conditions for inventory and event registrations
- **PII Masking** — Email and phone number masking with role-based reveal permissions
- **Audit Logging** — Enterprise-grade audit trail tracking all admin actions (role changes, status updates, PII reveals, data mutations)
- **Rate Limiting** — O(1) sliding-window rate limiter at the middleware level
- **User Anonymization** — GDPR-aligned account anonymization for data privacy compliance
- **Row Level Security** — Supabase RLS policies enforced at the database layer

### 💳 Zero-Fee Payment Flow
```
Buyer places order → Sends payment via the configured payment provider
    → Uploads receipt screenshot → Admin verifies in dashboard
        → Order marked as paid → Fulfillment & shipping
```
> No payment gateway fees. Every peso goes to the community.

### 📧 Transactional Email
- Powered by **Nodemailer** with Brevo SMTP relay
- Order confirmations with payment instructions
- Receipt verification notifications (approved/rejected)
- Event registration confirmations
- Welcome emails for new members
- Custom Supabase auth templates (verification, password reset)
- Development simulation mode when SMTP credentials are absent

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 16.3](https://nextjs.org/) | App Router, Server Components, Server Actions |
| **UI** | [React 19](https://react.dev/) | Component architecture with latest concurrent features |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Custom `@theme` design tokens with glassmorphism |
| **Typography** | [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) | Rich prose styling for markdown content |
| **Animation** | [Motion](https://motion.dev/) | Scroll reveals, interactive cards, and micro-interactions |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) | Type-safe schema, relational queries, migrations |
| **Auth & Storage** | [Supabase](https://supabase.com/) | Authentication, file storage, Row Level Security |
| **Email** | [Nodemailer](https://nodemailer.com/) + Brevo SMTP | Transactional email delivery with HTML templates |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) | Rich text rendering with GitHub Flavored Markdown |
| **Validation** | [Zod 4](https://zod.dev/) | Runtime schema validation for forms and environment |
| **Icons** | [Lucide React](https://lucide.dev/) + [Phosphor Icons](https://phosphoricons.com/) | Beautiful, consistent dual icon libraries |
| **Logging** | [Pino](https://getpino.io/) | Structured JSON logging with pretty-print dev mode |
| **Testing** | [Playwright](https://playwright.dev/) + Node Test Runner | E2E, visual, and unit/integration tests |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Automated typecheck and build verification |
| **Hosting** | [Vercel](https://vercel.com/) | Edge deployment with zero-config Next.js support |

---

## 🎨 Design System

PCYC Space uses a custom design system built on Tailwind CSS v4 with brand-aligned tokens:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🟤 Forest Green  #2c3324  ← Primary / Dark base  │
│   🟡 Warm Gold     #e0a861  ← Accent / Interactive  │
│   ⬜ Cream         #fefcf1  ← Background / Light    │
│                                                     │
│   Typography:  Outfit (body)                        │
│                EB Garamond (headings)                │
│                                                     │
│   Effects:     Glassmorphism panels                  │
│                Radial hero glow                      │
│                Motion-powered scroll reveals         │
│                Interactive card hover animations     │
│                Custom styled scrollbars              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
pcyc-space/
│
├── 📂 app/                          # Next.js App Router
│   ├── 📄 page.tsx                  # Landing page with hero & dynamic content
│   ├── 📄 layout.tsx                # Root layout, fonts, metadata, providers
│   ├── 🎨 globals.css               # Tailwind v4 theme & design tokens
│   ├── 📂 about/                    # About PCYC & faith statement
│   ├── 📂 events/                   # Event listing & [slug] detail pages
│   ├── 📂 merch/                    # Merch catalog & [slug] product pages
│   ├── 📂 orders/                   # Member order hub & receipt management
│   ├── 📂 login/                    # Authentication
│   ├── 📂 register/                 # Member registration
│   ├── 📂 reset-password/           # Password recovery
│   ├── 📂 portal/                   # Member dashboard
│   ├── 📂 settings/                 # User settings
│   ├── 📂 admin/                    # Admin CMS
│   │   ├── 📂 ecclesias/            # Ecclesia directory management
│   │   ├── 📂 events/               # Event CRUD & registrations
│   │   ├── 📂 merch/                # Product management & reviews moderation
│   │   ├── 📂 orders/               # Order verification queue
│   │   ├── 📂 users/                # User management, creation, role editing
│   │   └── 📂 settings/             # Site-wide settings
│   ├── 📂 actions/                  # Server Actions (auth, events, merch, orders, reviews, admin-users)
│   └── 📂 api/                      # API routes (uploads, webhooks, callbacks)
│
├── 📂 components/
│   ├── 📂 ui/                       # Primitives (Button, Card, Modal, Input, Badge, InteractiveCard, ScrollReveal…)
│   ├── 📂 layout/                   # Navbar, Footer, MobileNav, PageHeader
│   ├── 📂 molecules/                # Date badges, empty states, avatars, price tags
│   ├── 📂 domain/                   # Feature components
│   │   ├── 📂 auth/                 # Registration & login forms
│   │   ├── 📂 ecclesias/            # Ecclesia directory display
│   │   ├── 📂 events/               # Event cards & detail views
│   │   ├── 📂 merch/                # Product cards & galleries
│   │   ├── 📂 orders/               # Order cards & admin order details modal
│   │   ├── 📂 reviews/              # Product review section & review modal
│   │   ├── 📂 notifications/        # Notification bell & feed
│   │   └── 📂 settings/             # User settings forms
│   └── 📂 providers/                # Theme & Toast context providers
│
├── 📂 lib/
│   ├── 📂 db/                       # Drizzle schema, migrations, & query layer
│   │   ├── 📂 schema/               # Tables: profiles, events, products, orders, ecclesias,
│   │   │                            #         reviews, audit_logs, notifications, settings
│   │   └── 📂 queries/              # Type-safe data access (admin-metrics, cached, reviews, users…)
│   ├── 📂 supabase/                 # Client factories (browser, server, middleware)
│   ├── 📂 email/                    # Nodemailer SMTP client & HTML email templates
│   ├── 📂 security/                 # Rate limiter, zone classifier, privacy (PII masking), auth guards
│   ├── 📂 validators/               # Zod schemas for all domain entities
│   ├── 📂 constants/                # App-wide constants
│   ├── 📂 logger/                   # Pino structured logging
│   ├── 📂 notifications/            # In-app notification dispatcher
│   └── 📄 storage.ts                # Supabase Storage helpers
│
├── 📂 scripts/                      # CLI utilities and migration helpers
│   ├── 📄 seed.ts                   # Populate DB with sample data
│   ├── 📄 populate-1000-users.ts    # Generate 1,000 realistic test users
│   ├── 📄 create-admin.ts           # Promote a user to admin role
│   ├── 📄 migrate-reviews-and-normalization.ts  # Reviews migration
│   ├── 📄 migrate-user-privacy-and-audit.ts     # Privacy & audit migration
│   └── 📄 ...                       # RLS policies, indexes, diagnostics, verification suites
│
├── 📂 tests/                        # Unit, integration & Playwright visual tests
│   ├── 📄 admin-users-security.test.ts    # Admin user management security tests
│   ├── 📄 reviews-and-bulk-orders.test.ts # Review system & bulk order tests
│   └── 📄 ...                       # Auth, events, orders, notifications tests
│
├── 📂 public/                       # Static assets
├── 📄 middleware.ts                  # Auth + rate limiting + zone routing
├── 📄 drizzle.config.ts             # Drizzle ORM configuration
├── 📄 playwright.config.ts          # E2E test configuration
└── 📄 next.config.ts                # Next.js configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** (included with Node)
- A **Supabase** project ([create one free](https://supabase.com/dashboard))
- A **Brevo account** with [SMTP Key](https://www.brevo.com) for SMTP relay

### 1. Clone & Install

```bash
git clone https://github.com/yurizz-crypto/pcyc-space.git
cd pcyc-space
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database (from Supabase → Settings → Database)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres"

# Email (Brevo SMTP)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="your.brevo.login@email.com"
SMTP_PASSWORD="your-brevo-smtp-key"
EMAIL_FROM="PCYC Space <notifications@yourdomain.com>"
EMAIL_REPLY_TO="admin@yourdomain.com"
```

### 3. Set Up Database

```bash
npx drizzle-kit push      # Apply schema to your database
npm run apply:rls          # Apply Row-Level Security policies and default privileges
npm run create:admin       # Create your first admin account
```

### 4. Launch

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're live! 🎉

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run unit & integration tests |
| `npm run create:admin` | Promote a user to admin role |
| `npm run sync:profiles` | Sync Supabase auth users to profiles table |
| `npm run apply:rls` | Apply database Row-Level Security policies and default privileges |

---

## 🚢 Deployment

PCYC Space is designed for **zero-cost deployment** on free tiers:

| Service | Tier | Purpose |
|---|---|---|
| **Vercel** | Hobby (Free) | Next.js hosting with edge functions |
| **Supabase** | Free | Auth, PostgreSQL database, file storage |
| **Brevo SMTP** | Free | Transactional email delivery via Nodemailer |

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yurizz-crypto/pcyc-space)

1. Connect your GitHub repository
2. Add environment variables from `.env.example`
3. Deploy — Vercel auto-detects Next.js configuration

---

## 🧪 Testing

```bash
# Unit & Integration tests
npm run test

# E2E tests with Playwright
npx playwright install    # First time only
npx playwright test
```

### Test Coverage

| Suite | Scope |
|---|---|
| `admin-users-security.test.ts` | Admin user management & authorization |
| `reviews-and-bulk-orders.test.ts` | Product review system & bulk order processing |
| `auth-password.test.ts` | Password validation & hashing |
| `events.test.ts` | Event queries & date calculations |
| `notifications-emails.test.ts` | Notification dispatch & email templates |
| `orders.test.ts` | Order totals, status transitions, receipt matching |

### Local Verification

Run the checks available in the repository before deployment:
1. **TypeScript typecheck** — `npx tsc --noEmit`
2. **Production build** — `npm run build`
3. **Automated tests** — `npm run test`

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph Client["🌐 Browser"]
        UI[React 19 Components]
        TW[Tailwind CSS v4]
        MO[Motion Animations]
    end

    subgraph NextJS["⚡ Next.js 16.3 (Vercel)"]
        MW[Middleware<br/>Rate Limit · Auth · Zones]
        SC[Server Components]
        SA[Server Actions]
        API[API Routes]
    end

    subgraph Backend["🗄️ Backend Services"]
        SB_AUTH[Supabase Auth<br/>JWT Sessions]
        SB_STORAGE[Supabase Storage<br/>Receipts & Images]
        DB[(PostgreSQL<br/>Drizzle ORM)]
        SMTP[Nodemailer<br/>Brevo SMTP]
    end

    subgraph Security["🔒 Security Layer"]
        AUDIT[Audit Logs]
        PII[PII Masking]
        RLS[Row Level Security]
    end

    UI --> MW
    MW --> SC
    MW --> SA
    SC --> DB
    SA --> DB
    SA --> SB_STORAGE
    SA --> SMTP
    SA --> AUDIT
    API --> SB_AUTH
    UI -.->|Auth| SB_AUTH
    DB --> RLS
    SA --> PII

    classDef client fill:#fefcf1,stroke:#2c3324,color:#2c3324
    classDef server fill:#e0a861,stroke:#2c3324,color:#2c3324
    classDef backend fill:#2c3324,stroke:#e0a861,color:#fefcf1
    classDef security fill:#3d4a32,stroke:#e0a861,color:#fefcf1

    class UI,TW,MO client
    class MW,SC,SA,API server
    class SB_AUTH,SB_STORAGE,DB,SMTP backend
    class AUDIT,PII,RLS security
```

---

## 🌱 Product Principles

1. **🤝 Welcoming First** — Every page makes newcomers feel invited, never excluded by insider language
2. **🔓 Zero-Friction Access** — Public content requires no login; registration respects the Brother/Sister/Friend identity
3. **💰 Zero-Cost Sustainability** — Architecture choices keep operational costs at zero on free tiers
4. **❤️ Community, Not Commerce** — The merch store funds the mission; it feels like fellowship, not a retail operation
5. **✅ Admin Simplicity** — Volunteer admins manage everything from one dashboard without technical knowledge

---

## 🗄️ Database Schema

```mermaid
erDiagram
    profiles ||--o{ event_registrations : registers
    profiles ||--o{ orders : places
    profiles ||--o{ notifications : receives
    profiles ||--o{ product_reviews : writes
    profiles ||--o{ audit_logs : triggers
    events ||--o{ event_registrations : has
    products ||--o{ order_items : contains
    products ||--o{ product_reviews : receives
    orders ||--o{ order_items : includes
    orders ||--o{ payment_receipts : has
    orders ||--o{ product_reviews : enables

    profiles {
        uuid id PK
        string email
        string firstName
        string middleName
        string lastName
        enum designation "BROTHER | SISTER | FRIEND"
        enum role "MEMBER | ADMIN | SUPERADMIN"
        enum status "ACTIVE | SUSPENDED | ANONYMIZED"
        string ecclesia
        date baptismDate
        boolean isAnonymized
    }

    events {
        uuid id PK
        string title
        string slug
        date startDate
        date endDate
        string location
        int maxAttendees
        boolean published
    }

    products {
        uuid id PK
        string name
        string slug
        int price
        string category
        int stockQty
        boolean available
    }

    orders {
        uuid id PK
        string orderNumber
        int totalAmount
        enum status "PENDING_PAYMENT → VERIFICATION_QUEUED → PAID → PREPARING → SHIPPED → COMPLETED → CANCELLED"
        jsonb shippingInfo
    }

    payment_receipts {
        uuid id PK
        string imageUrl
        enum method "GCASH | PALAWAN_PAY | BANK_TRANSFER | MAYA | OTHER"
        enum status "PENDING | APPROVED | REJECTED"
    }

    product_reviews {
        uuid id PK
        int rating "1 to 5 stars"
        text comment
        boolean isHidden
        uuid orderId FK
        uuid productId FK
        uuid userId FK
    }

    audit_logs {
        uuid id PK
        uuid actorId FK
        string action
        string targetType
        jsonb details
        string ipAddress
    }
```

---

## 🤝 Contributing

Contributions are welcome! This is a community project serving the Philippine Christadelphian Youth Circle.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and maintained by the PCYC community.

---

<p align="center">
  <sub>Built with 🤎 for the Philippine Christadelphian Youth Circle</sub><br/>
  <sub><strong>PCYC Space</strong> — Where faith meets fellowship in the digital age</sub>
</p>
