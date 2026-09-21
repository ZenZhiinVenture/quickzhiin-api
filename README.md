<div align="center">

# quickzhiin-api

**REST API backend for QuickZhiin — open-source, multi-tenant cloud accounting software.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)

[Frontend Repo](../quickzhiin) · [Report a Bug](https://github.com/ZenZhiinVenture/quickzhiin-api/issues) · [Request Feature](https://github.com/ZenZhiinVenture/quickzhiin-api/issues)

</div>

---

## 🧭 Overview

`quickzhiin-api` is the **headless REST API backend** for the QuickZhiin accounting platform. It handles all business logic, database access, PDF generation, and financial report calculations.

### Polyrepo Architecture

| Repository | Description | Link |
|---|---|---|
| **`quickzhiin-api`** (this repo) | Node.js / Express REST API | You are here |
| **`quickzhiin`** | Next.js 16 App Router frontend | [→ quickzhiin](../quickzhiin) |

> **Decoupled microservices** for regional compliance are planned as separate repositories:
> - `quickzhiin-lhdn` — Malaysia e-Invoice (MyInvois / LHDN) integration
> - `quickzhiin-peppol` — Global Peppol network e-invoicing

---

## ✨ API Modules

| Module | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register` |
| **Tenant** | `POST /api/tenant`, `GET /api/tenant/me` |
| **Contacts** | Full CRUD + CSV import |
| **Products** | Full CRUD + CSV import |
| **Sales** | Quotes, Orders, Invoices, Credit Notes, Payments, Refunds |
| **Purchases** | Requisitions, POs, GRNs, Bills, Credit Notes, Payments |
| **Inventory** | Warehouses, Stock Movements |
| **Accounting** | Chart of Accounts, Journal Entries (CSV import) |
| **Reports** | Trial Balance, P&L, Balance Sheet, General Ledger, Aged Receivables/Payables, Inventory, SST-02 |
| **Banking** | Bank Accounts, Transactions, Reconciliations |
| **Settings** | Users, Roles, Company Profile |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| CSV Parsing | PapaParse |
| PDF Generation | Puppeteer |
| Logging | Winston |
| Testing | Jest |

---

## 🗄 Database Architecture

QuickZhiin uses a **multi-database, multi-tenant** architecture:

```
PostgreSQL Server
├── central_db          ← Global: Users, Tenants, TenantUserAccess
│   └── central.prisma
└── tenant_{id}_db      ← Per-tenant: All business data
    └── schema.prisma
```

Each tenant gets a fully isolated PostgreSQL database. The central database manages authentication and tenant routing only.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL ≥ 14

### Installation

```bash
# 1. Clone the API
git clone https://github.com/ZenZhiinVenture/quickzhiin-api.git
cd quickzhiin-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root:

```env
# Central DB (users & tenants)
CENTRAL_DATABASE_URL=postgresql://user:password@localhost:5432/quickzhiin_central

# Default tenant DB (used for Prisma generate)
DATABASE_URL=postgresql://user:password@localhost:5432/quickzhiin_tenant_default

# JWT secret (use a long random string in production)
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate Prisma clients for both schemas
npx prisma generate --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/central.prisma

# Run migrations on central DB
npx prisma migrate deploy --schema=prisma/central.prisma
```

### Development

```bash
npm run dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
quickzhiin-api/
├── prisma/
│   ├── schema.prisma        # Tenant database schema (per-tenant)
│   └── central.prisma       # Central database schema (users & tenants)
├── src/
│   ├── app.ts               # Express app setup & route mounting
│   ├── controllers/
│   │   ├── account/         # Chart of Accounts, Reports
│   │   ├── accounting/
│   │   │   ├── reports/     # Trial Balance, P&L, Balance Sheet, Aged...
│   │   │   └── transaction/ # Journal Entries (CRUD + CSV import)
│   │   ├── auth/            # Login, Register, Token
│   │   ├── banking/         # Bank Accounts, Transactions, Reconciliation
│   │   ├── contact/         # CRUD + CSV import
│   │   ├── product/         # CRUD + CSV import
│   │   ├── settings/        # Users, Company
│   │   ├── tenant/          # Tenant management
│   │   └── transaction/     # Sales & Purchase documents
│   ├── middlewares/
│   │   ├── auth.ts          # JWT authentication middleware
│   │   └── tenant.ts        # Tenant DB connection middleware
│   ├── routes/              # Express router definitions
│   ├── services/
│   │   ├── account/         # Financial report calculations
│   │   └── prisma/          # Prisma client factories
│   └── utils/               # Logger, helpers
└── tests/                   # Jest unit tests
```

---

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 📐 Code Standards

| Concept | Purpose | DB/API access? | Example |
|---|---|---|---|
| **Service** | Business logic | ✅ Yes | `reportingService.getTrialBalance()` |
| **Controller** | HTTP handler | ✅ Via service | `getTrialBalance(req, res)` |
| **Helper** | App-specific utility | ❌ No | `formatCurrency()` |
| **Util** | Generic, context-free | ❌ No | `toSlug()` |

---

## 🤝 Contributing

QuickZhiin is open-source and welcomes contributions! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📜 License

quickzhiin-api is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

This means:
- ✅ You can freely use, modify, and distribute this software
- ✅ You can run it for your own business
- ⚠️ If you modify and **host it as a service**, you **must** release your modifications under the same AGPLv3 license

See the [LICENSE](./LICENSE) file for full details.

---

## 🗺 Roadmap

See the full roadmap in the [frontend repository](../quickzhiin/ROADMAP.md), including:
- Accounting Periods (locking closed books)
- Multi-Currency with exchange rate tracking
- Bank Feed integrations
- `quickzhiin-lhdn` — Malaysia e-Invoice microservice
- `quickzhiin-peppol` — Global Peppol e-invoicing microservice

---

<div align="center">
Built with ❤️ by <a href="https://zenzhiin.com">ZenZhiin Venture</a>
</div>
