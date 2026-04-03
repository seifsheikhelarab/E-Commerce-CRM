# Phase 1: Excel Import/Export

## Goal

Deliver a production-ready import/export system that helps small businesses migrate from Excel into the CRM and continue moving data in and out safely. This phase must support multi-tenant organizations, follow the current feature-based Express architecture, and avoid partial or silent data corruption.

This phase covers:

- Customer import
- Product import
- Order import
- Customer export
- Product export
- Order export
- Import/export job tracking
- Validation, duplicate detection, and downloadable error reporting

This phase does **not** include background workers, campaign triggers, intelligence recalculation, or third-party cloud storage unless they become mandatory to complete the core import/export flow.

---

## Current State

Based on the current repository:

- `customers` already has a full API module with router, controller, schemas, service, and tests.
- `products` and `orders` exist in `prisma/schema.prisma` but do not yet have API modules.
- There is no import/export module yet.
- There is no parser utility for CSV/XLSX files yet.
- There are no job/history models for imports or exports yet.
- Permissions currently cover `customers`, `products`, `orders`, `integrations`, `reports`, and others, but not `imports` or `exports`.

This means Phase 1 is not only a file-processing feature. It also requires enough product/order service infrastructure to let imports and exports operate consistently.

---

## Success Criteria

Phase 1 is complete when the system can:

- Accept CSV and Excel uploads for customers, products, and orders
- Validate each row against entity-specific rules before persisting
- Support column mapping when file headers do not match internal field names
- Detect duplicates using agreed entity-specific strategies
- Process imports in batches with progress tracking
- Produce line-level error details for failed rows
- Keep an import history per organization
- Roll back atomic import units when a failure would leave invalid partial state
- Export customers, products, and orders to CSV/XLSX
- Support filtered exports and selectable columns
- Enforce permissions and organization scoping on every operation
- Be covered by API and service tests
- Be documented in `src/openapi.json`

---

## Architecture Decisions

### 1. Feature Modules

Create two new feature modules:

- `src/api/imports/`
- `src/api/exports/`

Each module should follow the existing pattern:

- `imports.router.ts`
- `imports.controller.ts`
- `imports.service.ts`
- `imports.schemas.ts`
- `imports.test.ts`

and:

- `exports.router.ts`
- `exports.controller.ts`
- `exports.service.ts`
- `exports.schemas.ts`
- `exports.test.ts`

### 2. Shared Utilities

Create reusable helpers in shared folders:

- `src/utils/parser.util.ts` for CSV/XLSX reading and normalization
- `src/utils/file.util.ts` if file naming, MIME validation, or temp-path helpers are needed
- `src/types/import.types.ts` for mapping rows, job summaries, duplicate results, and parser output
- `src/constants/import.constants.ts` for file limits, supported mime types, supported entities, and job status constants

### 3. Existing Feature Reuse

Do not duplicate entity business rules inside the import/export modules.

Use or create entity-facing service helpers in:

- `src/api/customers/customer.service.ts`
- `src/api/products/product.service.ts`
- `src/api/orders/order.service.ts`

The import service should orchestrate parsing, mapping, validation, duplicate resolution, and batching, but entity-specific create/update logic should live with the entity modules.

### 4. Upload Strategy

Use multipart file uploads through Express middleware. The codebase currently has no upload dependency, so this phase should add one.

Recommended dependencies:

- `multer` for multipart uploads
- `xlsx` for Excel parsing and generation
- `csv-parse` for CSV reading
- `csv-stringify` or XLSX writer support for export generation

### 5. Processing Mode

Implement synchronous request-start plus persisted job tracking first, with batch processing handled inside the app process. Do not introduce BullMQ in Phase 1 unless import sizes prove too large for a request/response model.

Recommended approach:

- `POST /api/imports` creates an import job and starts processing
- processing state is persisted in the database
- client polls `GET /api/imports/:jobId`
- result includes summary counts and error file metadata

This keeps the first version simple while still exposing progress and history.

---

## Data Model Changes

The high-level plan mentions import history logging, progress, error reporting, and rollback. Those requirements need persisted models. Add the following Prisma models.

### 1. `ImportJob`

Purpose:

- track upload metadata
- store mapping configuration
- track progress and final result
- anchor row-level errors

Suggested fields:

