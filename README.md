# StockFlow — Frontend

Angular web application for managing purchase orders, receiving deliveries and tracking inventory for small hardware stores.

[Portfolio case study](https://thabo.netlify.app/stockflow.html)

**Status:** Active development. `main` includes the responsive public homepage, navigation, routing, Material theme, Angular HTTP client and local API proxy. Purchase order and inventory screens and their API integration are planned.

## Authentication progress

The [authentication feature branch](https://github.com/AriesMaster/StockPurchaseOrderFrontend/tree/feature/auth-ui) adds the login form, signal-based authentication state with in-memory access tokens, an API interceptor, route guards, and a protected workspace. The [Angular CI workflow passed](https://github.com/AriesMaster/StockPurchaseOrderFrontend/actions/runs/45669859781) on that branch. The login UI still needs to connect to the backend authentication endpoints.

## Technology

- Angular 22, standalone components and TypeScript
- SCSS, monochrome design system, responsive layout
- Angular Material and CDK (light theme with monochrome primary and surface overrides configured)
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

## Build and test verification

On 25 November 2026, the local Angular production build succeeded and 20 Vitest tests passed on the authentication feature branch. The suite covers authentication state, the API interceptor and route guards.

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

Planned feature folders: `purchase-orders/` and `inventory/`, with feature-local models, API services, components and tests. Shared HTTP problem handling will live in `core/`. Angular HttpClient and a local `/api/**` development proxy to port 8080 are configured. Shared error normalization lives in `core/api-problem.ts`; business API services remain pending. Receipt retries must reuse the original idempotency key and quantities.

## Roadmap

- [x] Angular scaffold and responsive StockFlow homepage
- [x] Material theme, HTTP client and development proxy
- [x] Login UI, auth state, guards and protected workspace on `feature/auth-ui`
- [ ] End-to-end sign-in with the Spring Boot API
- [ ] Purchase order and inventory screens
- [ ] API integration and validation/error handling
- [ ] Feature tests and end-to-end verification
- [x] Automated Angular CI on `feature/auth-ui`
- [ ] Deployment

## Documentation

- [Backend repository](https://github.com/AriesMaster/StockPurchaseOrderBackend)
- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/system-design.md)
- [API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/api-contract.md)
- [Database design and ERD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/database-design.md)
- [Technical specification](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/technical-specification.md)
- [Physical DFD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/physical-dfd.md)

See [LICENSE](LICENSE).
