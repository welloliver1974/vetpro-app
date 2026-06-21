import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '@/lib/crypto';

describe('crypto', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.useFakeTimers();
    global.window = {
      ...originalWindow,
      location: {
        origin: 'http://localhost:3000',
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    global.window = originalWindow;
  });

  describe('encrypt', () => {
    it('should encrypt a string and return a base64 encoded result', async () => {
      const plaintext = 'test-api-key-123';
      const result = await encrypt(plaintext);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(plaintext);
    });

    it('should return different ciphertexts for the same plaintext (due to random IV)', async () => {
      const plaintext = 'test-api-key-123';
      const result1 = await encrypt(plaintext);
      const result2 = await encrypt(plaintext);

      expect(result1).not.toBe(result2);
    });

    it('should handle empty string', async () => {
      const result = await encrypt('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle special characters', async () => {
      const plaintext = 'key-with-special-chars!@#$%^&*()';
      const result = await encrypt(plaintext);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle long strings', async () => {
      const plaintext = 'a'.repeat(1000);
      const result = await encrypt(plaintext);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('decrypt', () => {
    it('should decrypt a previously encrypted string', async () => {
      const plaintext = 'test-api-key-123';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', async () => {
      const encrypted = await encrypt('');
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle special characters', async () => {
      const plaintext = 'key-with-special-chars!@#$%^&*()';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return original ciphertext if decryption fails', async () => {
      const invalidCiphertext = 'invalid-base64!@#';
      const result = await decrypt(invalidCiphertext);

      expect(result).toBe(invalidCiphertext);
    });

    it('should return original ciphertext if tampered', async () => {
      const plaintext = 'test-key';
      const encrypted = await encrypt(plaintext);
      const tampered = encrypted.slice(0, -1) + (encrypted.slice(-1) === 'a' ? 'b' : 'a');
      const result = await decrypt(tampered);

      expect(result).toBe(tampered);
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should work correctly for multiple values', async () => {
      const testValues = [
        'short',
        'medium-length-api-key-12345',
        'very-long-api-key-with-many-characters-and-symbols!@#$%^&*()_+-=[]{}|;:,.<>?',
        '',
        '🔑emoji-key🔒',
        'key with spaces',
        'key\nwith\nnewlines',
        'key\twith\ttabs',
      ];

      for (const plaintext of testValues) {
        const encrypted = await encrypt(plaintext);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should produce valid base64 output', async () => {
      const plaintext = 'test-key';
      const encrypted = await encrypt(plaintext);

      expect(() => atob(encrypted)).not.toThrow();
    });
  });
});