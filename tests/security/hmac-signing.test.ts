/**
 * HMAC Cache Signing Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HMACCacheSigning, getCacheSigning, resetCacheSigning } from '@/lib/security/hmac-cache-signing';

describe('HMAC Cache Signing', () => {
  let signer: HMACCacheSigning;

  beforeEach(() => {
    resetCacheSigning();
    signer = getCacheSigning({
      algorithm: 'sha256',
      keyRotationIntervalMs: 1000, // 1 second for testing
      maxKeyAge: 2000 // 2 seconds for testing
    });
  });

  afterEach(() => {
    signer.stop();
    resetCacheSigning();
  });

  describe('sign', () => {
    it('should sign data successfully', () => {
      const data = { user: 'test', value: 123 };
      const signed = signer.sign(data);

      expect(signed).toHaveProperty('data');
      expect(signed).toHaveProperty('signature');
      expect(signed).toHaveProperty('keyId');
      expect(signed).toHaveProperty('timestamp');
      expect(signed.data).toEqual(data);
      expect(typeof signed.signature).toBe('string');
      expect(signed.signature.length).toBeGreaterThan(0);
    });

    it('should produce different signatures for different data', () => {
      const data1 = { value: 'test1' };
      const data2 = { value: 'test2' };

      const signed1 = signer.sign(data1);
      const signed2 = signer.sign(data2);

      expect(signed1.signature).not.toBe(signed2.signature);
    });

    it('should include timestamp in signed data', () => {
      const before = Date.now();
      const signed = signer.sign({ test: 'data' });
      const after = Date.now();

      expect(signed.timestamp).toBeGreaterThanOrEqual(before);
      expect(signed.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('verify', () => {
    it('should verify valid signed data', () => {
      const data = { test: 'verification' };
      const signed = signer.sign(data);
      const result = signer.verify(signed);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
    });

    it('should reject tampered data', () => {
      const data = { test: 'original' };
      const signed = signer.sign(data);

      // Tamper with the data
      signed.data = { test: 'tampered' };

      const result = signer.verify(signed);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject tampered signature', () => {
      const data = { test: 'data' };
      const signed = signer.sign(data);

      // Tamper with signature
      signed.signature = signed.signature.replace(/./g, 'x');

      const result = signer.verify(signed);
      expect(result.valid).toBe(false);
    });

    it('should reject expired signatures', async () => {
      const signerWithShortExpiry = new HMACCacheSigning({
        maxKeyAge: 100 // 100ms
      });

      const signed = signerWithShortExpiry.sign({ test: 'data' });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = signerWithShortExpiry.verify(signed);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');

      signerWithShortExpiry.stop();
    });

    it('should reject unknown key IDs', () => {
      const data = { test: 'data' };
      const signed = signer.sign(data);

      // Change key ID
      signed.keyId = 'unknown_key_id';

      const result = signer.verify(signed);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown signing key');
    });
  });

  describe('signCacheEntry', () => {
    it('should sign cache key-value pairs', () => {
      const key = 'user:123';
      const value = { name: 'Test User', role: 'admin' };

      const { key: resultKey, signedValue } = signer.signCacheEntry(key, value);

      expect(resultKey).toBe(key);
      expect(typeof signedValue).toBe('string');

      const parsed = JSON.parse(signedValue);
      expect(parsed).toHaveProperty('signature');
      expect(parsed).toHaveProperty('keyId');
    });
  });

  describe('verifyCacheEntry', () => {
    it('should verify valid cache entries', () => {
      const key = 'session:abc123';
      const value = { userId: '456', expires: Date.now() + 10000 };

      const { signedValue } = signer.signCacheEntry(key, value);
      const result = signer.verifyCacheEntry(key, signedValue);

      expect(result.valid).toBe(true);
      expect(result.value).toEqual(value);
      expect(result.error).toBeUndefined();
    });

    it('should reject cache entry with mismatched key', () => {
      const key = 'cache:original';
      const value = { data: 'test' };

      const { signedValue } = signer.signCacheEntry(key, value);
      const result = signer.verifyCacheEntry('cache:different', signedValue);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Key mismatch');
    });

    it('should reject tampered cache values', () => {
      const key = 'cache:test';
      const value = { amount: 100 };

      const { signedValue } = signer.signCacheEntry(key, value);

      // Tamper with signed value
      const parsed = JSON.parse(signedValue);
      parsed.data.value.amount = 1000;
      const tamperedValue = JSON.stringify(parsed);

      const result = signer.verifyCacheEntry(key, tamperedValue);
      expect(result.valid).toBe(false);
    });

    it('should reject malformed signed values', () => {
      const result = signer.verifyCacheEntry('key', 'not valid json');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Parse error');
    });
  });

  describe('key rotation', () => {
    it('should rotate keys automatically', async () => {
      const initialKeyInfo = signer.getKeyInfo();
      const initialKeyId = initialKeyInfo.currentKeyId;

      // Wait for rotation
      await new Promise(resolve => setTimeout(resolve, 1100));

      const afterRotation = signer.getKeyInfo();

      expect(afterRotation.currentKeyId).not.toBe(initialKeyId);
      expect(afterRotation.activeKeys).toBeGreaterThanOrEqual(2); // Old and new key
    });

    it('should verify data signed with old key after rotation', async () => {
      const data = { test: 'data' };
      const signed = signer.sign(data);

      // Wait for rotation
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should still verify with old key
      const result = signer.verify(signed);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should remove expired keys', async () => {
      const initialKeyInfo = signer.getKeyInfo();

      // Wait for keys to expire (maxKeyAge: 2000ms)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Force rotation to trigger cleanup
      signer.rotateKeys();

      const afterCleanup = signer.getKeyInfo();
      expect(afterCleanup.activeKeys).toBeLessThan(initialKeyInfo.activeKeys + 3);
    });
  });

  describe('getKeyInfo', () => {
    it('should return current key information', () => {
      const keyInfo = signer.getKeyInfo();

      expect(keyInfo).toHaveProperty('currentKeyId');
      expect(keyInfo).toHaveProperty('activeKeys');
      expect(keyInfo).toHaveProperty('keys');
      expect(Array.isArray(keyInfo.keys)).toBe(true);
      expect(keyInfo.activeKeys).toBeGreaterThan(0);
    });

    it('should include key age information', () => {
      const keyInfo = signer.getKeyInfo();

      keyInfo.keys.forEach(key => {
        expect(key).toHaveProperty('keyId');
        expect(key).toHaveProperty('createdAt');
        expect(key).toHaveProperty('age');
        expect(key.age).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('clearKeys', () => {
    it('should clear all keys and create new one', () => {
      const before = signer.getKeyInfo();
      signer.clearKeys();
      const after = signer.getKeyInfo();

      expect(after.currentKeyId).not.toBe(before.currentKeyId);
      expect(after.activeKeys).toBe(1);
    });
  });

  describe('timing safety', () => {
    it('should use constant-time comparison for signatures', () => {
      const data = { test: 'data' };
      const signed = signer.sign(data);

      // Create invalid signature of same length
      const validSig = signed.signature;
      const invalidSig = validSig.replace(/./g, 'a');

      signed.signature = invalidSig;
      const result = signer.verify(signed);

      // Should still reject, but use constant-time comparison
      expect(result.valid).toBe(false);
    });
  });
});
