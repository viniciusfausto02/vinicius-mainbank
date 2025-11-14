# ViniBank

A production-ready, enterprise-grade digital banking simulation built with **Next.js 16**, **React 19**, **TypeScript**, **Prisma 6**, and **PostgreSQL**.

**Purpose:** Demonstrate senior full-stack engineering expertise through professional architecture, security-first design, and comprehensive documentation.

---

## 🏗️ Architecture Highlights

This project showcases enterprise-level patterns:

- **Type-Safe**: Full TypeScript strict mode throughout
- **Security-First**: Field-level AES-256-GCM encryption, audit logging, rate limiting
- **Structured Logging**: Standardized request/response patterns with traceability
- **Error Handling**: Custom error hierarchy with semantic HTTP status codes
- **Environment Validation**: Fail-fast configuration checks at startup
- **Scalable Design**: Stateless API routes, database connection pooling, pagination
- **Well Documented**: 5 comprehensive documentation files + inline comments

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **UI** | React 19 + Tailwind CSS 4 |
| **Database** | PostgreSQL + Prisma 6.19 |
| **Auth** | NextAuth 4.24 + Google OAuth |
| **Encryption** | AES-256-GCM + PBKDF2 |
| **Hashing** | bcryptjs + SHA-256 |
| **Icons** | Lucide React |

## ✨ Features

### Authentication & Security
- Credentials signup/signin with bcryptjs hashing
- Google OAuth integration
- NextAuth session management with automatic refresh
- Field-level encryption (account numbers, SSN, routing numbers)
- Audit logging for all sensitive operations
- Rate limiting (60 req/min default)
- CORS and security headers

### Banking Operations
- Multi-account user profiles
- Atomic money transfers with transaction history
- Real-time balance updates
- Decryption with audit trail
- Admin dashboard with comprehensive logs

### User Experience
- i18n (English/Portuguese) via React Context
- Smooth page transitions with loading overlay
- Responsive design (mobile, tablet, desktop)
- Professional typography (Inter + Space Grotesk)
- Dark theme optimized for fintech

### Developer Experience
- Structured logging system
- Standardized API responses
- Centralized error handling
- Environment validation
- Type definitions for all shared data
- Comprehensive API documentation

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design, patterns, data flows |
| **[API.md](./API.md)** | Endpoint documentation with examples |
| **[SECURITY.md](./SECURITY.md)** | Encryption, auth, compliance details |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Deploy to Vercel, Docker, AWS |
| **[Contributing Guide](./CONTRIBUTING.md)** | Development workflow & standards |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Setup Steps

**1. Clone & Install**
```powershell
git clone <repo>
cd vinicius-mainbank
npm install
```

**2. Environment Setup**
```powershell
Copy-Item .env.example .env.local
```

Generate encryption keys:
```powershell
# Run these and add to .env.local
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env.local` with:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (from Google Cloud)
- `NEXTAUTH_SECRET` (random long string)
- `DATABASE_URL` (from next step)

**3. Start Database**
```powershell
docker compose up -d
```

**4. Initialize Database**
```powershell
npm run db:push
npm run db:seed
```

**5. Run Development Server**
```powershell
npm run dev
```

Visit **http://localhost:3000**

### Test Accounts

- **Credentials**: Register via form or use seeded admin
- **Google OAuth**: Configure redirect to `http://localhost:3000/api/auth/callback/google`
- **Admin Account**: `vinicius@vinibank.dev` (seeded with ADMIN role)

## 📋 Available Scripts

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
npm run format       # Format code with Prettier

# Database
npm run db:push      # Sync database schema
npm run db:seed      # Populate test data
npm run db:studio    # Open Prisma Studio

# Testing (when ready)
npm run test         # Run tests
npm run test:e2e     # Run E2E tests
```

## 🏛️ Project Structure

```
src/
├── app/
│   ├── api/              # Next.js API routes (authentication, transfers)
│   ├── demo/             # Authenticated dashboard
│   ├── login/            # Sign-in page
│   ├── register/         # Sign-up page
│   └── layout.tsx        # Root layout with providers
├── lib/
│   ├── env.ts            # Environment validation
│   ├── encryption.ts     # AES-256-GCM utilities
│   ├── logger.ts         # Structured logging
│   ├── api.ts            # Standardized API responses
│   ├── errors.ts         # Error handling
│   ├── security.ts       # Security headers, rate limiting
│   ├── types.ts          # TypeScript definitions
│   └── prisma.ts         # Prisma client
├── contexts/
│   └── LanguageContext.tsx  # i18n state management
└── components/
    ├── PageTransition.tsx    # Route transition animation
    └── LoadingBar.tsx        # Progress indicator

prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Test data

