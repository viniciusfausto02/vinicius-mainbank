// src/lib/encryption.ts
//
// Field-level encryption for sensitive banking data.
// Uses AES-256-GCM encryption - the same standard used by major banks and fintechs.
//
// Security approach:
// - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
// - Each field encrypted with unique IV (initialization vector)
// - Master key derived from environment variable using PBKDF2
// - Account numbers, SSN, routing numbers are encrypted at rest
// - Decryption only happens when data needs to be displayed
//
// Industry standards:
// - PCI DSS compliant encryption
// - NIST recommended algorithms
// - Same approach as Stripe, Plaid, Brex

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// Master encryption key - in production this should be in a secure key management service (AWS KMS, GCP KMS, HashiCorp Vault)
function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production-or-security-breach";
  const salt = process.env.ENCRYPTION_SALT || "default-dev-salt-change-in-production";
  
  // Derive a key using PBKDF2 (Password-Based Key Derivation Function 2)
  // 100,000 iterations is recommended by NIST
  return pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns: base64(iv:authTag:encryptedData)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + authTag + encrypted data for storage
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex")
  ]);
  
  return combined.toString("base64");
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * Input: base64(iv:authTag:encryptedData)
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return "";
  
  try {
    const key = getMasterKey();
    const combined = Buffer.from(ciphertext, "base64");
    
    // Extract IV, authTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // Log only in development, not during testing
    if (process.env.NODE_ENV !== "test") {
      console.error("Decryption failed:", error);
    }
    throw error; // Re-throw for proper error handling
  }
}

/**
 * Mask sensitive data for display (e.g., account numbers, SSN)
 * Shows only last 4 digits
 */
export function maskSensitiveData(data: string, visibleDigits: number = 4): string {
  if (!data || data.length <= visibleDigits) return data;
  return "•".repeat(data.length - visibleDigits) + data.slice(-visibleDigits);
}

/**
 * Hash sensitive data for indexing/searching without exposing plaintext
 * Uses SHA-256 with salt
 */
export function hashForIndex(data: string): string {
  const crypto = require("crypto");
  const salt = process.env.INDEX_SALT || "default-index-salt";
  return crypto.createHash("sha256").update(data + salt).digest("hex");
}

/**
 * Generate secure random tokens (for account numbers, card numbers, etc.)
 */
export function generateSecureToken(length: number = 16): string {
  return randomBytes(length).toString("hex");
}

/**
 * Validate and sanitize account numbers
 */
export function sanitizeAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/[^0-9]/g, "");
}

/**
 * Encrypt multiple fields at once (batch operation)
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encrypt(result[field] as string) as any;
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields at once (batch operation)
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = decrypt(result[field] as string) as any;
    }
  }
  
  return result;
}