- `id`
- `organizationId`
- `createdByUserId`
- `entityType` (`customer`, `product`, `order`)
- `fileName`
- `fileType` (`csv`, `xlsx`)
- `status` (`pending`, `processing`, `completed`, `failed`, `partially_failed`, `cancelled`)
- `mapping` as `Json`
- `summary` as `Json`
- `totalRows`
- `processedRows`
- `successfulRows`
- `failedRows`
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

### 2. `ImportJobError`

Purpose:

- store row-level validation and persistence errors
- support UI review and downloadable error reports

Suggested fields:

- `id`
- `importJobId`
- `rowNumber`
- `columnName`
- `errorCode`
- `message`
- `rawRow` as `Json`
- `createdAt`

### 3. `ExportJob`

Purpose:

- track export requests
- store entity, selected columns, filters, and status

Suggested fields:

- `id`
- `organizationId`
- `createdByUserId`
- `entityType`
- `format` (`csv`, `xlsx`)
- `status` (`pending`, `processing`, `completed`, `failed`)
- `filters` as `Json`
- `selectedColumns` as `String[]`
- `totalRows`
- `fileName`
- `createdAt`
- `completedAt`

### 4. Relationships and Indexes

Add indexes for:

- `organizationId`
- `status`
- `entityType`
- `createdAt`

Add relations from `Organization` and `User` to jobs if needed for history queries.

### 5. Optional Constraint Enhancements

To make duplicate detection safer and future imports more reliable, review whether the following should be added in this phase:

- unique scoped constraints for `Customer.externalId` per organization
- unique scoped constraints for `Product.externalId` per organization
- unique scoped constraints for `Order.externalId` per organization
- unique scoped constraints for `Product.sku` per organization if SKU is intended to be unique

If these constraints are added, the import service must handle conflicts gracefully and convert Prisma errors into row-level import errors.

---

## API Design

### Import Endpoints

#### `POST /api/imports`

Creates a new import job and uploads a file.

Request:

- multipart/form-data
- fields:
  - `entityType`
  - `file`
  - `hasHeader`
  - optional `mapping` as JSON string
  - optional `duplicateStrategy`
  - optional `mode` (`create_only`, `upsert`)

Behavior:

- validate file type and size
- parse headers or first row sample
- if mapping is complete, start processing immediately
- otherwise return mapping preview payload

#### `POST /api/imports/preview`

Optional but strongly recommended.

Purpose:

- upload a file
- inspect headers and sample rows
- return supported internal fields and suggested mapping

This separates "preview/mapping" from "execute import" and produces a cleaner client flow.

#### `GET /api/imports`

List import jobs for the active organization with filters:

- `entityType`
- `status`
- `page`
- `limit`

#### `GET /api/imports/:id`

Return:

- job metadata
- summary counters
- status
- error sample or paginated errors

#### `GET /api/imports/:id/errors`

Returns row-level import errors for UI review or CSV download.

#### `POST /api/imports/:id/retry`

Optional stretch goal for Phase 1.

Only include if the initial implementation leaves enough time. Otherwise defer to a later phase.

### Export Endpoints

#### `POST /api/exports`

Creates an export job for:

- `customers`
- `products`
- `orders`

Request body:

- `entityType`
- `format`
- `selectedColumns`
- `filters`

#### `GET /api/exports`

List export jobs for the current organization.

#### `GET /api/exports/:id`

Return job status and metadata.

#### `GET /api/exports/:id/download`

Streams the generated file if the job completed successfully.

### Router Registration

Update `src/api/index.ts`:

- `router.use('/imports', importsRouter);`
- `router.use('/exports', exportsRouter);`

---

## Permissions and Access Control

Add new resources to `src/config/roles.config.ts`:

- `imports: ('read' | 'write')[]`
- `exports: ('read' | 'write')[]`

Suggested defaults:

- `root`: full access
- `admin`: full access
- `member`: read only or no access depending on business policy

Recommended initial policy:

- `member.imports = []`
- `member.exports = ['read']`

Reason:

- imports can mutate large datasets and should be restricted
- exports may be allowed for operational reporting, but this can be tightened if needed

Protect routes with `requirePermission(...)` in the new routers.

---

## Validation and Mapping Rules

### Shared Validation Flow

Each import should go through these stages:

1. File validation
2. Parse raw rows
3. Normalize headers
4. Resolve column mapping
5. Transform row into entity input shape
6. Validate transformed row with Zod
7. Run duplicate detection
8. Persist in batches
9. Capture row-level errors
10. Finalize job summary

### Mapping Rules

Support:

- exact header matches
- case-insensitive matches
- common aliases
- manual overrides

