// libp2p node configuration and creation
import { createLibp2p } from 'libp2p';
import { webRTC } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import * as filters from '@libp2p/websockets/filters';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { gossipsub } from '@libp2p/gossipsub';
import { kadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { DEFAULT_CONFIG } from '../config.js';

export async function createNode(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const node = await createLibp2p({
    addresses: {
      listen: ['/webrtc']
    },
    transports: [
      webRTC(),
      webSockets({ filter: filters.all }),
      circuitRelayTransport({
        discoverRelays: 1,
        reservationConcurrency: 1
      })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: cfg.bootstrap || []
      })
    ],
    services: {
      identify: identify(),
      pubsub: gossipsub({
        emitSelf: false,
        gossipIncoming: true,
        ...cfg.gossipsub
      }),
      dht: kadDHT({
        clientMode: true,
        protocol: '/konomi/kad/1.0.0'
      })
    },
    connectionManager: cfg.connectionManager || {
      minConnections: 5,
      maxConnections: 50
    }
  });

  return node;
}

export class KonomiNode {
  constructor(libp2pNode, identity) {
    this.node = libp2pNode;
    this.identity = identity;
    this.rooms = new Map();
    this.handlers = new Map();
  }

  get peerId() {
    return this.node.peerId;
  }

  get pubsub() {
    return this.node.services.pubsub;
  }

  get dht() {
    return this.node.services.dht;
  }

  async start() {
    await this.node.start();
    console.log(`🌐 Konomi P2P node started: ${this.peerId.toString()}`);

    // Set up discovery announcements
    this.startDiscovery();
  }

  async stop() {
    await this.node.stop();
    console.log('🌐 Konomi P2P node stopped');
  }

  startDiscovery() {
    const topic = 'konomi:discovery:v1';

    // Subscribe to discovery topic
    this.pubsub.subscribe(topic);

    // Announce ourselves
    const announce = () => {
      const announcement = {
        peerId: this.peerId.toString(),
        addrs: this.node.getMultiaddrs().map(ma => ma.toString()),
        rooms: Array.from(this.rooms.keys()),
        ts: Date.now()
      };

      this.pubsub.publish(topic, new TextEncoder().encode(JSON.stringify(announcement)));
    };

    // Announce every 30 seconds
    this.discoveryInterval = setInterval(announce, 30000);
    announce(); // Announce immediately

    // Listen for announcements
    this.pubsub.addEventListener('message', (evt) => {
      if (evt.detail.topic === topic) {
        try {
          const data = JSON.parse(new TextDecoder().decode(evt.detail.data));
          console.log('📡 Discovered peer:', data.peerId);
        } catch (err) {
          console.error('Failed to parse discovery message:', err);
        }
      }
    });
  }

  stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  subscribe(topic, handler) {
    this.pubsub.subscribe(topic);
    this.handlers.set(topic, handler);

    this.pubsub.addEventListener('message', (evt) => {
      if (evt.detail.topic === topic) {
        const handler = this.handlers.get(topic);
        if (handler) {
          handler(evt.detail);
        }
      }
    });
  }

  unsubscribe(topic) {
    this.pubsub.unsubscribe(topic);
    this.handlers.delete(topic);
  }

  async publish(topic, data) {
    const bytes = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;

    await this.pubsub.publish(topic, bytes);
  }

  getPeers(topic) {
    return Array.from(this.pubsub.getSubscribers(topic) || [])
      .map(pid => pid.toString());
  }

  getConnectionCount() {
    return this.node.getConnections().length;
  }

  getMultiaddrs() {
    return this.node.getMultiaddrs().map(ma => ma.toString());
  }
}
