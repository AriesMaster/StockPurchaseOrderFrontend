# StockFlow — Frontend

Angular web application for managing purchase orders, receiving deliveries and tracking inventory for small hardware stores.

[Portfolio case study](https://thabo.netlify.app/stockflow.html)

**Live development preview:** [Angular frontend](https://stockflow-management.netlify.app/) · [Backend health](https://stockflow-backend-5cke.onrender.com/actuator/health). Both hosting dashboards confirm deployment; backend health returned `UP` on 26 November 2026. The Netlify same-origin API proxy is configured; proxy CSRF response was verified; full cloud workflows remain unverified.


**Status:** Active development. This is the authentication feature branch; the default-branch baseline is described below. `main` includes the responsive public homepage, navigation, routing, Material theme, Angular HTTP client and local API proxy. Purchase order and inventory screens and their API integration are planned.

## Implementation progress

Local verification on 26 November 2026: 98 backend and 66 frontend automated tests passed (164 combined), and both builds succeeded before the latest supplier styling refinement. Administrator sign-in, employee administration, supplier creation and supplier directory rendering were demonstrated locally. The refined supplier UI groups contact details, improves responsive form layout and exposes row actions. Dedicated supplier frontend tests, remaining supplier acceptance checks, full role verification and secure public demo access are pending. Latest cloud authentication remains unverified.

- Authentication: login, refresh, logout, session restoration, guards and API interceptor.
- Employee Management: administrator-only account creation, pagination, role and status changes, confirmation dialogs.
- Supplier Management: all-role read/search, administrator create/edit/status actions, reactive forms, pagination and confirmation dialogs.
- Purchase orders, approvals, deliveries and inventory remain planned UI modules.

## Roles

ADMIN, PURCHASING_OFFICER, APPROVER and WAREHOUSE_OFFICER. Backend authorization is authoritative; Angular guards and conditional controls are not security boundaries.

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
git switch feature/auth-ui
npm ci
npm start
```

Open http://localhost:4200.

```bash
npm run build
npm test -- --watch=false
```

## Build and test verification

On 26 November 2026, the local Angular production build succeeded and 66 Vitest tests passed on the authentication feature branch. The suite covers authentication, guards, interceptor, employee service and directory, shared confirmation dialogs and dashboard. Supplier-specific tests remain pending.

## Current source structure

```text
src/
├── app/
│   ├── core/auth/                     # Auth store, guards, interceptor, services
│   ├── features/home/                 # Public landing page
│   ├── features/auth/login/
│   ├── features/dashboard/
│   ├── features/employees/
│   ├── features/suppliers/
│   ├── layouts/workspace-layout/
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

Planned feature folders: `purchase-orders/` and `inventory/`, with feature-local models, API services, components and tests. Shared HTTP problem handling will live in `core/`. Angular HttpClient and a local `/api/**` development proxy to port 8080 are configured. Shared error normalization lives in `core/api-problem.ts`; employee and supplier API services are implemented; procurement services remain pending. Receipt retries must reuse the original idempotency key and quantities.

## Roadmap

- [x] Local supplier creation and directory rendering
- [x] Refined supplier layout visually verified
- [ ] Secure public demo access and deployed login verification

- [x] Angular scaffold and responsive StockFlow homepage
- [x] Material theme, HTTP client and development proxy
- [x] Login UI, auth state, guards and protected workspace on `feature/auth-ui`
- [x] Local administrator sign-in with Spring Boot API
- [x] Employee Management UI and tests
- [x] Supplier Management UI and build
- [ ] Remaining supplier browser acceptance and supplier-specific tests
- [ ] Purchase order and inventory screens
- [ ] API integration and validation/error handling
- [ ] Feature tests and end-to-end verification
- [x] Automated Angular CI on `feature/auth-ui`
- [x] Netlify development preview deployment
- [x] Verify deployed CSRF proxy response
- [ ] Verify latest cloud browser workflows

## Documentation

- [Backend repository](https://github.com/AriesMaster/StockPurchaseOrderBackend/tree/feature/auth-persistence)
- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/system-design.md)
- [API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/api-contract.md)
- [Database design and ERD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/database-design.md)
- [Technical specification](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/technical-specification.md)
- [Physical DFD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/physical-dfd.md)

See [LICENSE](LICENSE).

## Cloud deployment

Netlify builds `feature/auth-ui` with Node 26.13.0 and `npm run build`, publishing `dist/stock-purchase-order-frontend/browser`. The feature branch `netlify.toml` proxies `/api/*` to Render before the SPA fallback. No database credentials or JWT signing secrets belong in the frontend. The published preview is not a completed procurement system; latest cloud workflows require verification.
