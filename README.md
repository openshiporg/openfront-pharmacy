# Openfront Pharmacy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenshiporg%2Fopenfront-pharmacy&env=DATABASE_URL%2CSESSION_SECRET)

Openfront Pharmacy is a self-hostable pharmacy operations and customer-commerce application. It separates eligible public shopping from prescription intake, pharmacist review, and dispensing. Pharmacy teams manage patients, prescriptions, fills, inventory lots, recalls, cold-chain records, orders, payments, and fulfillment.

## Demo

Explore the application locally using the setup instructions below.

| | |
|---|---|
| **Public application** | `/` on your development URL |
| **Dashboard** | `/dashboard` on your development URL |

[Learn more →](https://openship.org/products/openfront-pharmacy)

[Documentation →](https://docs.openship.org/docs/openfront/pharmacy/)

## The Openfront Ecosystem

Openfront is part of an ecosystem of open-source commerce tools:

- **[Openfront E-commerce](https://github.com/openshiporg/openfront)**: Headless e-commerce for retail.
- **[Openfront Restaurant](https://github.com/openshiporg/openfront-restaurant)**: Restaurant ordering, point of sale, and kitchen operations.
- **[Openship](https://github.com/openshiporg/openship)**: Order routing for multi-channel fulfillment.
- **Openfront Pharmacy**: (This repository) a self-hostable pharmacy operations and customer-commerce application.

## Core Features

### Admin Dashboard
Manage patients, recalls, store settings, integrations, pos, audit, inventory, orders, prescriptions, prescribers, credentials through dedicated dashboard workspaces and permission-controlled data screens.

### Storefront
Public routes cover `/products`, `/cart`, `/checkout`, prescription intake, refills, transfers, pickup, delivery, and order status. Only products eligible for public carts belong in customer checkout; prescription work has its own review workflow.

### Prescription Review & Dispensing
Record prescription intake, patient and prescriber information, clinical safety reviews, human approvals, fill reservations, dispensing labels, refill requests, and transfers.

### Inventory Safety
Receive and adjust location lots, record movements and temperature excursions, quarantine recall-affected inventory, and record human disposition.

### Orders & Fulfillment
Process eligible product orders and controlled fulfillment transitions. Payment sessions, Stripe integration, cash operations, refunds, and recovery records are distinct from pharmacist authorization.

## Architecture

### Technology Stack
- **Frontend**: Next.js 16 with App Router and React 19.
- **Backend**: KeystoneJS 6 with a GraphQL API.
- **Database**: PostgreSQL with Prisma ORM.
- **Styling**: Tailwind CSS 4 and shared shadcn/ui components.
- **Authentication**: Password-based user accounts and session-based access with role capabilities.

### Application Structure
```text
openfront-pharmacy/
├── app/                    # Public pages, dashboard routes, and HTTP endpoints
├── features/
│   ├── keystone/           # Backend models, access rules, and GraphQL workflows
│   ├── platform/           # Operator workspaces and onboarding
│   ├── storefront/         # Public application components and screens
│   └── dashboard/          # Authentication and shared dashboard shell
└── components/             # Shared UI components
```

### Data Models
The [model registry](features/keystone/models/index.ts) and [Prisma schema](schema.prisma) cover:

- Organizations, locations, memberships, patients, prescribers, and consent.
- Prescriptions, items, reviews, clinical safety evidence, approvals, fills, and labels.
- Drug references, inventory lots, movements, recalls, and temperature excursions.
- Carts, orders, fulfillment, payment sessions, webhook events, machine credentials, and outbox records.

## Getting Started

### Prerequisites
- Node.js 22, compatible with the [package requirements](package.json) and Next.js 16.
- A PostgreSQL database you can migrate.
- npm.

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/openshiporg/openfront-pharmacy.git
   cd openfront-pharmacy
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Review the [example configuration](.env.example) and replace its placeholders. Keep only the local settings you need; do not copy production-mode or infrastructure examples unchanged.

   ```env
   DATABASE_URL=postgresql://user:password@host/database
   SESSION_SECRET=replace-with-a-new-private-random-secret
   ```

   Generate the session secret with `openssl rand -hex 32`; use the generated value, not the placeholder. Never commit `.env`.

   Review [runtime configuration](features/keystone/index.ts) for additional application settings before building or deploying. Configure enabled integrations separately; the two values above are not a complete production configuration.

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The development script prepares the backend schema, applies checked-in migrations, and starts Next.js.

4. **Access the application:**
   Open the URL `npm run dev` prints, then use these paths:

   - **Public application**: `/`
   - **Admin dashboard**: `/dashboard`
   - **Customer account**: `/account`
   - **GraphQL API**: `/api/graphql`

5. **Create your first admin user:**
   Visit `/dashboard/init` on an empty database to create the initial administrator, then sign in to the dashboard.

6. **Run application onboarding:**
   Run pharmacy onboarding and establish organization and location memberships. Production initial provisioning is explicitly gated; follow the [onboarding implementation](features/keystone/mutations/runPharmacyOnboarding.ts) for its one-time setup requirements. Review pharmacist and prescriber credentials, patient access, catalog eligibility, fill policies, and inventory before using prescription workflows.

## Development Commands

- `npm run dev` - Prepare the backend schema, apply migrations, and start Next.js development.
- `npm run build` - Build the backend and Next.js for production; does not apply migrations.
- `npm start` - Start the production Next.js server.
- `npm run migrate:gen` - Prepare the schema and generate/apply development migrations.
- `npm run migrate` - Apply checked-in Prisma migrations.
- `npm run lint` - Run the repository's ESLint script.
- `npm run typecheck` - Run the configured TypeScript check.
- `npm run test` - Run the repository's configured test suite.
- `npm run worker:outbox` - Run the configured outbox delivery entry point.

Use a disposable development database for migration generation. Review the script before running it against any existing data.

### Pharmacy Integrations
The [workflow registry](features/keystone/mutations/index.ts) includes prescription, inventory, recall, fulfillment, payment, and external-integration commands. [Stripe](features/integrations/payment/index.ts) is the registered payment adapter. Configure external pharmacy providers explicitly; provider records alone do not establish live e-prescribing or insurance connectivity.

## Documentation

See the [Openfront Pharmacy documentation](https://docs.openship.org/docs/openfront/pharmacy/) for the application guide. The [backend models](features/keystone/models), [registered business workflows](features/keystone/mutations/index.ts), [access rules](features/keystone/access.ts), and [application routes](app) document the implementation in this repository.

## Security & Permissions

### Role-Based Access Control
- `canAccessDashboard` - Access dashboard.
- `canManageInventory` - Manage inventory.
- `canReviewPrescriptions` - Review prescriptions.
- `canDispenseMedications` - Dispense medications.
- `canViewPatientPrivateData` - View patient private data.
- `canManageRecalls` - Manage recalls.
- `canApproveConsequentialActions` - Approve consequential actions.

### Security Features
- Session-based authentication for signed-in users.
- Backend list access and workflow authorization, rather than dashboard visibility alone.
- Capabilities are combined with organization and location membership filters. Private patient data, prescription review, dispensing, and consequential human approvals have separate permissions; machine access does not replace pharmacist authority.

Review the [access implementation](features/keystone/access.ts) and individual workflow checks before extending permissions.

## Platform Components

### Admin Platform (`/dashboard`)
- **Patients**: `/dashboard/platform/patients`.
- **Recalls**: `/dashboard/platform/recalls`.
- **Store Settings**: `/dashboard/platform/store-settings`.
- **Integrations**: `/dashboard/platform/integrations`.
- **Pos**: `/dashboard/platform/pos`.
- **Audit**: `/dashboard/platform/audit`.
- **Inventory**: `/dashboard/platform/inventory`.
- **Orders**: `/dashboard/platform/orders`.
- **Prescriptions**: `/dashboard/platform/prescriptions`.
- **Prescribers**: `/dashboard/platform/prescribers`.
- **Credentials**: `/dashboard/platform/credentials`.

### Storefront Experience
Public routes cover `/products`, `/cart`, `/checkout`, prescription intake, refills, transfers, pickup, delivery, and order status. Only products eligible for public carts belong in customer checkout; prescription work has its own review workflow.

Record prescription intake, patient and prescriber information, clinical safety reviews, human approvals, fill reservations, dispensing labels, refill requests, and transfers.

## Deployment

### Production Deployment
The Vercel button imports this application's own repository. Provision PostgreSQL and configure the application's complete runtime requirements, storage, mail, and enabled providers before building. Importing the source does not configure these services or grant regulatory approval.

Build the application and apply checked-in migrations as a release step before starting the server. Back up existing data before migration.

```bash
npm run build
npm run migrate
npm start
```

The included [Railway configuration](railway.toml) defines this app's build and startup lifecycle. Provision services and secrets separately.

### Scaling Considerations
Run `npm run worker:outbox` in a supervised process with its worker credentials and application endpoint configured. Keep location inventory, fill reservations, and approval state in the shared database.

## Contributing

Use the development commands above when preparing changes. Keep model changes and their migrations together, and describe workflow and permission changes in pull requests.

## License

No top-level license file or package license declaration is included in this repository.

## Support

- **Documentation**: [Openfront Pharmacy guide](https://docs.openship.org/docs/openfront/pharmacy/).
- **Issues**: [Report bugs and feature requests](https://github.com/openshiporg/openfront-pharmacy/issues).
- **Product**: [Learn more about Openfront Pharmacy](https://openship.org/products/openfront-pharmacy).

---

Built with [Next.js](https://nextjs.org) and [KeystoneJS](https://keystonejs.com).
