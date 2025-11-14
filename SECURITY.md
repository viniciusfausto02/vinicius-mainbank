# ViniBank Security & Cryptography

## Overview

ViniBank implements **industry-standard encryption** for sensitive banking data, following the same security practices used by major fintechs like Stripe, Plaid, and Brex.

## Encryption Implementation

### Algorithm: AES-256-GCM

We use **AES-256-GCM** (Advanced Encryption Standard with 256-bit keys and Galois/Counter Mode) for field-level encryption. This is the gold standard for data-at-rest encryption and provides:

- **Confidentiality**: Data is encrypted and unreadable without the key
- **Integrity**: Built-in authentication tag prevents tampering
- **Performance**: Hardware-accelerated on modern CPUs
- **Compliance**: Meets PCI DSS, NIST, and SOC 2 requirements

### Key Derivation: PBKDF2

Keys are derived using **PBKDF2** (Password-Based Key Derivation Function 2) with:
- **100,000 iterations** (NIST SP 800-132 recommendation)
- **SHA-256** hash function
- **Unique salt** per environment

This makes brute-force attacks computationally infeasible.

## Protected Data

### Encrypted Fields

The following sensitive data is encrypted at rest:

#### Account Information
- **Full account numbers** (`Account.encryptedAccountNumber`)
- **Routing numbers** (`Account.encryptedRoutingNumber`)

#### Personal Identifiable Information (PII)
- **Social Security Number / Tax ID** (`EncryptedUserData.encryptedSSN`)
- **Full legal name** (`EncryptedUserData.encryptedLegalName`)
- **Date of birth** (`EncryptedUserData.encryptedDateOfBirth`)
- **Phone number** (`EncryptedUserData.encryptedPhoneNumber`)
- **Address** (`EncryptedUserData.encryptedAddress`)

### Searchable Hashing

For fields that need to be searchable (e.g., finding accounts by number), we store **SHA-256 hashes**:
- `Account.accountNumberHash`
- `EncryptedUserData.ssnHash`
- `EncryptedUserData.phoneHash`

These hashes allow searching without exposing plaintext, similar to how passwords are hashed.

## Audit Logging

All decryption operations are logged in the `EncryptionAuditLog` table for **compliance and security monitoring**:

```typescript
{
  userId: string,        // Who accessed the data
  fieldName: string,     // What field was decrypted
  reason: string,        // Why it was accessed
  ipAddress: string,     // Where the request came from
  userAgent: string,     // What client made the request
  createdAt: DateTime    // When it happened
}
```

This audit trail is essential for:
- **Compliance**: SOC 2, PCI DSS, GDPR requirements
- **Security**: Detecting unauthorized access
- **Forensics**: Investigating security incidents

## API Endpoints

### Decrypt Sensitive Data
`POST /api/accounts/decrypt`

Decrypts a specific encrypted field with automatic audit logging.

**Request:**
```json
{
  "accountId": "clx...",
  "fieldName": "accountNumber",
  "reason": "User viewed full account number"
}
```

**Response:**
```json
{
  "success": true,
  "value": "4532756279451023"
}
```

**Security:**
- Requires authentication
- Verifies account ownership
- Logs all decryption operations
- Records IP address and user agent

## Environment Variables

The encryption system requires two environment variables:

```bash
# 256-bit (32-byte) encryption key as hex
ENCRYPTION_KEY=your-64-character-hex-string

# 128-bit (16-byte) salt as hex
ENCRYPTION_SALT=your-32-character-hex-string
```

### Generating Keys

Use these commands to generate cryptographically secure keys:

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate salt
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Key Management

**Development:**
- Keys stored in `.env` file (never committed to git)
- Unique keys per developer

**Production:**
- Store keys in **Key Management Service (KMS)**:
  - AWS: AWS KMS or AWS Secrets Manager
  - Azure: Azure Key Vault
  - GCP: Google Cloud KMS
- Enable **key rotation** policies
- Use **Hardware Security Modules (HSM)** for maximum security

## UI Components

### SensitiveDataToggle

The `SensitiveDataToggle` component provides a secure way to view encrypted data:

```tsx
<SensitiveDataToggle
  accountId={account.id}
  accountName={account.name}
  maskedValue="•••• 1023"
  fieldName="accountNumber"
/>
```

