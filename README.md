# StockFlow — Frontend

An Angular workspace for a hardware store to manage suppliers and products and create draft purchase orders. A buyer chooses a supplier, adds products from its catalogue and sees the total in rand.

The feature and test descriptions below refer to [feature/auth-ui](https://github.com/AriesMaster/StockPurchaseOrderFrontend/tree/feature/auth-ui). The `main` branch contains the public Angular shell.

[Portfolio case study](https://thabo.netlify.app/stockflow.html) · [Development preview](https://stockflow-management.netlify.app/) · [Spring Boot API](https://github.com/AriesMaster/StockPurchaseOrderBackend/tree/feature/auth-persistence)

## Create a purchase order

1. An administrator adds suppliers and products, then opens **Supplier catalogues** to link a product to a supplier and enter its agreed unit price.
2. An administrator or purchasing officer opens **Purchase orders**, selects one active supplier and adds items from its catalogue. Changing supplier clears the current lines.
3. Enter the quantity for each item and choose **Create draft order**. The server saves the product names and supplier prices. For example, 20 boxes at R12.50 each gives a line total of **R250.00**.
4. Open **View details** in the directory to see the saved prices, quantities and total. Every active role can read orders and filter the list by status.

Creating a draft leaves stock unchanged. Order approval, cancellation, delivery receiving and stock tracking are planned.

## Workspace routes

| Route | Who can use it | What it does |
|---|---|---|
| `/dashboard` | All active roles | Opens the role dashboard after login or session restoration. |
| `/dashboard/employees` | Administrator | Creates employees and changes roles and account status. |
| `/dashboard/suppliers` | All can read, administrator can edit | Searches suppliers and manages contact details and active status. |
| `/dashboard/products` | All can read, administrator can edit | Searches products by SKU or name and manages prices and active status. |
| `/dashboard/supplier-catalogues` | Administrator | Assigns products to suppliers and maintains each offer’s price and availability. |
| `/dashboard/purchase-orders` | All can read, administrator and purchasing officer can create | Creates drafts, filters the directory and displays order details on the same screen. |

Spring Security enforces permissions. Angular uses route guards, keeps the access token in memory and restores the session through the API.

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

The development server proxies `/api` to the Spring Boot service on port 8080. Start the API before signing in.

## Source structure

```text
src/app/
├── core/                      # Authentication, session handling and API errors
├── features/
│   ├── home/                  # Public landing page
│   ├── auth/login/
│   ├── dashboard/
│   ├── employees/
│   ├── suppliers/             # Supplier directory, catalogue editor and HTTP services
│   ├── products/              # Product directory and HTTP service
│   └── purchase-orders/       # Draft form, directory, details, models and HTTP service
├── layouts/                   # Public shell and employee workspace
└── shared/components/         # Navigation, breadcrumbs, page headers and dialogs
```

## Verification and next work

On 27 November 2026 the production build succeeded and **123 Vitest tests passed across 16 files** at [75bdb3e](https://github.com/AriesMaster/StockPurchaseOrderFrontend/commit/75bdb3eb43c491f69f94f42641ae2bf4bf835358). The suite covers login/session handling, guards, the interceptor, employee, supplier and product directories, HTTP services and shared components.

The local browser showed two saved draft orders before the supplier picker was updated. The next browser check is to assign a supplier price, save a draft through the new picker and compare the saved total. Dedicated tests for the catalogue editor and order form are still planned.

## Cloud deployment

Netlify builds `feature/auth-ui` with `npm run build`, publishes `dist/stock-purchase-order-frontend/browser` and proxies `/api/*` to Render before the SPA fallback. The preview health and proxied CSRF checks were recorded on 26 November. The version with supplier catalogues still needs a hosted login and draft-order walkthrough. [Deployment notes](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/cloud-deployment.md)

## Documentation

- [Backend repository](https://github.com/AriesMaster/StockPurchaseOrderBackend/tree/feature/auth-persistence)
- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/system-design.md)
- [API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/api-contract.md)
- [Database design and ERD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/database-design.md)
- [Technical specification](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/technical-specification.md)
- [Physical DFD](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/feature/auth-persistence/docs/physical-dfd.md)

See [LICENSE](LICENSE).
