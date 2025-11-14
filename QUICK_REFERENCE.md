# 🚀 Quick Reference Guide

## Command Cheatsheet

```powershell
# Development
npm run dev              # Start dev server on http://localhost:3000

# Building
npm run build            # Production build
npm run start            # Run production build

# Code Quality
npm run lint             # Check code with ESLint
npm run type-check       # Verify TypeScript
npm run format           # Format with Prettier

# Database
npm run db:push          # Sync schema to database
npm run db:seed          # Load test data
npm run db:studio        # Open Prisma Studio (GUI)

# Encryption
npm run test:encryption  # Test AES-256-GCM implementation
```

## Environment Setup

### 1. Copy template
```powershell
Copy-Item .env.example .env.local
```

### 2. Generate encryption key
```powershell
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Add to `.env.local`
```
ENCRYPTION_KEY=<generated-key>
NEXTAUTH_SECRET=<long-random-string>
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=<from-google-cloud>
GOOGLE_CLIENT_SECRET=<from-google-cloud>
```

## Deployment

### Option 1: Vercel (Easiest)
```powershell
npm i -g vercel
vercel
# Follow prompts, auto-deploy on git push
```

### Option 2: Docker
```powershell
docker-compose up -d
npm run db:push
npm run start
```

### Option 3: AWS
See DEPLOYMENT.md section for ECS/Fargate

## Documentation Map

| Need | Read |
|------|------|
| Overview | README.md |
| Architecture | ARCHITECTURE.md |
| API Endpoints | API.md |
| Security Details | SECURITY.md |
| Deployment Steps | DEPLOYMENT.md |
| Project Status | PROJECT_SUMMARY.md |

## Key Files

### Configuration
- `.env.local` - Local configuration (git ignored)
- `.env.example` - Template with all required variables
- `next.config.ts` - Next.js settings
- `tsconfig.json` - TypeScript settings
- `tailwind.config.ts` - Styling system

### Application
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Landing page
- `src/app/demo/page.tsx` - User dashboard
- `src/contexts/LanguageContext.tsx` - i18n state

### API Routes
- `src/app/api/auth/[...nextauth]/route.ts` - Authentication
- `src/app/api/register/route.ts` - User signup
- `src/app/api/accounts/` - Account operations
- `src/app/api/transfer/route.ts` - Money transfers

### Utilities
- `src/lib/env.ts` - Config validation
- `src/lib/logger.ts` - Logging system
- `src/lib/api.ts` - Response builder
- `src/lib/errors.ts` - Error handling
- `src/lib/security.ts` - Security utils
- `src/lib/encryption.ts` - AES-256-GCM
- `src/lib/types.ts` - Type definitions

### Database
- `prisma/schema.prisma` - Data model
- `prisma/seed.ts` - Test data

## Test Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| vinicius@vinibank.dev | Use register flow | Admin | Seeded |
| your-email | Your password | User | Create via registration |

Or use Google OAuth after configuring credentials.

## Common Tasks

### Add a new API endpoint

1. Create file: `src/app/api/your-endpoint/route.ts`
2. Import utilities:
   ```typescript
   import { getServerSession } from 'next-auth';
   import { logger } from '@/lib/logger';
   import { ApiResponseBuilder, handleApiError } from '@/lib/api';
   ```
3. Use pattern from ARCHITECTURE.md
4. Test: `npm run dev` and call endpoint

### Add a new page

1. Create folder: `src/app/your-page/`
2. Create file: `src/app/your-page/page.tsx`
3. Add to navbar in `src/app/Navbar.tsx`
4. Style with Tailwind CSS

### Add i18n translation

1. Add key to translation object in `src/contexts/LanguageContext.tsx`
2. Use in component: `const { t } = useLanguage(); t('keyName')`

### Debug in production

1. Check logs: `npm run db:studio` (Prisma)
2. View audit logs: `/admin` page
3. Check API errors: Browser DevTools → Network tab
4. Review server logs: Deployment platform's log viewer

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ENCRYPTION_KEY is not set" | Add ENCRYPTION_KEY to .env.local |
| "Database connection failed" | Ensure PostgreSQL is running, check DATABASE_URL |
| TypeScript errors | Run `npm run type-check` and fix issues |
| Port 3000 in use | Change port: `npm run dev -- -p 3001` |
| Google OAuth redirect error | Add `http://localhost:3000/api/auth/callback/google` to Google Cloud |

## Performance Tips

### Frontend
- Check Lighthouse: DevTools → Lighthouse tab
- Use DevTools → Performance tab for profiling
- Keep images under 100KB
- Limit third-party scripts

### Backend
- Use Prisma Studio to inspect queries: `npm run db:studio`
- Enable query logging in development
- Check API response times in Network tab
- Use rate limiting for abuse prevention

### Database
- Run `npm run db:push` after schema changes
- Keep indexes on frequently queried fields
- Archive old data periodically
- Use connection pooling (Prisma handles this)

## Security Checklist Before Deployment

- [ ] All env vars set in production
- [ ] NEXTAUTH_SECRET is strong and secret
- [ ] ENCRYPTION_KEY is secure and backed up
- [ ] Database backups enabled
- [ ] HTTPS/SSL enabled
- [ ] Security headers configured
- [ ] Rate limiting tested
- [ ] Audit logging working
- [ ] Admin account password strong
- [ ] No sensitive data in git

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

## Getting Help

1. **Check documentation first**: See docs/ folder
2. **Search issues**: GitHub issues or StackOverflow
3. **Ask in community**: Next.js Discord, Prisma Discord
4. **Debug locally**: `npm run dev` and use browser DevTools

---

**Pro Tip**: Keep this guide bookmarked for quick reference during development!