Features:
- **Masked by default**: Shows only last 4 digits
- **On-demand decryption**: Fetches plaintext only when user clicks "Show"
- **Loading states**: Visual feedback during decryption
- **Error handling**: Graceful failure messages
- **Automatic audit logging**: Every view is logged

Visual indicators:
- 🔒 **Lock icon**: Indicates encrypted data
- **"Encrypted Data" label**: Clear security indicator
- **Show/Hide toggle**: Eye icon buttons

## Encryption Library

Located in `src/lib/encryption.ts`, this library provides:

### Core Functions

```typescript
// Encrypt plaintext data
const encrypted = encrypt("4532756279451023");
// Returns: "base64_iv:authTag:encryptedData"

// Decrypt ciphertext
const plaintext = decrypt(encrypted);
// Returns: "4532756279451023"

// Mask sensitive data for display
const masked = maskSensitiveData("4532756279451023", 4);
// Returns: "••••••••••••1023"

// Generate searchable hash
const hash = hashForIndex("4532756279451023");
// Returns: SHA-256 hash

// Generate secure random token
const token = generateSecureToken(32);
// Returns: 64-character hex string
```

### Batch Operations

```typescript
// Encrypt multiple fields at once
const encrypted = encryptFields({
  accountNumber: "4532756279451023",
  routingNumber: "021000021"
});

// Decrypt multiple fields
const plaintext = decryptFields({
  accountNumber: encrypted.accountNumber,
  routingNumber: encrypted.routingNumber
});
```

## Compliance Standards

Our implementation meets or exceeds requirements for:

### PCI DSS (Payment Card Industry Data Security Standard)
- ✅ Strong cryptography (AES-256)
- ✅ Key management procedures
- ✅ Encryption of cardholder data at rest
- ✅ Audit logging of access to cardholder data

### NIST (National Institute of Standards and Technology)
- ✅ FIPS 140-2 approved algorithm (AES)
- ✅ PBKDF2 with 100,000+ iterations
- ✅ Authenticated encryption (GCM mode)
- ✅ Cryptographically secure random number generation

### SOC 2 (Service Organization Control 2)
- ✅ Encryption of sensitive data
- ✅ Access logging and monitoring
- ✅ Key management policies
- ✅ Regular security audits via audit logs

### GDPR (General Data Protection Regulation)
- ✅ Privacy by design (encrypted PII)
- ✅ Data minimization (field-level encryption)
- ✅ Audit trail for data access
- ✅ Right to erasure (can delete encrypted data)

## Best Practices

### Key Rotation

Implement regular key rotation:

1. Generate new encryption key
2. Decrypt all data with old key
3. Re-encrypt with new key
4. Update environment variable
5. Securely delete old key

### Monitoring

Monitor the `EncryptionAuditLog` table for:
- Unusual access patterns
- Multiple failed decryption attempts
- Access from unexpected IPs
- High-frequency data access

### Backup Security

When backing up the database:
- ✅ Data remains encrypted in backups
- ✅ Store backup encryption keys separately
- ✅ Encrypt backup files themselves
- ✅ Test restore procedures regularly

## Security Checklist

- [x] AES-256-GCM encryption for sensitive data
- [x] PBKDF2 key derivation with 100,000 iterations
- [x] Authenticated encryption (prevents tampering)
- [x] Field-level encryption (minimize exposure)
- [x] Searchable hashing (SHA-256)
- [x] Audit logging for all decryption operations
- [x] Secure key storage (environment variables)
- [x] Input validation on encrypted data
- [x] Error handling without information leakage
- [x] UI masking of sensitive data by default

## Real-World Examples

This implementation mirrors security practices from industry leaders:

**Stripe:**
- Uses AES-256-GCM for card data
- Field-level encryption
- Audit logging
- Key rotation policies

**Plaid:**
- Encrypts bank credentials at rest
- Uses PBKDF2 for key derivation
- Comprehensive audit trails
- HSM-backed key storage in production

**Brex:**
- AES-256 encryption for financial data
- Multi-layer encryption approach
- Real-time monitoring of data access
- SOC 2 Type II compliant

## References

- [NIST SP 800-132: PBKDF](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [NIST SP 800-175B: Guideline for Using Cryptographic Standards](https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

---

**Remember:** Security is a continuous process. Regularly review and update encryption practices to stay ahead of evolving threats.