Examples:

- `customer name` -> `name`
- `mobile` -> `phone`
- `mail` -> `email`
- `sku code` -> `sku`
- `total` -> `totalAmount`

Store the resolved mapping in `ImportJob.mapping`.

### Entity-Specific Validation

#### Customers

Required minimum:

- `name`

Optional but validated:

- `email` must be valid email if present
- `phone` should be normalized to a consistent format
- `source` must match enum values
- `acceptsMarketing` should support boolean-like strings

Duplicate detection priority:

1. `externalId`
2. `email`
3. `phone`

#### Products

Required minimum:

- `name`
- `price`

Optional but validated:

- `sku`
- `barcode`
- `inventory`
- `status`
- `weight`
- `weightUnit`

Duplicate detection priority:

1. `externalId`
2. `sku`
3. `barcode` if business rules allow

#### Orders

Required minimum:

- customer identifier
- at least one order line or enough data to construct a basic order

Important implementation choice:

The current schema requires `customerId` and uses `OrderItem[]`. Imported orders therefore need a stable way to resolve:

- the customer
- the products
- the order totals

Recommended accepted identifiers:

- customer by `externalId`, `email`, or `phone`
- product by `externalId`, `sku`, or `id`

Order import should fail row-level validation if referenced customers/products cannot be resolved.

### Duplicate Handling Modes

Support at least two modes:

- `create_only`: reject duplicates as row errors
- `upsert`: update existing records when duplicate keys match

For orders, be conservative:

- default to `create_only`
- only upsert by `externalId` when explicitly enabled

---

## Batch Processing and Transactions

### Batch Size

Process imports in configurable batches, for example:

- customers: 100 rows
- products: 100 rows
- orders: 25 rows

Orders should use smaller batches because each row may create related `OrderItem` records and update aggregates later.

### Transaction Strategy

Use Prisma transactions at the batch level, not the entire file level.

Reason:

- full-file rollback for very large imports is expensive
- batch-level rollback preserves consistency while still allowing progress tracking

Behavior:

- if a row fails validation before DB write, mark it as failed and continue
- if a DB failure occurs inside a batch, roll back that batch and mark every affected row with a clear batch failure reason

This satisfies the "rollback on partial failure" requirement without making imports too fragile for large files.

### Progress Tracking

Update `ImportJob` after each batch:

- `processedRows`
- `successfulRows`
- `failedRows`
- `status`

---

## Export Design

### Supported Formats

Implement:

- CSV
- XLSX

### Column Selection

Expose allowed export columns per entity in constants or a dedicated config object.

Examples:

- customer: `name`, `email`, `phone`, `city`, `source`, `lifecycleStage`, `totalOrders`, `totalSpent`
- product: `name`, `sku`, `price`, `inventory`, `status`, `category`
- order: `externalId`, `customerName`, `paymentStatus`, `shippingStatus`, `totalAmount`, `currency`, `createdAt`

### Filters

Support structured filters in request body, validated by Zod.

Examples:

- date range
- lifecycle stage
- customer source
- product status
- order payment status
- order shipping status

### Export Query Rules

All export queries must:

- filter by `organizationId`
- use explicit selected fields
- paginate internally if memory pressure becomes a concern

### File Delivery

For the first implementation:

- generate file on demand
- store metadata in `ExportJob`
- return a download endpoint that streams the generated file

If persistent file storage is not yet introduced, temporary local files are acceptable as long as:

- file lifecycle is controlled
- files are scoped by job id
- cleanup is documented

---

## Required Supporting Work

Phase 1 depends on a few adjacent tasks that should be included in scope.

### 1. Product API Module

Create:

- `src/api/products/products.router.ts`
- `src/api/products/product.controller.ts`
- `src/api/products/product.service.ts`
- `src/api/products/product.schemas.ts`
- `src/api/products/product.test.ts`

At minimum, implement:

- list products
- create product
- get product

This is needed so import/export logic does not become the only place where product rules exist.

### 2. Order API Module

Create:

- `src/api/orders/orders.router.ts`
- `src/api/orders/order.controller.ts`
- `src/api/orders/order.service.ts`
- `src/api/orders/order.schemas.ts`
- `src/api/orders/order.test.ts`

At minimum, implement:

- list orders
- create order
- get order

This is needed for reusable order validation and export querying.

### 3. Shared Entity Helpers

Where needed, extract helpers such as:

- customer duplicate lookup
- product identifier lookup
- order payload normalization

