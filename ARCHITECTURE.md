# Architecture & Code Organization Guide

## Project Structure Overview

```
vinicius-mainbank/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── accounts/             # Account management
│   │   │   ├── transfer/             # Transfer operations
│   │   │   └── register/             # User registration
│   │   ├── demo/                     # Dashboard page
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   └── LanguageRoot.tsx          # i18n setup
│   │
│   ├── components/                   # Reusable components
│   │   ├── PageTransition.tsx        # Route transition overlay
│   │   └── LoadingBar.tsx            # Progress bar
│   │
│   ├── contexts/                     # React Context providers
│   │   └── LanguageContext.tsx       # i18n language state
│   │
│   ├── lib/                          # Utility functions & business logic
│   │   ├── env.ts                    # Environment validation
│   │   ├── encryption.ts             # AES-256-GCM crypto
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── logger.ts                 # Structured logging
│   │   ├── api.ts                    # API response builders
│   │   ├── errors.ts                 # Error handling utilities
│   │   ├── security.ts               # Security headers, CORS, rate limiting
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── rateLimit.ts              # Rate limiting middleware
│   │
│   └── middleware.ts                 # Next.js middleware (auth, redirects)
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Database seeding
│
├── scripts/
│   └── test-encryption.ts            # Encryption validation tests
│
├── public/                           # Static assets
│   └── favicon.ico
│
├── .github/
│   └── workflows/                    # CI/CD workflows
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # This file
│   ├── API.md                        # API documentation
│   ├── SECURITY.md                   # Security details
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── CONTRIBUTING.md               # Contributing guidelines
│
├── .env.example                      # Environment template
├── .env.local                        # Local environment (git ignored)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind configuration
├── next.config.ts                    # Next.js configuration
├── postcss.config.mjs                # PostCSS configuration
├── eslint.config.mjs                 # ESLint configuration
└── README.md                         # Project overview
```

## Key Architectural Patterns

### 1. **API Route Handler Pattern**

All API routes follow a consistent pattern:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder, handleApiError, generateRequestId } from '@/lib/api';
import { AuthenticationError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // 1. Authenticate
    const session = await getServerSession();
    if (!session) throw new AuthenticationError();
    
    // 2. Validate input
    const body = await request.json();
    if (!body.field) throw new ValidationError('Field is required');
    
    // 3. Business logic
    // ...
    
    // 4. Return success
    logger.info('Operation completed', { requestId, userId: session.user.id });
    return NextResponse.json(
      ApiResponseBuilder.success(data, requestId),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
```

### 2. **Database Access Pattern**

Use Prisma for type-safe database access:

```typescript
// Example: Get user with accounts
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    accounts: {
      select: {
        id: true,
        name: true,
        balance: true,
        accountNumberHash: true,
      },
    },
  },
});
```

### 3. **Error Handling Pattern**

Custom error classes for different scenarios:

```typescript
// Validation error
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', { email });
}

// Authentication error
if (!user) {
  throw new AuthenticationError('User not found');
}

// Authorization error
if (user.role !== 'ADMIN') {
  throw new AuthorizationError('Admin access required');
}

// Business logic error
if (account.balance < amount) {
  throw new BusinessLogicError(
    ERROR_CODES.INSUFFICIENT_BALANCE,
    'Insufficient balance',
    { required: amount, available: account.balance }
  );
}
```

### 4. **Component Pattern**

```typescript
// src/components/Example.tsx
"use client"; // Server or Client component declaration

import { useLanguage } from '@/contexts/LanguageContext';

export default function Example() {
  const { t, locale } = useLanguage();
  
  return (
    <div className="...">
      <h1>{t('exampleKey')}</h1>
    </div>
  );
}
```

## Security Architecture

### 1. **Field-Level Encryption**

Sensitive fields encrypted with AES-256-GCM:

```typescript
// Encrypt
const encrypted = encrypt(sensitiveData);
await db.user.update({
  where: { id },
  data: { encryptedSsn: encrypted }
});

// Decrypt (with audit logging)
const decrypted = decrypt(user.encryptedSsn);
await db.encryptionAuditLog.create({
  data: {
    userId: currentUser.id,
    fieldName: 'ssn',
    reason: 'User requested',
    ipAddress: getClientIp(request),
  }
});
```

### 2. **Authentication Flow**

```
User → Login Page → NextAuth → Session → API Routes
                  ↓
           Credentials Provider OR Google OAuth
