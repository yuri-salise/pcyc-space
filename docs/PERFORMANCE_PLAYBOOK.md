# PCYC Space — Production Performance Engineering Playbook

This document provides architectural standards, infrastructure blueprints, and actionable optimization recipes for the PCYC Space application.

---

## 1. Infrastructure Architecture

```
[ Client Browsers & Mobile Devices ]
                 │
                 ▼ (HTTPS / HTTP3 - TLS 1.3)
   ┌───────────────────────────────┐
   │ Cloudflare / Edge CDN         │  ── Cache static assets (_next/static, images, fonts)
   └───────────────────────────────┘  ── Early Hints, Brotli, DDoS mitigation, WAF
                 │
                 ▼ (HTTPS Reverse Proxy)
   ┌───────────────────────────────┐
   │ Layer 7 Load Balancer (ALB)   │  ── SSL Termination, Health Checks (/api/health)
   └───────────────────────────────┘  ── Sticky Sessions for WebSockets, Zero-Downtime Rollouts
                 │
        ┌────────┴────────┐
        ▼                 ▼
 ┌─────────────┐   ┌─────────────┐
 │ Next.js App │   │ Next.js App │    ── Node.js 20+ Runtime with Turbopack builds
 │ (Node 1)    │   │ (Node 2)    │    ── In-memory request deduplication (React cache)
 └─────────────┘   └─────────────┘
        │                 │
        └────────┬────────┘
                 ▼ (TCP Transaction Pool - Port 6543)
   ┌───────────────────────────────┐
   │ Supabase / PgBouncer Pooler   │  ── Transaction Pooling (Max client conns: 200)
   └───────────────────────────────┘  ── Upstream DB connections: 15-20 max
                 │
                 ▼
   ┌───────────────────────────────┐
   │ PostgreSQL 16 DB (WAL / NVMe) │  ── Drizzle Composite Indexes on filters & foreign keys
   └───────────────────────────────┘
```

---

## 2. Load Balancer Blueprint (Nginx / AWS ALB)

### A. Health Checks
The application exposes a lightweight, non-blocking health probe at `/api/health`.

- **Endpoint**: `GET /api/health`
- **Expected Status**: `200 OK`
- **Interval**: 10 seconds
- **Timeout**: 2 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

