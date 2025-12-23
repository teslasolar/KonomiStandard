// Identity management - keypair generation and storage
import nacl from 'tweetnacl';
import { openDB } from 'idb';
import { fromString, toString } from 'uint8arrays';

export class Identity {
  constructor(keypair, created = Date.now()) {
    this.keypair = keypair;
    this.created = created;
  }

  get publicKey() {
    return this.keypair.publicKey;
  }

  get secretKey() {
    return this.keypair.secretKey;
  }

  get id() {
    // PeerId is base58(sha256(pubkey))
    return toString(this.publicKey, 'base58btc');
  }

  static async generate() {
    const keypair = nacl.sign.keyPair();
    return new Identity(keypair);
  }

  static async load() {
    const db = await openDB('konomi-p2p', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'id' });
        }
      }
    });

    const stored = await db.get('identity', 'self');

    if (stored) {
      const keypair = {
        publicKey: new Uint8Array(stored.publicKey),
        secretKey: new Uint8Array(stored.secretKey)
      };
      return new Identity(keypair, stored.created);
    }

    return null;
  }

  async save() {
    const db = await openDB('konomi-p2p', 1);

    await db.put('identity', {
      id: 'self',
      publicKey: Array.from(this.publicKey),
      secretKey: Array.from(this.secretKey),
      created: this.created
    });
  }

  static async getOrCreate() {
    let identity = await Identity.load();

    if (!identity) {
      identity = await Identity.generate();
      await identity.save();
    }

    return identity;
  }

  sign(message) {
    const msgUint8 = typeof message === 'string'
      ? fromString(message, 'utf8')
      : message;

    return nacl.sign.detached(msgUint8, this.secretKey);
  }

  static verify(message, signature, publicKey) {
    const msgUint8 = typeof message === 'string'
      ? fromString(message, 'utf8')
      : message;

    return nacl.sign.detached.verify(msgUint8, signature, publicKey);
  }

  deriveSharedSecret(theirPublicKey) {
    // Convert ed25519 to curve25519 for key exchange
    const ourX25519Secret = nacl.box.keyPair.fromSecretKey(
      this.secretKey.slice(0, 32)
    );

    return nacl.scalarMult(ourX25519Secret.secretKey, theirPublicKey);
  }

  toJSON() {
    return {
      id: this.id,
      created: this.created
    };
  }
}
