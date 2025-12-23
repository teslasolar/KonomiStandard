// Default configuration for Konomi P2P

export const BOOTSTRAP_PEERS = [
  '/dns4/relay1.konomi.network/tcp/443/wss/p2p/QmBootstrap1',
  '/dns4/relay2.konomi.network/tcp/443/wss/p2p/QmBootstrap2'
];

export const GOSSIPSUB_CONFIG = {
  D: 6,           // target peers per topic
  D_lo: 4,        // minimum
  D_hi: 12,       // maximum
  heartbeat: 1000, // ms
  fanout_ttl: 60000,
  mcache_len: 5,
  mcache_gossip: 3
};

export const CONNECTION_MANAGER_CONFIG = {
  minConnections: 5,
  maxConnections: 50,
  autoDialInterval: 10000
};

export const INDEXEDDB_CONFIG = {
  dbName: 'konomi-p2p',
  version: 1,
  stores: {
    identity: 'id',
    peers: 'id',
    rooms: 'id',
    messages: 'id',
    blobs: 'hash'
  }
};

export const CACHE_LIMITS = {
  maxSize: 50 * 1024 * 1024, // 50MB
  evictionPolicy: 'LRU'
};

export const AWARENESS_CONFIG = {
  timeout: 60000,      // 60s
  heartbeat: 30000     // 30s
};

export const DEFAULT_CONFIG = {
  bootstrap: BOOTSTRAP_PEERS,
  gossipsub: GOSSIPSUB_CONFIG,
  connectionManager: CONNECTION_MANAGER_CONFIG,
  indexedDB: INDEXEDDB_CONFIG,
  cache: CACHE_LIMITS,
  awareness: AWARENESS_CONFIG
};
