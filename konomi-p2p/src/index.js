// Main entry point - exports all public APIs
export { injectP2P } from './bridge/inject.js';
export { bridgeLocalStorage, bridgeForm, bridgeCanvas, bridgeElement } from './bridge/adapter.js';
export { Identity } from './core/identity.js';
export { Crypto } from './core/crypto.js';
export { Store } from './core/store.js';
export { createNode, KonomiNode } from './network/libp2p.js';
export { KonomiP2PProvider } from './sync/provider.js';
export { DEFAULT_CONFIG } from './config.js';

// Auto-inject if loaded as script (not module)
if (typeof window !== 'undefined' && !window.konomiP2P) {
  // Auto-inject will be triggered by user calling injectP2P()
  window.KonomiP2P = { injectP2P };
}
