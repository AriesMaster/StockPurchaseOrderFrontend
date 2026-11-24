# StockFlow — Frontend

Angular web application for managing purchase orders, receiving deliveries and tracking inventory for a small business.

**Status:** Active development. The responsive public homepage, navigation, footer and routing are implemented. Business screens and API integration are planned, not yet operational.

## Technology

- Angular 22, standalone components and TypeScript
- SCSS, monochrome design system, responsive layout
- Angular Material and CDK (installed; theme integration pending)
- npm, Angular CLI and Vitest

## Getting started

Install Node.js compatible with Angular 22 and npm, then run:

```bash
git clone https://github.com/AriesMaster/StockPurchaseOrderFrontend.git
cd StockPurchaseOrderFrontend
npm ci
npm start
```

Open http://localhost:4200.

```bash
npm run build
npm test -- --watch=false
```

## Current source structure

```text
src/
├── app/
│   ├── features/home/                 # Public landing page
│   ├── layouts/public-layout/         # Shared public shell
│   ├── shared/components/
│   │   ├── navbar/
│   │   └── footer/
│   ├── app.ts
│   ├── app.html
│   ├── app.scss
│   ├── app.spec.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── index.html
├── main.ts
└── styles.scss
```

## Planned application workflow

Create a draft order, approve it, receive partial or complete deliveries, review outstanding quantities and inspect inventory movements. For example, receiving 12 of 20 ordered units leaves 8 outstanding.

| Planned route | Purpose | Backend API |
|---|---|---|
| /purchase-orders | Order lookup | GET /api/purchase-orders/{id} |
| /purchase-orders/new | Create draft | POST /api/purchase-orders |
| /purchase-orders/:id | Details, approval and cancellation | GET /api/purchase-orders/{id}; POST /api/purchase-orders/{id}/approval or /cancellation |
| /purchase-orders/:id/receive | Record delivery | POST /api/purchase-orders/{id}/receipts |
| /inventory | Stock and movement history | GET /api/inventory/{sku}; GET /api/stock-movements |

Planned feature folders: `purchase-orders/` and `inventory/`, with feature-local models, API services, components and tests. Shared HTTP problem handling will live in `core/`. Angular HttpClient and a local API proxy to port 8080 are not configured yet. Receipt retries must reuse the original idempotency key and quantities.

## Roadmap

- [x] Angular scaffold and responsive StockFlow homepage
- [ ] Material theme, HTTP client and development proxy
- [ ] Purchase order and inventory screens
- [ ] API integration and validation/error handling
- [ ] Feature tests and end-to-end verification
- [ ] CI/CD and deployment

Authentication, dashboard and additional modules require scope/design decisions.

## Documentation

- [Backend repository](https://github.com/AriesMaster/StockPurchaseOrderBackend)
- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/system-design.md)
- [API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/api-contract.md)
- [Database design and ERD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/database-design.md)
- [Technical specification](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/technical-specification.md)
- [Physical DFD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/physical-dfd.md)

See [LICENSE](LICENSE).
