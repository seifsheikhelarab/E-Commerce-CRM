# Product Requirements Document (PRD)

## E-Commerce CRM

---

## 1. Executive Summary

### 1.1 Product Vision

E-Commerce CRM is a multi-tenant customer relationship management system designed specifically for small e-commerce businesses in Egypt. It serves as an affordable alternative to Shopify, addressing the unique challenges of local businesses including:

- Support for local payment methods (Fawry)
- Excel migration capabilities for businesses transitioning from manual tracking
- Local SMS delivery (Twilio)
- Cost-effective solution for small businesses

### 1.2 Problem Statement

Small e-commerce businesses in Egypt face significant challenges:

1. **High costs**: Shopify and similar platforms are expensive for small businesses
2. **Payment limitations**: International payment gateways don't support local methods
3. **Migration difficulty**: Businesses track data in Excel and cannot easily migrate
4. **Limited analytics**: No access to customer intelligence (RFM, churn analysis)
5. **Marketing gaps**: No built-in campaign management for customer segments

### 1.3 Product Goals

- Provide an affordable CRM solution for small e-commerce businesses
- Enable seamless Excel-to-CRM migration
- Support local payment and communication methods
- Deliver customer intelligence (RFM, churn, segmentation)
- Reduce customer churn through proactive engagement

---

## 2. Target Market

### 2.1 Primary Market

- **Location**: Egypt
- **Business Size**: Small e-commerce businesses (1-50 employees)
- **Revenue Range**: $500 - $50,000 monthly
- **Industry**: E-commerce, retail, direct-to-consumer

### 2.2 Target Users

1. **Business Owners**: Manage their CRM, view reports, configure settings
2. **Marketing Managers**: Create campaigns, manage segments, analyze performance
3. **Sales Representatives**: View customers, manage orders, handle support tickets
4. **Support Agents**: Handle customer inquiries, manage tickets

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

| ID      | Requirement                                         | Priority |
| ------- | --------------------------------------------------- | -------- |
| AUTH-01 | Multi-tenant organization support                   | Critical |
| AUTH-02 | OAuth login (Google, Facebook, Microsoft)           | High     |
| AUTH-03 | Email/password authentication                       | High     |
| AUTH-04 | OTP-based account verification                      | Medium   |
| AUTH-05 | Role-based access control (Admin, Member, Viewer)   | Critical |
| AUTH-06 | Organization switching for users with multiple orgs | High     |

### 3.2 Customer Management

| ID      | Requirement                                           | Priority |
| ------- | ----------------------------------------------------- | -------- |
| CUST-01 | Customer profile with contact info, addresses, tags   | Critical |
| CUST-02 | Customer lifetime value tracking                      | High     |
| CUST-03 | RFM analysis (Recency, Frequency, Monetary)           | High     |
| CUST-04 | Churn risk scoring (Low, Medium, High)                | High     |
| CUST-05 | Lifecycle stage management (Prospect → VIP → Churned) | High     |
| CUST-06 | Customer segmentation by custom rules                 | High     |
| CUST-07 | Customer activity timeline                            | Medium   |

### 3.3 Data Import/Export

| ID     | Requirement                                        | Priority |
| ------ | -------------------------------------------------- | -------- |
| IMP-01 | Excel file upload for customer import              | Critical |
| IMP-02 | CSV file upload for customer import                | Critical |
| IMP-03 | Column mapping interface                           | Critical |
| IMP-04 | Duplicate detection (by email, phone, external ID) | Critical |
| IMP-05 | Import error reporting with line numbers           | Critical |
| IMP-06 | Import history and rollback                        | High     |
| EXP-01 | Excel export of customer list                      | Critical |
| EXP-02 | Excel export of orders                             | High     |
| EXP-03 | Filtered exports by segment/date                   | High     |

### 3.4 Order Management

| ID     | Requirement                 | Priority |
| ------ | --------------------------- | -------- |
| ORD-01 | Order creation and tracking | Critical |
| ORD-02 | Order status management     | High     |
| ORD-03 | Order timeline/history      | High     |
| ORD-04 | Order-product association   | Critical |
| ORD-05 | Payment status tracking     | High     |

### 3.5 Campaign Management

| ID      | Requirement                                           | Priority |
| ------- | ----------------------------------------------------- | -------- |
| CAMP-01 | Email campaign creation and sending                   | High     |
| SMS-01  | SMS campaign creation and sending (Twilio)            | High     |
| CAMP-02 | Segment-based campaign targeting                      | Critical |
| CAMP-03 | Campaign templates                                    | Medium   |
| CAMP-04 | Campaign scheduling                                   | High     |
| CAMP-05 | Campaign analytics (sent, delivered, opened, clicked) | High     |
| CAMP-06 | A/B testing for campaigns                             | Medium   |

### 3.6 Analytics & Reporting

