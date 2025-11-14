# ViniBank API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.vinibank.com/api
```

## Authentication

All protected endpoints require a valid session. Obtain a session by:

1. **Credentials Login**: POST `/auth/signin` with email + password
2. **Google OAuth**: Redirect to `/api/auth/signin/google`

Session is maintained via secure HTTP-only cookies (NextAuth).

## Error Handling

All responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "requestId": "1234567890-abc123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data (400)
- `AUTHENTICATION_ERROR` - Missing/invalid credentials (401)
- `AUTHORIZATION_ERROR` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists (409)
- `INTERNAL_ERROR` - Server error (500)

## Endpoints

### Authentication

#### POST `/auth/signin`

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `400` - Missing email or password

---

#### POST `/auth/signup`

Register new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password-min-8-chars"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
}
```

**Status Codes:**
- `201` - User created
- `400` - Validation error (missing fields, password too short)
- `409` - Email already registered
- `429` - Rate limited (too many signup attempts)

---

#### POST `/auth/signout`

Logout current user.

**Response:**
```json
{
  "success": true
}
```

---

### Accounts

#### GET `/accounts`

Get all accounts for authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "account-uuid",
      "name": "Checking Account",
      "balance": 5000.00,
      "accountNumberHash": "hash-for-display",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/accounts/decrypt`

Decrypt sensitive account data (requires specific reason).

**Authentication:** Required

**Request:**
```json
{
  "accountId": "account-uuid",
  "fieldName": "accountNumber|routingNumber",
  "reason": "User requested account details"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "value": "1234567890"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `401` - Unauthorized
- `404` - Account not found
- `403` - User doesn't own this account

**Audit:** Every decryption is logged for compliance.

---

### Transfers

#### POST `/transfer`

Initiate transfer between accounts.

**Authentication:** Required

**Request:**
```json
{
  "fromAccountId": "source-account-uuid",
  "toAccountId": "destination-account-uuid",
  "amount": 100.00,
  "description": "Payment to John"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "amount": 100.00,
    "status": "COMPLETED",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `201` - Transfer created
- `400` - Validation error
- `401` - Unauthorized
- `422` - Insufficient balance / Business logic error
- `500` - Transaction failed

**Validation:**
- `amount` > 0
- `fromAccountId` != `toAccountId`
- User owns source account
- Sufficient balance

---

## Rate Limiting

All endpoints are rate-limited:

- **Standard**: 60 requests/minute per IP
- **Auth**: 3 signup attempts/minute per IP
- **Decryption**: 10 requests/minute per user (sensitive operation)

Response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

---

## Security

### HTTPS

All production requests must use HTTPS. HTTP redirects to HTTPS.

### CORS

Allowed origins (configurable):
- Development: `http://localhost:3000`
- Production: `https://vinibank.com`

### Headers

All responses include security headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`

### Encryption

Sensitive fields are encrypted using **AES-256-GCM**:
- Account numbers
- Routing numbers
- Social security numbers
- Phone numbers
- Addresses

---

## Pagination

List endpoints support pagination:

```
GET /api/transactions?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable - Business logic error |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Examples

### cURL

```bash
# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get accounts
curl -X GET http://localhost:3000/api/accounts \
  -H "Cookie: <session-cookie>"

# Transfer funds
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "fromAccountId":"account1",
    "toAccountId":"account2",
    "amount":100.00,
    "description":"Payment"
  }'
```

### JavaScript/Fetch

```javascript
// Sign in and get session
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  }),
  credentials: 'include'
});

// Subsequent requests automatically include session
const accounts = await fetch('/api/accounts', {
  credentials: 'include'
});
```

---

## Changelog

### v1.0.0 (2025-01-15)

- Initial API release
- Authentication endpoints
- Account management
- Transfer functionality
- Field-level encryption
- Audit logging
