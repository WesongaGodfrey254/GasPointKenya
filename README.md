<div align="center">
<img width="1200" height="475" alt="GasPoint Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# GasPoint - LPG Cooking Gas Sales, Ordering & Delivery Management System

GasPoint is a multi-provider LPG cooking gas marketplace, stock & pricing management, and doorstep delivery platform built for the Kenyan market.

---

## Features

- **Multi-Provider Marketplace**: Browse authorized gas depots by proximity and brand (Taifa Gas, Lake Gas, Galana Gas, Supa Gas, Mpishi Gas, Sea gas, M Gas, TotalEnergies, Rubis K-Gas, Afrigas, Pro Gas, etc.).
- **Free Delivery & Pickup**: Delivery is free across all providers. Customers can also choose free station pickup.
- **Pay on Delivery / Pay at Station**: Customers complete their order without upfront payment. They pay on delivery, or at the station when picking up.
  - Order confirmation: **“You will make your payment on delivery”** or **“You will pay at station at pickup.”**
- **Provider Dashboard**:
  - Independent stock & custom pricing (refill, exchange, and new cylinder rates).
  - Custom product photo uploads & presets.
  - Order dispatch & delivery rider tracking.
  - Payment collection confirmation for delivered / picked-up orders.
- **Onboarding & Approval Flow**:
  - Providers register and receive EPRA verification guidelines.
  - Account activation fee: **KSh 3,000** payable via M-Pesa to **0706184411**.
  - Provider submits transaction reference; Super Admin inspects and activates station.
- **Super Admin Central Authority Console**:
  - Full governance, compliance inspections, user & provider management, platform-wide analytics, and automated email logs.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Clone & Install
```bash
git clone <repository-url>
cd gaspoint-management-system
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your local database and administrative credentials in `.env`:
```env
SQL_HOST=127.0.0.1
SQL_PORT=5432
SQL_USER=gaspoint_user
SQL_PASSWORD="your_password"
SQL_DB_NAME=gaspoint_db
SQL_ADMIN_USER=gaspoint_user
SQL_ADMIN_PASSWORD="your_password"

SUPER_ADMIN_EMAIL="admin@gaspoint.co.ke"
SUPER_ADMIN_PASSWORD="YourStrongPassword!"
```

> **Security Note:** The `.env` file and `firebase-applet-config.json` are listed in `.gitignore` to prevent secret leaks on GitHub.

### 3. Database Migration & Seeding
Push the database schema to your PostgreSQL instance:
```bash
npx drizzle-kit push --config=src/db/drizzle.config.ts
```

### 4. Run the Application
Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

- **Production URL:** [https://gaspointkenya.vercel.app](https://gaspointkenya.vercel.app)
- **Auto-deploy:** Pushes to the `main` branch of
  [WesongaGodfrey254/GasPointKenya](https://github.com/WesongaGodfrey254/GasPointKenya)
  are deployed automatically by Vercel.
- **Database isolation:** Production uses a dedicated `gaspoint` PostgreSQL
  database configured through `GASPOINT_DATABASE_URL`, keeping GasPoint data
  separate from other projects on the same database host.