| ID     | Requirement                  | Priority |
| ------ | ---------------------------- | -------- |
| RPT-01 | Revenue dashboard            | High     |
| RPT-02 | Customer acquisition metrics | High     |
| RPT-03 | Segment distribution charts  | High     |
| RPT-04 | RFM analysis reports         | High     |
| RPT-05 | Churn analysis reports       | High     |
| RPT-06 | Campaign performance reports | High     |
| RPT-07 | Custom report builder        | Medium   |

### 3.7 Integrations

| ID     | Requirement                    | Priority |
| ------ | ------------------------------ | -------- |
| INT-01 | Google Analytics 4 integration | High     |
| INT-02 | Meta Pixel integration         | High     |
| INT-03 | Fawry payment gateway          | Critical |
| INT-04 | Twilio SMS gateway             | High     |

### 3.8 Document Generation

| ID     | Requirement                              | Priority |
| ------ | ---------------------------------------- | -------- |
| DOC-01 | PDF invoice generation                   | High     |
| DOC-02 | PDF receipt generation                   | High     |
| DOC-03 | Customizable templates with branding     | Medium   |
| DOC-04 | Multi-language support (English, Arabic) | Medium   |

### 3.9 Support System

| ID     | Requirement                   | Priority |
| ------ | ----------------------------- | -------- |
| SUP-01 | Support ticket creation       | Medium   |
| SUP-02 | Ticket assignment and routing | Medium   |
| SUP-03 | Ticket status tracking        | Medium   |
| SUP-04 | Internal notes on tickets     | Medium   |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- API response time: < 200ms for 95th percentile
- Support 100 concurrent organizations
- Handle import files up to 10,000 rows

### 4.2 Security

- All API endpoints require authentication
- Organization-level data isolation
- Passwords hashed with bcrypt/argon2
- HTTPS enforced in production

### 4.3 Scalability

- Horizontal scaling via stateless API servers
- Database connection pooling
- Caching strategy for frequently accessed data

### 4.4 Reliability

- 99.9% uptime SLA
- Automated daily backups
- Error logging and monitoring

### 4.5 Usability

- Responsive design (mobile-friendly)
- Arabic language support (RTL)
- Intuitive navigation

---

## 5. User Stories

### 5.1 Business Owner

> As a business owner, I want to import my existing customer list from Excel so that I can quickly migrate from my spreadsheet-based tracking.
> As a business owner, I want to view my revenue dashboard so that I can understand my business performance at a glance.
> As a business owner, I want to configure my organization's branding so that invoices and emails match my brand.

### 5.2 Marketing Manager

> As a marketing manager, I want to segment customers by purchase behavior so that I can send targeted campaigns.
> As a marketing manager, I want to create an SMS campaign for my high-value customers so that I can increase retention.
> As a marketing manager, I want to see campaign open rates so that I can measure campaign effectiveness.

### 5.3 Sales Representative

> As a sales representative, I want to view customer order history so that I can provide personalized support.
> As a sales representative, I want to identify at-risk customers so that I can proactively reach out to prevent churn.

### 5.4 System Administrator

> As an admin, I want to invite team members with specific roles so that I can control access to sensitive data.
> As an admin, I want to connect Google Analytics so that I can track website conversions.

---

## 6. Data Models

### 6.1 Organization

- id, name, slug, logo, branding
- settings (timezone, locale, currency)
- createdAt, updatedAt

### 6.2 Customer

- id, organizationId
- name, email, phone
- totalOrders, totalSpent, avgOrderValue
- rfmScore, rfmSegment
- churnRiskScore, lifecycleStage
- tags, externalIds
- createdAt, updatedAt

### 6.3 Order

- id, organizationId, customerId
- orderNumber, status
- items, subtotal, tax, total
- paymentStatus, paymentMethod
- createdAt, updatedAt

### 6.4 Segment

- id, organizationId
- name, description
- rules (JSON: conditions for membership)
- memberCount

### 6.5 Campaign

- id, organizationId
- name, type (email/sms)
- status, scheduledAt
- segmentId
- template, content
- metrics (sent, delivered, opened, clicked)

---

## 7. Success Metrics

| Metric                            | Target                 |
| --------------------------------- | ---------------------- |
| Customer data import success rate | > 99%                  |
| Campaign delivery rate            | > 95%                  |
| API response time (p95)           | < 200ms                |
| System uptime                     | 99.9%                  |
| Customer churn reduction          | 20% (via RFM/segments) |

---

## 8. Out of Scope

The following are NOT in scope for v1.0:

- E-commerce store front-end (the CRM manages customers, not a storefront)
- Inventory management
- Shipping logistics
- Multi-currency support (EGP only in v1)
- Mobile app (web only in v1)
- White-label/reseller functionality

---

## 9. Dependencies

- **Better Auth**: Authentication and organization management
- **Prisma**: Database ORM
- **Express**: API framework
- **Bun**: Runtime
- **Twilio**: SMS delivery
- **Fawry**: Payment processing
- **Google Analytics**: Web analytics
- **Meta Pixel**: Advertising tracking
- **PDFKit**: Document generation
- **xlsx**: Excel file handling
