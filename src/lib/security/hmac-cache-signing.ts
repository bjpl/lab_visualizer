/**
 * HMAC Cache Signing Utility
 *
 * Provides cryptographic signing and verification for cache entries
 * Prevents cache poisoning and tampering attacks with key rotation support
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export interface CacheSigningConfig {
  algorithm: 'sha256' | 'sha512';
  keyRotationIntervalMs: number;
  maxKeyAge: number;
  encoding: 'hex' | 'base64';
}

export interface SignedCacheEntry<T = any> {
  data: T;
  signature: string;
  keyId: string;
  timestamp: number;
}

export interface SignatureVerificationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
  keyId?: string;
}

/**
 * HMAC Cache Signing Service
 */
export class HMACCacheSigning {
  private keys: Map<string, { key: Buffer; createdAt: number }> = new Map();
  private currentKeyId: string;
  private config: CacheSigningConfig;
  private rotationTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheSigningConfig>) {
    this.config = {
      algorithm: 'sha256',
      keyRotationIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
      maxKeyAge: 48 * 60 * 60 * 1000, // 48 hours (keep old keys for verification)
      encoding: 'base64',
      ...config
    };

    // Initialize with first key
    this.currentKeyId = this.generateKeyId();
    this.keys.set(this.currentKeyId, {
      key: this.generateKey(),
      createdAt: Date.now()
    });

    // Start automatic key rotation
    this.startKeyRotation();
  }

  /**
   * Generate a new signing key
   */
  private generateKey(): Buffer {
    const keySize = this.config.algorithm === 'sha512' ? 64 : 32;
    return randomBytes(keySize);
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Start automatic key rotation
   */
  private startKeyRotation(): void {
    this.rotationTimer = setInterval(() => {
      this.rotateKeys();
    }, this.config.keyRotationIntervalMs);
  }

  /**
   * Rotate signing keys
   */
  public rotateKeys(): void {
    // Generate new key
    const newKeyId = this.generateKeyId();
    const newKey = this.generateKey();

    this.keys.set(newKeyId, {
      key: newKey,
      createdAt: Date.now()
    });

    this.currentKeyId = newKeyId;

    // Remove expired keys
    const now = Date.now();
    for (const [keyId, keyData] of this.keys.entries()) {
      if (now - keyData.createdAt > this.config.maxKeyAge) {
        this.keys.delete(keyId);
      }
    }

    console.log(`[HMAC] Key rotated. Active keys: ${this.keys.size}, Current: ${this.currentKeyId}`);
  }

  /**
   * Sign cache data
   */
  public sign<T>(data: T): SignedCacheEntry<T> {
    const keyData = this.keys.get(this.currentKeyId);
    if (!keyData) {
      throw new Error('No active signing key available');
    }

    const timestamp = Date.now();
    const payload = JSON.stringify({ data, timestamp, keyId: this.currentKeyId });

    const hmac = createHmac(this.config.algorithm, keyData.key);
    hmac.update(payload);
    const signature = hmac.digest(this.config.encoding);

    return {
      data,
      signature,
      keyId: this.currentKeyId,
      timestamp
    };
  }

  /**
   * Verify signed cache entry
   */
  public verify<T>(signedEntry: SignedCacheEntry<T>): SignatureVerificationResult<T> {
    try {
      // Check if we have the key
      const keyData = this.keys.get(signedEntry.keyId);
      if (!keyData) {
        return {
          valid: false,
          error: 'Unknown signing key - may have expired'
        };
      }

      // Reconstruct the payload
      const payload = JSON.stringify({
        data: signedEntry.data,
        timestamp: signedEntry.timestamp,
        keyId: signedEntry.keyId
      });

      // Calculate expected signature
      const hmac = createHmac(this.config.algorithm, keyData.key);
      hmac.update(payload);
      const expectedSignature = hmac.digest(this.config.encoding);

      // Timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signedEntry.signature, this.config.encoding);
      const expectedBuffer = Buffer.from(expectedSignature, this.config.encoding);

      if (signatureBuffer.length !== expectedBuffer.length) {
        return {
          valid: false,
          error: 'Invalid signature length'
        };
      }

      const valid = timingSafeEqual(signatureBuffer, expectedBuffer);

      if (!valid) {
        return {
          valid: false,
          error: 'Signature verification failed - data may be tampered'
        };
      }

      // Check timestamp freshness (optional - prevents replay attacks)
      const maxAge = this.config.maxKeyAge;
      const age = Date.now() - signedEntry.timestamp;
      if (age > maxAge) {
        return {
          valid: false,
          error: 'Signed data has expired'
        };
      }

      return {
        valid: true,
        data: signedEntry.data,
        keyId: signedEntry.keyId
      };
    } catch (error) {
      return {
        valid: false,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Sign cache key-value pair
   */
  public signCacheEntry(key: string, value: any): { key: string; signedValue: string } {
    const signed = this.sign({ key, value });
    return {
      key,
      signedValue: JSON.stringify(signed)
    };
  }

  /**
   * Verify and extract cache value
   */
  public verifyCacheEntry(key: string, signedValue: string): { valid: boolean; value?: any; error?: string } {
    try {
      const signedEntry = JSON.parse(signedValue) as SignedCacheEntry<{ key: string; value: any }>;
      const result = this.verify(signedEntry);

      if (!result.valid || !result.data) {
        return {
          valid: false,
          error: result.error
        };
      }

      // Verify key matches
      if (result.data.key !== key) {
        return {
          valid: false,
          error: 'Key mismatch - possible cache poisoning attempt'
        };
      }

      return {
        valid: true,
        value: result.data.value
      };
    } catch (error) {
      return {
        valid: false,
        error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current key information
   */
  public getKeyInfo() {
    return {
      currentKeyId: this.currentKeyId,
      activeKeys: this.keys.size,
      keys: Array.from(this.keys.entries()).map(([keyId, data]) => ({
        keyId,
        createdAt: data.createdAt,
        age: Date.now() - data.createdAt
      }))
    };
  }

  /**
   * Stop key rotation timer
   */
  public stop(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
  }

  /**
   * Clear all keys (for testing)
   */
  public clearKeys(): void {
    this.keys.clear();
    this.currentKeyId = this.generateKeyId();
    this.keys.set(this.currentKeyId, {
      key: this.generateKey(),
      createdAt: Date.now()
    });
  }
}

// Singleton instance
let cacheSigning: HMACCacheSigning;

/**
 * Get or create singleton instance
 */
export function getCacheSigning(config?: Partial<CacheSigningConfig>): HMACCacheSigning {
  if (!cacheSigning) {
    cacheSigning = new HMACCacheSigning(config);
  }
  return cacheSigning;
}

/**
 * Reset singleton (for testing)
 */
export function resetCacheSigning(): void {
  if (cacheSigning) {
    cacheSigning.stop();
  }
  cacheSigning = undefined as any;
}

export default getCacheSigning;