### B. Nginx Reverse Proxy Configuration
```nginx
# /etc/nginx/conf.d/pcyc-space.conf

upstream pcyc_cluster {
    zone pcyc_backend 64k;
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=10s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 80;
    server_name pcyc.space www.pcyc.space;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pcyc.space www.pcyc.space;

    # Modern TLS configuration
    ssl_certificate /etc/letsencrypt/live/pcyc.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pcyc.space/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security & HSTS
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Next.js static asset immutable cache at edge/proxy
    location /_next/static/ {
        proxy_pass http://pcyc_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Public static uploads & assets
    location /images/ {
        proxy_pass http://pcyc_cluster;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400";
    }

    # Health Check bypass for monitoring
    location = /api/health {
        proxy_pass http://pcyc_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # Dynamic Application Requests & Server Actions
    location / {
        proxy_pass http://pcyc_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Max client body size for GCash receipt photo uploads
        client_max_body_size 10M;
        
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

---

## 3. Global CDN Strategy (Cloudflare / CloudFront)

### Edge Rules & Caching Hierarchy
1. **Next.js Static Assets (`/_next/static/*`)**:
   - Cache Level: **Cache Everything**
   - Edge Cache TTL: **1 Year (31,536,000s)**
   - Browser Cache TTL: **1 Year (`immutable`)**
   - Reason: Every build generates unique chunk hashes (e.g., `app-page-348f9a.js`). Content never changes under the same URL.

2. **Optimized Images (`/_next/image*`)**:
   - Cache Level: **Cache Everything**
   - Edge Cache TTL: **30 Days**
   - Query String: **Include all query parameters (`url`, `w`, `q`)**
   - Compression: WebP and AVIF negotiated automatically via client `Accept` headers.

3. **Dynamic API & Auth Routes (`/api/*`, `/login`, `/admin/*`, `/portal/*`)**:
   - Cache Level: **Bypass (No Cache)**
   - Security: WAF Rate Limiting on `/login` (max 10 requests per minute per IP to defend against credential stuffing).

---

## 4. Database Connection Pooling (PgBouncer)

### Connection Pool Configuration
Because Next.js runs in serverless, worker, or containerized environments where multiple Node processes spin up and tear down, connecting directly to PostgreSQL port `5432` causes connection starvation:

```
Error: remaining connection slots are reserved for non-replication superuser connections
```

### PgBouncer Guidelines
- **Pool Mode**: `transaction` (Port `6543`)
- **Server Connection Sizing Formula**:
  $$\text{Pool Size} = (2 \times \text{vCPU Cores}) + \text{Disk Spindles/Channels}$$
  For a 2 vCPU database server, set `max_db_connections = 15`. PgBouncer can safely handle up to `200` concurrent client queries through these 15 connections in transaction mode.
- **Prepared Statements**: Disable client-side prepared statement persistence when using transaction poolers (`prepare: false` in postgres connection config).
- **Idle Timeout**: Set `idle_timeout = 20` seconds to quickly recycle dead client connections.

---

## 5. Payloads & Compression Architecture

1. **Gzip & Brotli**:
   - Handled natively in Next.js via `compress: true` in `next.config.ts`.
   - Brotli (`br`) is prioritized for text payloads (`application/json`, `text/html`, `application/javascript`), providing 15-20% higher compression ratios than Gzip.
2. **Image Optimization**:
   - Supported formats in `nextConfig`: `['image/avif', 'image/webp']`.
   - AVIF reduces file sizes by up to 50% compared to JPEG with near-identical visual fidelity.
   - Remote hosts allowlisted: Supabase storage (`*.supabase.co`) and Unsplash.
3. **Tree-Shaking & Code Splitting**:
   - In Client Components (`'use client'`), interactive modals and dialogs (`AdminOrderDetailsModal`, `ReviewModal`, `ReceiptUploadModal`) use `next/dynamic` with `{ ssr: false }` to defer interactive dialog bundle weight until user interaction.
   - In Server Components, code splitting is achieved via standard component boundaries and streaming suspense without `{ ssr: false }` (which Next.js disallows on the server).
   - Leaflet interactive map (`EcclesiasMapView`) is dynamically loaded only on the ecclesia map route.

---

## 6. Lighthouse Audit & Core Web Vitals (CWV) Runbook

### Target Thresholds (Mobile & Desktop)
| Metric | Target | PCYC Architecture Implementation |
|---|---|---|
| **LCP (Largest Contentful Paint)** | `< 2.5s` | Priority loading for Hero emblems, preconnected font origins, AVIF image formats. |
| **INP (Interaction to Next Paint)** | `< 200ms` | Debounced search handlers (`useDebounce`, 250ms), React 19 concurrent transitions, minimal main-thread JavaScript execution. |
| **CLS (Cumulative Layout Shift)** | `< 0.1` | Explicit aspect ratios on image showcases, responsive container reserves, route-segment `loading.tsx` skeletons. |
| **FCP (First Contentful Paint)** | `< 1.8s` | Server Components streaming SSR with critical CSS inline. |
| **TTFB (Time to First Byte)** | `< 800ms` | Next.js `unstable_cache` with tag-based invalidation for database queries (`events`, `products`, `ecclesias`). |

### How to Run Automated Audits via Lighthouse CI
1. Install Lighthouse CLI:
   ```bash
   npm install -g @lhci/cli
   ```
2. Create `lighthouserc.json`:
   ```json
   {
     "ci": {
       "collect": {
         "startServerCommand": "npm run start",
         "url": [
           "http://localhost:3000/",
           "http://localhost:3000/events",
           "http://localhost:3000/merch",
           "http://localhost:3000/about"
         ],
         "numberOfRuns": 3
       },
       "assert": {
         "assertions": {
           "categories:performance": ["error", { "minScore": 0.9 }],
           "categories:accessibility": ["error", { "minScore": 0.95 }],
           "categories:best-practices": ["error", { "minScore": 0.95 }],
           "categories:seo": ["error", { "minScore": 0.95 }],
           "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
           "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
           "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
         }
       }
     }
   }
   ```
3. Run audit suite:
   ```bash
   lhci autorun
   ```