```

### 3. **Authorization Checks**

```typescript
// Check session
const session = await getServerSession();
if (!session?.user?.id) throw new AuthenticationError();

// Check role
if (session.user.role !== 'ADMIN') throw new AuthorizationError();

// Check resource ownership
const account = await db.account.findUnique({ where: { id } });
if (account.userId !== session.user.id) throw new AuthorizationError();
```

## Data Flow

### 1. **User Registration**

```
Frontend Form
    ↓
POST /api/register
    ↓
Validate input (email, password)
    ↓
Hash password with bcryptjs
    ↓
Create user in database
    ↓
Log audit entry
    ↓
Return success response
    ↓
Auto-signin with credentials
    ↓
Create session
```

### 2. **Account Decryption**

```
Frontend Request
    ↓
POST /api/accounts/decrypt
    ↓
Authenticate session
    ↓
Validate request (accountId, fieldName, reason)
    ↓
Fetch encrypted field
    ↓
Decrypt using AES-256-GCM
    ↓
Log to EncryptionAuditLog
    ↓
Return decrypted value
```

### 3. **Transfer Process**

```
Frontend Form
    ↓
POST /api/transfer
    ↓
Authenticate & authorize
    ↓
Validate inputs (amounts, accounts)
    ↓
Check source account balance
    ↓
Prisma Transaction:
  ├─ Debit from source
  ├─ Credit to destination
  └─ Create transaction record
    ↓
Return transaction ID & status
```

## Performance Considerations

### 1. **Database Optimization**

- Indexes on frequently queried fields
- Connection pooling (Prisma)
- N+1 query prevention (select/include)

```typescript
// Good: Prevents N+1
const users = await prisma.user.findMany({
  include: { accounts: true } // Fetch in one query
});

// Bad: N+1 queries
const users = await prisma.user.findMany();
const accounts = await Promise.all(
  users.map(u => prisma.account.findMany({ where: { userId: u.id } }))
);
```

### 2. **Frontend Optimization**

- Image optimization (Next.js)
- Code splitting (automatic)
- CSS optimization (Tailwind)
- Smooth page transitions

### 3. **API Optimization**

- Efficient queries
- Response compression
- Caching headers
- Rate limiting

## Testing Strategy

### 1. **Unit Tests**

```bash
# Test utilities, helpers
npm run test:unit
```

### 2. **Integration Tests**

```bash
# Test API routes with database
npm run test:integration
```

### 3. **E2E Tests**

```bash
# Test critical user flows
npm run test:e2e
```

## Deployment Architecture

```
GitHub (Source) → GitHub Actions (CI/CD) → Vercel (Production)
                                       ↓
                                   Database (PostgreSQL)
                                       ↓
                              Monitoring & Logging
```

## Scaling Considerations

### Horizontal Scaling

- Stateless API routes (easily scaled)
- Session stored in database/Redis
- Database connection pooling

### Vertical Scaling

- Optimize queries
- Cache frequently accessed data
- Use CDN for static assets

### Database Scaling

- Add read replicas
- Sharding for large datasets
- Archive old transaction data

## Development Workflow

```
1. Create feature branch
   git checkout -b feature/feature-name

2. Make changes
   npm run dev
   npm run lint
   npm run type-check

3. Test locally
   npm run test

4. Commit with conventional commits
   git commit -m "feat: add new feature"

5. Push and create PR
   git push origin feature/feature-name

6. CI/CD runs tests

7. Code review and merge

8. Auto-deploys to staging/production
```

## Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | 16.0 |
| react | UI Library | 19.2 |
| typescript | Type Safety | 5 |
| prisma | ORM | 6.19 |
| next-auth | Authentication | 4.24 |
| tailwindcss | Styling | 4 |
| bcryptjs | Password hashing | 3.0 |

## Security Checklist

- ✅ HTTPS enforced
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Field-level encryption
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Security headers
- ✅ Input validation
- ✅ Session management

## Monitoring & Observability

- Structured logging
- Error tracking (Sentry-ready)
- Performance monitoring (Web Vitals)
- Request logging
- Audit trail

See `SECURITY.md` for detailed security documentation.