These helpers should live with their feature services, not inside import/export modules.

---

## Testing Plan

### Unit Tests

Add service-level tests for:

- CSV parsing
- XLSX parsing
- header normalization
- mapping resolution
- duplicate detection
- row validation
- batch summary generation

### API Tests

Add integration tests using `bun:test` and `supertest` for:

- import preview
- import creation and processing
- import history listing
- import error retrieval
- export creation
- export download
- permission-denied scenarios
- organization isolation

### Critical Edge Cases

Test:

- empty file
- unsupported file type
- file exceeds size limit
- missing required columns
- invalid enum values
- duplicate emails/phones/SKUs
- order rows referencing missing customers or products
- mixed valid and invalid rows in one file
- import job visibility across organizations

---

## OpenAPI and Documentation Work

Update `src/openapi.json` with:

- all new import endpoints
- all new export endpoints
- request schemas
- job status response schemas
- error response schemas

Document:

- accepted file formats
- max file size
- supported entity fields
- duplicate strategies
- preview versus execute flow

---

## Implementation Sequence

### Step 1. Foundation

- add parser and upload dependencies
- add constants, shared types, and parser utility
- add Prisma models for import/export jobs
- run Prisma generate and migration work

### Step 2. Product and Order Baseline APIs

- implement minimum product module
- implement minimum order module
- register routers in `src/api/index.ts`
- add tests for baseline behavior

### Step 3. Import Preview Flow

- implement file upload middleware
- implement parser utility for CSV/XLSX
- build preview endpoint
- return headers, sample rows, supported fields, and suggested mapping

### Step 4. Import Execution Flow

- implement import job creation
- implement entity-specific row transformers
- implement duplicate detection and batch persistence
- implement job status and error endpoints

### Step 5. Export Flow

- implement export job creation
- implement CSV/XLSX generation
- implement download endpoint
- support selected columns and filters

### Step 6. Permissions, Docs, and Hardening

- update roles config
- update OpenAPI
- add logging around job lifecycle
- add cleanup rules for temp files if used
- finalize tests

---

## Risks and Mitigations

### 1. Orders Are More Complex Than Customers or Products

Risk:

- orders depend on customer and product resolution
- the current schema requires nested item handling

Mitigation:

- implement orders last within Phase 1
- define a strict import template for orders
- reject ambiguous row shapes instead of guessing

### 2. Very Large Files May Timeout

Risk:

- in-process imports may exceed acceptable request time

Mitigation:

- persist jobs early
- process in batches
- keep the polling API
- if necessary, move execution to a background worker in a later iteration without changing the external contract

### 3. Duplicate Rules May Be Inconsistent Across Entities

Risk:

- missing DB constraints can make import outcomes unpredictable

Mitigation:

- define duplicate key precedence explicitly
- add scoped unique constraints where justified
- convert persistence conflicts into row-level errors

### 4. Temporary File Handling Can Leak Storage

Risk:

- uploads and generated exports may accumulate locally

Mitigation:

- centralize temp file paths
- delete files after completion or expiry
- document retention in constants/config

---

## Definition of Done

Phase 1 is done when all of the following are true:

- Prisma schema includes import/export job tracking models
- `imports` and `exports` feature modules exist and are wired into `src/api/index.ts`
- product and order baseline modules exist for shared business logic reuse
- CSV and XLSX import work for customers, products, and orders
- exports work for customers, products, and orders
- duplicate detection and error reporting are implemented
- batch progress and job history are persisted
- permissions are enforced
- tests cover happy paths and critical failures
- `src/openapi.json` is updated

---

## Recommended Deliverables

At the end of this phase, the repository should contain at least:

- `src/api/imports/imports.router.ts`
- `src/api/imports/imports.controller.ts`
- `src/api/imports/imports.service.ts`
- `src/api/imports/imports.schemas.ts`
- `src/api/imports/imports.test.ts`
- `src/api/exports/exports.router.ts`
- `src/api/exports/exports.controller.ts`
- `src/api/exports/exports.service.ts`
- `src/api/exports/exports.schemas.ts`
- `src/api/exports/exports.test.ts`
- `src/api/products/*`
- `src/api/orders/*`
- `src/utils/parser.util.ts`
- `src/types/import.types.ts`
- `src/constants/import.constants.ts`
- Prisma migration(s) for import/export job models and any required unique indexes

This gives Phase 1 a clean, extensible base for later additions such as scheduled exports, retry flows, analytics recalculation triggers, and background job processing.