docs/
├── ARCHITECTURE.md       # System design & patterns
├── API.md               # API reference
├── SECURITY.md          # Security implementation
├── DEPLOYMENT.md        # Deployment guide
└── CONTRIBUTING.md      # Development workflow
```

## 🔐 Security Architecture

### Encryption
- **AES-256-GCM** for field-level encryption
- **PBKDF2** (100k iterations) for key derivation
- **bcryptjs** (12 rounds) for password hashing
- **SHA-256** for searchable field indexing

### Compliance Ready
- GDPR-compliant data handling
- Audit trail for all sensitive operations
- PCI DSS patterns implemented
- NIST security framework aligned

See **[SECURITY.md](./SECURITY.md)** for comprehensive details.

## 🎯 Enterprise Features Checklist

- ✅ **Environment Validation**: Startup validation with typed config
- ✅ **Structured Logging**: 5-level logging system with audit trails
- ✅ **Standardized Responses**: Consistent API response format
- ✅ **Error Hierarchy**: Custom error classes for semantic HTTP status codes
- ✅ **Security Headers**: CORS, CSP, X-Frame-Options, etc.
- ✅ **Rate Limiting**: Token bucket algorithm (60 req/min)
- ✅ **Type Definitions**: Shared interfaces across app
- ✅ **API Documentation**: Complete endpoint documentation with examples
- ✅ **Deployment Guides**: Vercel, Docker, and AWS instructions
- ✅ **Database Transactions**: Atomic operations (transfers)
- ✅ **i18n Ready**: Multi-language support architecture
- ✅ **Audit Logging**: Complete operation trails

## 🚢 Deployment

Deploy to production in minutes using one of the guides:

- **[Vercel](./DEPLOYMENT.md#vercel)** (Recommended) - Deploy from GitHub, zero config
- **[Docker](./DEPLOYMENT.md#docker)** - Container-based deployment
- **[AWS](./DEPLOYMENT.md#aws-ecs-fargate)** - ECS/Fargate for enterprise scale

All guides include database migrations, SSL setup, and monitoring.

## 🧪 Testing

```powershell
# Run encryption validation
npm run test:encryption

# When ready: Unit, integration, E2E
npm run test:unit
npm run test:integration

## Security hardening (fintech-grade)

This demo includes several protections commonly used in fintech backends:

- AES-256-GCM field encryption with PBKDF2-derived key (`src/lib/encryption.ts`) for PII and account numbers
- Strong security headers (HSTS, X-Frame-Options, CSP, etc.) via `next.config.ts`
- Origin/Referer validation for state-changing routes in `src/lib/security.ts`
- Rate limiting per IP/User (`src/lib/rateLimit.ts`)
- Idempotency for transfer endpoints backed by the database

After pulling these changes, run a migration to generate the `IdempotencyKey` table used for duplicate request protection:

```bash
npx prisma migrate dev --name add_idempotency
npx prisma generate
```

Environment variables required for crypto (use strong values in production):

```
ENCRYPTION_KEY=replace-with-strong-32+ char secret
ENCRYPTION_SALT=replace-with-random-salt
INDEX_SALT=replace-with-hash-salt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:
- The demo stores idempotent responses for the transfer APIs for replay within the database. In production, consider TTL cleanup jobs and KMS-managed keys.
- Rate limiting here is in-memory; use Redis in production.
npm run test:e2e
```

## 📊 API Endpoints

All endpoints documented in **[API.md](./API.md)**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | Authentication |
| `/api/register` | POST | User registration |
| `/api/accounts` | GET | List user accounts |
| `/api/accounts/decrypt` | POST | Decrypt sensitive field |
| `/api/transfer` | POST | Transfer funds |
| `/api/admin/logs` | GET | Audit logs (admin only) |

## 🔄 Development Workflow

1. **Branch**: `git checkout -b feature/name`
2. **Code**: Make changes, follow TypeScript strict mode
3. **Test**: `npm run type-check && npm run lint`
4. **Commit**: `git commit -m "feat: description"`
5. **Push**: `git push origin feature/name`
6. **PR**: Create pull request, pass CI/CD
7. **Deploy**: Merge to main, auto-deploys to production

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines.

## 🎓 Learning Value

This project demonstrates:

**Full-Stack Patterns**
- Type-safe API routes with request validation
- Database transactions and complex queries
- Authentication with JWT sessions
- Field-level encryption at scale

**Professional Practices**
- Comprehensive error handling
- Structured logging & monitoring
- Security-first design
- Production-ready configuration

**DevOps & Infrastructure**
- Docker containerization
- Database migrations & seeding
- Environment-based configuration
- Multi-platform deployment

**Code Quality**
- TypeScript strict mode
- ESLint configuration
- Consistent code style
- Type definitions for all shared data

Perfect for interviews, portfolio building, or production deployment.

## 📞 Support & Contribution

- **Documentation**: See [docs/](./docs/) folder
- **Issues**: Create issues for bugs or features
- **Security**: Report vulnerabilities to security@mainbank.local

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ to demonstrate senior full-stack engineering expertise**
