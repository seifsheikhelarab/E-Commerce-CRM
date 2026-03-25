# E-Commerce CRM Implementation Plan

## Project Overview

This plan outlines the phased implementation of an E-Commerce CRM system designed as a local competitor to Shopify for small businesses in Egypt. The system supports local payment methods and addresses the needs of small businesses migrating from Excel-based tracking.

### Technology Stack

- **Runtime**: Bun + Express + TypeScript
- **ORM**: Prisma with PostgreSQL
- **Auth**: Better Auth with organization plugin
- **Validation**: Zod
- **Logging**: Pino + pino-pretty

---

## Implemented Features

The following features are already implemented in the codebase:

| Feature                       | Status      | Location                                       |
| :---------------------------- | :---------- | :--------------------------------------------- |
| Multi-tenancy                 | ✅ Complete | `src/api/auth/auth.ts`, `prisma/schema.prisma` |
| Customers (CRUD)              | ✅ Complete | `src/api/customers/*`                          |
| Products (CRUD)               | ✅ Complete | Model exists                                   |
| Orders (CRUD)                 | ✅ Complete | Model exists                                   |
| Segments                      | ✅ Complete | Model with JSON filters                        |
| Tags                          | ✅ Complete | Model exists                                   |
| Support Tickets               | ✅ Complete | Basic model                                    |
| Shopify Integration           | ✅ Complete | `src/api/integrations/*`                       |
| Webhook Handling              | ✅ Complete | `webhook.service.ts`                           |
| Sync Engine                   | ✅ Complete | `sync.service.ts`                              |
| Audit Logs                    | ✅ Complete | Model exists                                   |
| Google OAuth                  | ✅ Complete | `src/api/auth/auth.ts`                         |
| Email/Password Auth           | ✅ Complete | With email verification                        |
| RBAC (root, admin, member)    | ✅ Complete | `src/config/roles.config.ts`                   |
| Dynamic Access Control        | ✅ Complete | `OrganizationRole` model                       |
| Customer fields for RFM/Churn | ✅ Complete | Schema has fields (logic pending)              |

---

## Pending Schema Changes

| Model   | Change     | Description            |
| :------ | :--------- | :--------------------- |
| Payment | ⏳ Add New | Fawry payment tracking |

---

## Phase 1: Excel Import/Export (CRITICAL)

Priority feature for business migration from Excel.

### 1.1 Import System

- Create `src/utils/parser.util.ts` for Excel/CSV parsing (xlsx, csv-parse)
- Implement `src/api/import/import.service.ts`:
    - File upload with size limits
    - Column mapping interface
    - Data validation per entity
    - Batch processing with progress
    - Duplicate detection (email, phone, externalId)
    - Error reporting with line numbers
    - Import history logging
- Entities: Customers, Products, Orders

### 1.2 Export System

- Implement `src/api/export/export.service.ts`:
    - Export customers, orders, products
    - Custom column selection
    - Filtered exports by segment/date

---

## Phase 2: Customer Intelligence Services

The schema has the fields - need to implement the calculation logic.

### 2.1 RFM Analysis Service

- Create `src/api/customers/rfm.service.ts`:
    - Recency: days since last order
    - Frequency: order count in period
    - Monetary: total spent in period
    - RFM segmentation (Champions, Loyal, At Risk, etc.)
    - Update customer `rfmScore`, `rfmSegment`

### 2.2 Churn Risk Service

- Create `src/api/customers/churn.service.ts`:
    - Calculate avg days between orders
    - Compare last order to expected next order
    - Score: Low/Medium/High
    - Update `churnRiskScore`

### 2.3 Lifecycle Stage Service

- Create `src/api/customers/lifecycle.service.ts`:
    - Automatic stage transitions:
        - PROSPECT → ONE_TIME → RETURNING → LOYAL → VIP
        - AT_RISK → CHURNED → WINBACK
    - VIP: top 5% by LTV

---

## Phase 3: Authentication Enhancement

### 3.1 Additional OAuth Providers

Update `src/api/auth/auth.ts` with:

```typescript
socialProviders: {
    google: { ... },
    facebook: {
        clientId: env.facebookClientId!,
        clientSecret: env.facebookClientSecret!
    },
    microsoft: {
        clientId: env.microsoftClientId!,
        clientSecret: env.microsoftClientSecret!
    }
}
```

### 3.2 OTP Verification

- Add OTP model to schema
- Create `src/api/auth/otp.service.ts`:
    - Generate/validate OTP
    - Rate limiting
    - Expiry (15 min)
    - Endpoint for resend

---

## Phase 4: Marketing & Campaigns

### 4.1 Expand Campaign Model

- Add to schema:
    - `type`: email | sms
    - `status`: draft | scheduled | active | paused | completed
    - `segmentId`: targeting
    - `template`, `content`
    - `scheduledAt`
    - `metrics`: sent, delivered, opened, clicked, converted

