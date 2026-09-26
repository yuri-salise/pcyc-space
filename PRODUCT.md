# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Dual audience, equal weight:**

1. **Existing PCYC members** — Brothers, Sisters, and Friends within the Philippine Christadelphian community who participate in youth circle events, order fundraising merchandise, and stay connected across ecclesias. They log in, register for camps, place merch orders, and upload payment receipts for the provider configured by PCYC administrators.

2. **Prospective visitors and friends** — People curious about the Christadelphian faith or looking for a Philippine youth fellowship community. They browse publicly, learn about PCYC's mission and history, view upcoming events, and may register as a Friend to participate.

**Admins** — PCYC leadership managing events, merchandise inventory, payment receipt verification, and member roles through an integrated admin panel.

## Product Purpose

PCYC Space is the digital home of the Philippine Christadelphian Youth Circle — the only Christadelphian youth circle in the Philippines. It serves three core functions:

1. **Inform & welcome** — Present PCYC's mission, history, leadership, and faith to both existing members and newcomers.
2. **Organize & connect** — Publish and manage youth events (bible camps, fellowship gatherings, study circles) with online registration.
3. **Fund & sustain** — Sell branded merchandise (shirts, hoodies, tote bags, stickers) with a manual payment verification flow using an admin-configured payment platform and screenshot receipts to raise funds at zero transaction cost.

Success means the site is the first place members check for PCYC updates and the first thing a curious visitor finds when looking for Christadelphian youth community in the Philippines.

## Positioning

PCYC is the sole Christadelphian youth circle in the Philippines — unique by definition. The site does not compete with other youth fellowships; it serves as the canonical digital presence for a community that currently lacks one.

## Operating Context

- Members are spread across multiple Philippine ecclesias (Manila, Davao, Cebu, etc.)
- Events are primarily in-person camps and gatherings; the site handles promotion and registration, not the event itself
- Merch orders use manual payment: buyer sends funds via the configured provider → uploads a receipt screenshot → admin verifies and fulfills
- Communication supplements, not replaces, existing group chats and in-person fellowship
- Admin operations happen through the built-in dashboard, not a third-party CMS

## Capabilities and Constraints

**Confirmed capabilities:**
- Public pages: landing, about/history, events listing and detail, merch catalog
- User auth: registration with Brother/Sister/Friend designation, conditional baptism date, ecclesia affiliation
- Member portal: profile management, order history, receipt upload
- Admin dashboard: events CRUD, merch inventory, order/receipt verification queue, member management
- Manual payment flow with receipt screenshot upload to private Supabase Storage
- Transactional email via Nodemailer and Brevo SMTP relay (order confirmation, verification notices)

**Constraints:**
- Zero-cost operations on free tiers (Supabase, Vercel, and Brevo SMTP relay)
- No automated payment gateway yet; the current flow is manual receipt verification
- No real-time chat or messaging — out of scope; members receive in-app notifications
- Philippine Peso (PHP) currency only

## Brand Commitments

- Existing PCYC logo and branding materials (to be provided by user)
- Core palette (user-confirmed):
  - `#e0a861` — warm gold
  - `#fefcf1` — cream/off-white
  - `#2c3324` — deep forest green
- Name: "PCYC" / "Philippine Christadelphian Youth Circle"
- Tone: welcoming, faith-driven, youthful but grounded

## Current Product Surface

- Public landing, About, Events, and Merchandise pages are implemented.
- Members can register, manage profiles, view notifications, register for events, place orders, upload receipts, and review completed purchases.
- Admins can manage members, ecclesias, events, merchandise, reviews, payment settings, site metrics, and order verification.
- The payment platform, account name, account number, and QR code are managed from the admin dashboard and reused across checkout and receipt upload.

## Product Principles

1. **Welcoming first** — Every page should make a newcomer feel invited, not excluded by insider language.
2. **Zero-friction access** — Public content requires no login; registration is simple and respects the Brother/Sister/Friend identity.
3. **Zero-cost sustainability** — Architecture choices must keep operational costs at zero or near-zero on free tiers.
4. **Community, not commerce** — The merch store funds the mission; it should feel like fellowship, not a retail operation.
5. **Admin simplicity** — Volunteer admins should manage everything from one dashboard without technical knowledge.
