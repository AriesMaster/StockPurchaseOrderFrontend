# StockFlow — Frontend

Angular web application for managing purchase orders, receiving deliveries and tracking inventory for small hardware stores.

[Portfolio case study](https://thabo.netlify.app/stockflow.html)

**Live development preview:** [Angular frontend](https://stockflow-management.netlify.app/) · [Backend health](https://stockflow-backend-5cke.onrender.com/actuator/health). Both hosting dashboards confirm deployment; backend health returned `UP` on 26 November 2026. The Netlify same-origin API proxy is configured; browser integration and end-to-end authentication remain unverified.


**Status:** Active development. `main` includes the responsive public homepage, navigation, routing, Material theme, Angular HTTP client and local API proxy. Purchase order and inventory screens and their API integration are planned.

## Authentication progress

The [authentication feature branch](https://github.com/AriesMaster/StockPurchaseOrderFrontend/tree/feature/auth-ui) adds the login form, signal-based authentication state with in-memory access tokens, an API interceptor, route guards, and a protected workspace. The [Angular CI workflow passed](https://github.com/AriesMaster/StockPurchaseOrderFrontend/actions/runs/45669859781) on that branch. The login UI still needs to connect to the backend authentication endpoints. The four role identifiers are defined in the frontend models; navigation guards are not a substitute for backend authorization.

## System users and responsibilities

StockFlow is an internal procurement system for small hardware stores. It supports multiple employee accounts across four roles, with one role per account initially. Public self-registration is not planned; administrators will provision or invite employees.

| Role | Intended responsibilities |
|---|---|
| Administrator (`ADMIN`) | Manage accounts, roles, suppliers and products; oversee and perform authorized procurement operations. |
| Purchasing Officer (`PURCHASING_OFFICER`) | Create draft purchase orders, submit for approval and cancel eligible orders. |
| Approver (`APPROVER`) | Review and approve orders, and cancel eligible orders. |
| Warehouse Officer (`WAREHOUSE_OFFICER`) | Record partial or complete deliveries and monitor inventory movements. |

All active roles are intended to read orders, products, inventory and stock movements. Business rules apply even to administrators. The workflow is purchasing officer creates order → approver approves → warehouse officer receives goods → inventory is updated. Four demo accounts (one per role) are planned, not yet provisioned.

Role definitions and authentication foundations exist on the feature branches; business permissions, account invitations and role-specific functional screens remain planned.

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

On 26 November 2026, the local Angular production build succeeded and 30 Vitest tests passed on the authentication feature branch. The suite covers authentication state, the API interceptor and route guards.

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
- [x] Netlify development preview deployment
- [ ] Verify deployed API proxy and browser authentication

## Documentation

- [Backend repository](https://github.com/AriesMaster/StockPurchaseOrderBackend)
- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/system-design.md)
- [API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/api-contract.md)
- [Database design and ERD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/database-design.md)
- [Technical specification](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/technical-specification.md)
- [Physical DFD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/physical-dfd.md)

See [LICENSE](LICENSE).

## Cloud deployment

Netlify builds `feature/auth-ui` with Node 26.13.0 and `npm run build`, publishing `dist/stock-purchase-order-frontend/browser`. The feature branch `netlify.toml` proxies `/api/*` to Render before the SPA fallback. No database credentials or JWT signing secrets belong in the frontend. The published preview is not a completed authentication workflow.
