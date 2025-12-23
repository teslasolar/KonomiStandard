# 🌐 Konomi P2P

Turn any static GitHub Pages site into a peer-to-peer collaborative application with **zero backend required**.

## Features

- ✅ **Serverless**: No central server, Firebase, or Supabase needed
- ✅ **P2P Discovery**: WebRTC, DHT, and GossipSub mesh networking
- ✅ **Real-time Sync**: CRDT-based conflict-free state synchronization
- ✅ **Offline-first**: Works offline with service worker caching
- ✅ **Encrypted**: End-to-end encryption with TweetNaCl
- ✅ **Easy Integration**: One script tag to enable P2P

## Quick Start

### Install

```bash
npm install konomi-p2p
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Collaborative App</title>
</head>
<body>
  <h1>Shared Counter</h1>
  <div id="counter">0</div>
  <button id="increment">+1</button>

  <script type="module">
    import { injectP2P } from 'konomi-p2p';

    // Initialize P2P
    const p2p = await injectP2P();

    // Get shared state
    const state = p2p.getSharedMap('app-state');

    // Initialize counter
    if (!state.has('counter')) {
      state.set('counter', 0);
    }

    // Update UI when state changes
    state.observe(() => {
      document.getElementById('counter').textContent = state.get('counter');
    });

    // Increment button
    document.getElementById('increment').addEventListener('click', () => {
      state.set('counter', (state.get('counter') || 0) + 1);
    });

    // Show invite link
    console.log('Invite others:', p2p.invite());
  </script>
</body>
</html>
```

## API Reference

### `injectP2P(config?)`

Initialize P2P capabilities in your page.

```javascript
const p2p = await injectP2P({
  bootstrap: ['...'], // Custom bootstrap peers
  // ... other config
});
```

Returns a P2P API object:

```javascript
{
  node,          // libp2p node
  doc,           // Yjs document
  provider,      // Sync provider
  roomId,        // Current room ID
  identity,      // User identity
  store,         // IndexedDB store

  // Methods
  getSharedMap(name),
  getSharedArray(name),
  getSharedText(name),
  getPeers(),
  getAwareness(),
  invite()
}
```

### Shared Data Types

#### Shared Map

```javascript
const map = p2p.getSharedMap('my-map');

map.set('key', 'value');
map.get('key');
map.delete('key');
map.has('key');

map.observe((event) => {
  // React to changes
});
```

#### Shared Array

```javascript
const array = p2p.getSharedArray('my-array');

array.push(['item']);
array.get(0);
array.delete(0, 1);
array.length;

array.observe((event) => {
  // React to changes
});
```

#### Shared Text

```javascript
const text = p2p.getSharedText('my-text');

text.insert(0, 'Hello');
text.delete(0, 5);
text.toString();

text.observe((event) => {
  // React to changes
});
```

### Adapters

Pre-built adapters for common use cases:

#### LocalStorage Bridge

```javascript
import { bridgeLocalStorage } from 'konomi-p2p';

const map = bridgeLocalStorage(p2p.doc);

// Now localStorage syncs across all peers!
localStorage.setItem('key', 'value');
```

#### Form Bridge

```javascript
import { bridgeForm } from 'konomi-p2p';

const formState = bridgeForm(p2p.doc, 'my-form-id');

// Form inputs sync in real-time across peers
```

#### Canvas Bridge

```javascript
import { bridgeCanvas } from 'konomi-p2p';

const strokes = bridgeCanvas(p2p.doc, 'my-canvas-id');

// Collaborative drawing!
```

## Architecture

```
Application Layer
    ↓
CRDT Sync (Yjs)
    ↓
PubSub (GossipSub)
    ↓
Multiplexing (Yamux)
    ↓
Encryption (Noise)
    ↓
Transport (WebRTC/WebSocket)
    ↓
Discovery (DHT/Bootstrap)
```

## Examples

See the `examples/` directory for complete examples:

- **Chat**: Real-time P2P chat
- **Whiteboard**: Collaborative drawing
- **Wiki**: Collaborative document editing

## Configuration

```javascript
const p2p = await injectP2P({
  bootstrap: [
    '/dns4/relay.example.com/tcp/443/wss/p2p/QmPeer'
  ],
  gossipsub: {
    D: 6,           // Target peers per topic
    D_lo: 4,        // Min peers
    D_hi: 12        // Max peers
  },
  connectionManager: {
    minConnections: 5,
    maxConnections: 50
  }
});
```

## How It Works

1. **Discovery**: Peers find each other via DHT and bootstrap nodes
2. **Connection**: WebRTC direct connections (with relay fallback)
3. **Sync**: Yjs CRDT ensures conflict-free state merging
4. **Awareness**: Track online peers and their state
5. **Persistence**: IndexedDB stores data offline

## Browser Support

- ✅ Chrome 89+
- ✅ Firefox 88+
- ✅ Safari 15.4+
- ✅ Edge 89+

## License

MIT

## 📐

Part of the Konomi Standard ecosystem.
