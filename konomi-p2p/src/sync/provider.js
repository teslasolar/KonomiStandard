// Yjs ↔ libp2p provider bridge
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export class KonomiP2PProvider {
  constructor(doc, roomId, node) {
    this.doc = doc;
    this.room = roomId;
    this.topic = `konomi:room:${roomId}`;
    this.node = node;
    this.awareness = new Awareness(doc);
    this.synced = false;

    // Subscribe to room topic
    this.node.subscribe(this.topic, this._onMessage.bind(this));

    // Handle local document updates
    this.doc.on('update', this._onLocalUpdate.bind(this));

    // Handle awareness updates
    this.awareness.on('update', this._onAwarenessUpdate.bind(this));

    // Request initial sync
    this._requestSync();

    console.log(`📄 Yjs provider connected to room: ${roomId}`);
  }

  _onMessage(evt) {
    try {
      const decoder = decoding.createDecoder(evt.data);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC:
          this._handleSyncMessage(decoder, evt.from);
          break;
        case MESSAGE_AWARENESS:
          this._handleAwarenessMessage(decoder);
          break;
        default:
          console.warn('Unknown message type:', messageType);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  }

  _handleSyncMessage(decoder, from) {
    const syncMessageType = decoding.readVarUint(decoder);

    switch (syncMessageType) {
      case 0: // Sync step 1: request
        {
          const stateVector = decoding.readVarUint8Array(decoder);
          const update = Y.encodeStateAsUpdate(this.doc, stateVector);
          this._sendSyncStep2(update);
        }
        break;
      case 1: // Sync step 2: response
        {
          const update = decoding.readVarUint8Array(decoder);
          Y.applyUpdate(this.doc, update, this);
          if (!this.synced) {
            this.synced = true;
            this.emit('synced');
          }
        }
        break;
      case 2: // Regular update
        {
          const update = decoding.readVarUint8Array(decoder);
          Y.applyUpdate(this.doc, update, this);
        }
        break;
    }
  }

  _handleAwarenessMessage(decoder) {
    const update = decoding.readVarUint8Array(decoder);
    Awareness.applyAwarenessUpdate(this.awareness, update, this);
  }

  _onLocalUpdate(update, origin) {
    if (origin !== this) {
      this._broadcastUpdate(update);
    }
  }

  _onAwarenessUpdate({ added, updated, removed }) {
    const changedClients = [...added, ...updated, ...removed];
    const update = Awareness.encodeAwarenessUpdate(this.awareness, changedClients);
    this._broadcastAwareness(update);
  }

  _requestSync() {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    encoding.writeVarUint(encoder, 0); // Sync step 1
    encoding.writeVarUint8Array(encoder, Y.encodeStateVector(this.doc));

    this.node.publish(this.topic, encoding.toUint8Array(encoder));
  }

  _sendSyncStep2(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    encoding.writeVarUint(encoder, 1); // Sync step 2
    encoding.writeVarUint8Array(encoder, update);

    this.node.publish(this.topic, encoding.toUint8Array(encoder));
  }

  _broadcastUpdate(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    encoding.writeVarUint(encoder, 2); // Regular update
    encoding.writeVarUint8Array(encoder, update);

    this.node.publish(this.topic, encoding.toUint8Array(encoder));
  }

  _broadcastAwareness(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, update);

    this.node.publish(this.topic, encoding.toUint8Array(encoder));
  }

  destroy() {
    this.node.unsubscribe(this.topic);
    this.awareness.destroy();
    this.doc.off('update', this._onLocalUpdate);
    console.log(`📄 Yjs provider disconnected from room: ${this.room}`);
  }

  // EventEmitter-like interface
  _events = {};

  on(event, handler) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
  }

  emit(event, ...args) {
    if (this._events[event]) {
      for (const handler of this._events[event]) {
        handler(...args);
      }
    }
  }
}
