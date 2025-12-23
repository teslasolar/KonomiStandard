// Cryptography utilities using TweetNaCl
import nacl from 'tweetnacl';
import { fromString, toString } from 'uint8arrays';

export class Crypto {
  /**
   * Generate a new keypair for signing
   */
  static generateKeyPair() {
    return nacl.sign.keyPair();
  }

  /**
   * Sign a message
   */
  static sign(message, secretKey) {
    const msgBytes = typeof message === 'string'
      ? fromString(message, 'utf8')
      : message;

    return nacl.sign.detached(msgBytes, secretKey);
  }

  /**
   * Verify a signature
   */
  static verify(message, signature, publicKey) {
    const msgBytes = typeof message === 'string'
      ? fromString(message, 'utf8')
      : message;

    return nacl.sign.detached.verify(msgBytes, signature, publicKey);
  }

  /**
   * Derive shared secret from keypairs (ECDH)
   */
  static deriveSharedSecret(myPrivateKey, theirPublicKey) {
    return nacl.scalarMult(myPrivateKey, theirPublicKey);
  }

  /**
   * Encrypt data with shared secret
   */
  static encrypt(data, sharedSecret) {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const dataBytes = typeof data === 'string'
      ? fromString(data, 'utf8')
      : data;

    const ciphertext = nacl.secretbox(dataBytes, nonce, sharedSecret);

    // Return combined nonce + ciphertext
    const encrypted = new Uint8Array(nonce.length + ciphertext.length);
    encrypted.set(nonce);
    encrypted.set(ciphertext, nonce.length);

    return encrypted;
  }

  /**
   * Decrypt data with shared secret
   */
  static decrypt(encrypted, sharedSecret) {
    const nonce = encrypted.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = encrypted.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(ciphertext, nonce, sharedSecret);

    if (!decrypted) {
      throw new Error('Decryption failed');
    }

    return decrypted;
  }

  /**
   * Generate random bytes
   */
  static randomBytes(length) {
    return nacl.randomBytes(length);
  }

  /**
   * Hash data (using SHA-512 via sign)
   */
  static async hash(data) {
    const dataBytes = typeof data === 'string'
      ? fromString(data, 'utf8')
      : data;

    // Use SubtleCrypto for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Encode bytes to base58
   */
  static toBase58(bytes) {
    return toString(bytes, 'base58btc');
  }

  /**
   * Decode base58 to bytes
   */
  static fromBase58(str) {
    return fromString(str, 'base58btc');
  }
}
