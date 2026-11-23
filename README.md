# Stock and Purchase Order System — Frontend

Angular application for staff to manage purchase orders, record deliveries, and review stock movements.

## Project status

This repository is being initialized. The first screens will connect to the Spring Boot API once the purchase order endpoints are available.

## Planned workflow

1. Create a draft purchase order and add the items and quantities required.
2. Approve the order and view its delivery status.
3. Record a partial or full delivery against the order.
4. See how much is still outstanding and review the resulting stock movement.

The frontend will use Angular and TypeScript and communicate with the Spring Boot API over HTTP.

## Planned file structure

This is the target tree for the first release. The Angular files will be added as the frontend is scaffolded. Feature folders keep each screen, its API calls, and its tests together.

```text
StockPurchaseOrderFrontend/
├── .editorconfig
├── .gitignore
├── README.md
├── angular.json
├── package.json
├── package-lock.json
├── proxy.conf.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.scss
    └── app/
        ├── app.component.ts
        ├── app.component.html
        ├── app.config.ts
        ├── app.routes.ts
        ├── core/
        │   └── api-problem.ts
        └── features/
            ├── purchase-orders/
            │   ├── purchase-order.models.ts
            │   ├── purchase-orders.api.ts
            │   ├── purchase-orders.api.spec.ts
            │   ├── order-lookup.component.ts
            │   ├── order-lookup.component.html
            │   ├── create-order.component.ts
            │   ├── create-order.component.html
            │   ├── create-order.component.spec.ts
            │   ├── order-detail.component.ts
            │   ├── order-detail.component.html
            │   ├── order-detail.component.spec.ts
            │   ├── receive-delivery.component.ts
            │   ├── receive-delivery.component.html
            │   └── receive-delivery.component.spec.ts
            └── inventory/
                ├── inventory.models.ts
                ├── inventory.api.ts
                ├── inventory.api.spec.ts
                ├── inventory.component.ts
                ├── inventory.component.html
                └── inventory.component.spec.ts
```

## Screens and API integration

| Route | Screen | Spring Boot API |
|---|---|---|
| `/purchase-orders` | Look up an order by ID and navigate to its details. | The order detail screen loads the order by ID. |
| `/purchase-orders/new` | Create a draft order using a reactive form with SKU and quantity inputs. | `POST /api/purchase-orders` |
| `/purchase-orders/:id` | View order status and quantities. Approve or cancel when the order status allows it. | `GET /api/purchase-orders/{id}`, `POST /api/purchase-orders/{id}/approval`, `POST /api/purchase-orders/{id}/cancellation` |
| `/purchase-orders/:id/receive` | Record a partial or full delivery and display the receipt. | `GET /api/purchase-orders/{id}`, `POST /api/purchase-orders/{id}/receipts` |
| `/inventory` | Look up stock by SKU and view movement history. | `GET /api/inventory/{sku}`, `GET /api/stock-movements` |

`app.config.ts` registers standalone routing and Angular's HTTP client. `proxy.conf.json` forwards local `/api` requests to Spring Boot during frontend development. A production API URL or proxy will be configured when the hosting setup is chosen.

The delivery screen reuses the original idempotency key and quantities when retrying the same submission. Its tests cover that retry and the outstanding quantity shown after a successful receipt. API tests cover request URLs, payloads, and the receipt header. Screen tests cover form validation, order actions, and inventory lookups.

## Documentation

- [System design](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/system-design.md)

- [Spring Boot API contract](https://github.com/AriesMaster/StockPurchaseOrderBackend/blob/main/docs/api-contract.md)

[Spring Boot backend](https://github.com/AriesMaster/StockPurchaseOrderBackend)