### 4.2 Campaign Service

- Create `src/api/campaigns/campaign.service.ts`:
    - CRUD with templates
    - Schedule management
    - A/B testing support

### 4.3 Email Campaigns

- Create `src/api/campaigns/email.service.ts`:
    - Template engine with variables
    - Mass sending with throttling
    - Unsubscribe handling
    - Bounce tracking

### 4.4 SMS Campaigns

- Create `src/api/campaigns/sms.service.ts`:
    - Twilio integration (see Phase 5)

---

## Phase 5: External Services

### 5.1 SMS Gateway (Twilio)

Not a traditional "integration" - add to campaigns or create `src/utils/twilio.util.ts`:

- Send SMS utility
- Delivery status tracking
- Phone verification

### 5.2 Payment Gateway (Fawry)

- Add Payment model to schema:
    ```prisma
    model Payment {
        id             String   @id @default(nanoid())
        orderId        String
        amount         Decimal
        currency       String   @default("EGP")
        status         String   // pending, completed, failed, refunded
        method         String   // fawry, card, wallet
        transactionId  String?  // Provider's transaction ID
        webhookData    Json?
        createdAt      DateTime @default(now())
        updatedAt      DateTime @updatedAt
    }
    ```
- Create `src/api/payments/payment.service.ts`:
    - Fawry payment initialization
    - Refund handling
    - Webhook callback handling

### 5.3 Tracking & Analytics

Not database integrations - these are client-side scripts:

- Generate tracking snippets (GA4, Meta Pixel)
- Store Measurement IDs in Organization settings
- Server-side conversion events via Measurement Protocol

Add to Organization `settings` JSON:

```json
{
    "googleAnalytics": { "measurementId": "G-XXXXX" },
    "metaPixel": { "pixelId": "123456789" }
}
```

### 5.4 Additional E-commerce Platforms (Future)

The Integration model supports multiple providers. Future additions:

- WooCommerce
- Magento
- Custom REST API

---

## Phase 6: Document Generation

### 6.1 PDF Service

- Create `src/utils/pdf.service.ts` using pdfkit:
    - Invoice PDF
    - Receipt PDF
    - Company branding
    - QR code support
    - Multi-language (EN/AR)

---

## Phase 7: Support & Tasks

### 7.1 Enhanced Tickets

- Expand schema:
    - `category`, `subcategory`
    - `internalNotes`
    - `timeTracking`
    - `slaDeadline`

- Create `src/api/tickets/ticket.service.ts`:
    - Auto-assignment rules
    - Escalation workflows
    - Templates

### 7.2 Task System

- Add Task model to schema:
    - `title`, `description`, `dueDate`
    - `assignedUserId`, `priority`
    - `status`: todo | in_progress | completed
    - `relatedEntity`: customerId, orderId, ticketId

- Create `src/api/tasks/task.service.ts`:
    - Auto-task creation rules
    - Due date reminders

---

## Phase 8: Reporting & Dashboard

### 8.1 Dashboard Endpoints

- Create `src/api/reports/dashboard.service.ts`:
    - Revenue metrics
    - Customer acquisition
    - Order trends
    - Segment distribution

### 8.2 Custom Reports

- Create `src/api/reports/report.service.ts`:
    - Filter by date, segment, product
    - Export to Excel/PDF

---

## Cron Jobs

### Nightly (2 AM UTC)

1. Lifecycle recalculation
2. Churn risk scoring
3. RFM score updates
4. VIP recalculation (top 5%)
5. Segment membership refresh

### Weekly (Sunday 3 AM UTC)

- Campaign summary
- Ticket SLA report
- Integration health check

### Monthly (1st, 4 AM UTC)

- Cohort retention
- Revenue attribution
- LTV recalculation

---

## Implementation Order

| Phase | Focus                                         | Priority | Status                      |
| ----- | --------------------------------------------- | -------- | --------------------------- |
| **1** | **Excel Import/Export**                       | CRITICAL | Pending                     |
| **2** | Customer Intelligence (RFM, Churn, Lifecycle) | HIGH     | Fields ready, logic pending |
| **3** | OAuth (FB, Microsoft), OTP                    | HIGH     | Partial (Google done)       |
| **4** | Campaigns (Email/SMS)                         | HIGH     | Model ready                 |
| **5** | Integrations (Twilio, Fawry, GA, Meta)        | HIGH     | Pending                     |
| **6** | PDF Generation                                | MEDIUM   | Pending                     |
| **7** | Tickets & Tasks                               | MEDIUM   | Basic done                  |
| **8** | Reporting                                     | LOW      | Pending                     |

---

## Technical Notes

- Follow feature-based architecture from `instructions/structure.md`
- All imports use `.js` extension (ESM)
- Use `asyncHandler` for controllers
- Validate with Zod schemas
- Filter by `organizationId` for multi-tenancy
- Use `ResponseHandler` for API responses
- Add OpenAPI specs for new endpoints
