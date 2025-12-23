// IndexedDB storage wrapper
import { openDB } from 'idb';

export class Store {
  constructor(dbName = 'konomi-p2p', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Identity store
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'id' });
        }

        // Peers store
        if (!db.objectStoreNames.contains('peers')) {
          const peerStore = db.createObjectStore('peers', { keyPath: 'id' });
          peerStore.createIndex('trusted', 'trusted');
          peerStore.createIndex('blocked', 'blocked');
        }

        // Rooms store
        if (!db.objectStoreNames.contains('rooms')) {
          const roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
          roomStore.createIndex('lastSync', 'lastSync');
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('room', 'room');
          msgStore.createIndex('timestamp', 'ts');
          msgStore.createIndex('delivered', 'delivered');
        }

        // Blobs store
        if (!db.objectStoreNames.contains('blobs')) {
          const blobStore = db.createObjectStore('blobs', { keyPath: 'hash' });
          blobStore.createIndex('refs', 'refs');
          blobStore.createIndex('pinned', 'pinned');
        }
      }
    });

    return this;
  }

  // Identity operations
  async getIdentity() {
    return await this.db.get('identity', 'self');
  }

  async setIdentity(identity) {
    return await this.db.put('identity', { id: 'self', ...identity });
  }

  // Peer operations
  async getPeer(peerId) {
    return await this.db.get('peers', peerId);
  }

  async setPeer(peerInfo) {
    return await this.db.put('peers', peerInfo);
  }

  async getAllPeers() {
    return await this.db.getAll('peers');
  }

  async getTrustedPeers() {
    const index = this.db.transaction('peers').store.index('trusted');
    return await index.getAll(IDBKeyRange.only(true));
  }

  // Room operations
  async getRoom(roomId) {
    return await this.db.get('rooms', roomId);
  }

  async setRoom(room) {
    return await this.db.put('rooms', room);
  }

  async getAllRooms() {
    return await this.db.getAll('rooms');
  }

  async deleteRoom(roomId) {
    return await this.db.delete('rooms', roomId);
  }

  // Message operations
  async getMessage(messageId) {
    return await this.db.get('messages', messageId);
  }

  async addMessage(message) {
    return await this.db.put('messages', message);
  }

  async getMessagesForRoom(roomId, limit = 100) {
    const index = this.db.transaction('messages').store.index('room');
    const messages = await index.getAll(IDBKeyRange.only(roomId));
    return messages.slice(-limit); // Return last N messages
  }

  async deleteMessage(messageId) {
    return await this.db.delete('messages', messageId);
  }

  // Blob operations
  async getBlob(hash) {
    return await this.db.get('blobs', hash);
  }

  async setBlob(hash, data, pinned = false) {
    return await this.db.put('blobs', {
      hash,
      data,
      refs: 1,
      pinned,
      created: Date.now()
    });
  }

  async deleteBlob(hash) {
    return await this.db.delete('blobs', hash);
  }

  async incrementBlobRefs(hash) {
    const blob = await this.getBlob(hash);
    if (blob) {
      blob.refs++;
      await this.db.put('blobs', blob);
    }
  }

  async decrementBlobRefs(hash) {
    const blob = await this.getBlob(hash);
    if (blob) {
      blob.refs--;
      if (blob.refs <= 0 && !blob.pinned) {
        await this.deleteBlob(hash);
      } else {
        await this.db.put('blobs', blob);
      }
    }
  }

  // Cache management
  async getCacheSize() {
    const blobs = await this.db.getAll('blobs');
    return blobs.reduce((total, blob) => total + blob.data.byteLength, 0);
  }

  async evictCache(maxSize = 50 * 1024 * 1024) {
    const size = await this.getCacheSize();

    if (size > maxSize) {
      // Get unpinned blobs sorted by refs (LRU)
      const blobs = await this.db.getAll('blobs');
      const unpinned = blobs
        .filter(b => !b.pinned)
        .sort((a, b) => a.refs - b.refs);

      let freed = 0;
      for (const blob of unpinned) {
        if (size - freed <= maxSize) break;
        freed += blob.data.byteLength;
        await this.deleteBlob(blob.hash);
      }
    }
  }

  async clear() {
    const stores = ['identity', 'peers', 'rooms', 'messages', 'blobs'];
    for (const store of stores) {
      await this.db.clear(store);
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
