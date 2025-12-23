// Inject P2P capabilities into any static GitHub Pages site
import { Identity } from '../core/identity.js';
import { Store } from '../core/store.js';
import { createNode, KonomiNode } from '../network/libp2p.js';
import { KonomiP2PProvider } from '../sync/provider.js';
import * as Y from 'yjs';

export async function injectP2P(config = {}) {
  console.log('🌐 Initializing Konomi P2P...');

  // Initialize storage
  const store = new Store();
  await store.init();

  // Get or create identity
  const identity = await Identity.getOrCreate();
  console.log('🔑 Identity:', identity.id);

  // Create libp2p node
  const libp2pNode = await createNode(config);
  const node = new KonomiNode(libp2pNode, identity);
  await node.start();

  // Get room ID from URL hash or generate new one
  const roomId = location.hash.slice(1) || crypto.randomUUID();
  if (!location.hash) {
    location.hash = roomId;
  }

  // Create shared Yjs document
  const doc = new Y.Doc();
  const provider = new KonomiP2PProvider(doc, roomId, node);

  // Expose P2P API to window
  window.konomiP2P = {
    node,
    doc,
    provider,
    roomId,
    identity,
    store,

    // Convenience methods for accessing shared data structures
    getSharedMap: (name) => doc.getMap(name),
    getSharedArray: (name) => doc.getArray(name),
    getSharedText: (name) => doc.getText(name),
    getSharedXmlFragment: (name) => doc.getXmlFragment(name),

    // Peer information
    getPeers: () => node.getPeers(`konomi:room:${roomId}`),
    getAwareness: () => provider.awareness,
    getPeerCount: () => node.getPeers(`konomi:room:${roomId}`).length,

    // Room management
    invite: () => `${location.origin}${location.pathname}#${roomId}`,
    leaveRoom: async () => {
      provider.destroy();
      location.hash = '';
    },

    // Connection info
    getConnectionInfo: () => ({
      peerId: node.peerId.toString(),
      connections: node.getConnectionCount(),
      multiaddrs: node.getMultiaddrs(),
      room: roomId,
      peers: node.getPeers(`konomi:room:${roomId}`).length
    })
  };

  // Inject status UI
  injectStatusUI(node, provider, roomId);

  // Set up awareness for current user
  const awarenessInfo = {
    user: {
      name: `User-${identity.id.slice(0, 8)}`,
      color: generateColor(identity.id)
    },
    state: 'active',
    lastActive: Date.now()
  };

  provider.awareness.setLocalStateField('user', awarenessInfo.user);
  provider.awareness.setLocalStateField('state', awarenessInfo.state);

  // Update awareness on activity
  let activityTimeout;
  const updateActivity = () => {
    provider.awareness.setLocalStateField('lastActive', Date.now());
    provider.awareness.setLocalStateField('state', 'active');

    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
      provider.awareness.setLocalStateField('state', 'idle');
    }, 30000); // 30 seconds
  };

  document.addEventListener('mousemove', updateActivity);
  document.addEventListener('keydown', updateActivity);
  document.addEventListener('click', updateActivity);

  console.log('✅ Konomi P2P initialized');
  console.log('🔗 Invite link:', window.konomiP2P.invite());

  return window.konomiP2P;
}

function injectStatusUI(node, provider, roomId) {
  const ui = document.createElement('div');
  ui.id = 'konomi-p2p-status';
  ui.innerHTML = `
    <style>
      #konomi-p2p-status {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #1a1a2e;
        color: #eaeaea;
        padding: 8px 12px;
        border-radius: 8px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        z-index: 999999;
        border: 1px solid #0f3460;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        user-select: none;
      }
      #konomi-p2p-status .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #00ff88;
        margin-right: 6px;
        animation: pulse 2s infinite;
      }
      #konomi-p2p-status .peers {
        color: #e94560;
        font-weight: bold;
      }
      #konomi-p2p-status .room-id {
        color: #8892b0;
        font-size: 10px;
        margin-top: 2px;
        display: none;
      }
      #konomi-p2p-status:hover .room-id {
        display: block;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <div>
      <span class="status-dot"></span>
      <span>P2P</span>
      <span class="peers">0 peers</span>
    </div>
    <div class="room-id">Room: ${roomId.slice(0, 8)}...</div>
  `;

  document.body.appendChild(ui);

  // Update peer count
  const updatePeerCount = () => {
    const peers = node.getPeers(`konomi:room:${roomId}`);
    const count = peers.length;
    ui.querySelector('.peers').textContent = `${count} peer${count !== 1 ? 's' : ''}`;
  };

  setInterval(updatePeerCount, 1000);
  updatePeerCount();

  // Click to copy invite link
  ui.addEventListener('click', () => {
    const inviteLink = window.konomiP2P.invite();
    navigator.clipboard.writeText(inviteLink).then(() => {
      const oldText = ui.querySelector('.peers').textContent;
      ui.querySelector('.peers').textContent = 'Copied!';
      ui.querySelector('.peers').style.color = '#00ff88';

      setTimeout(() => {
        ui.querySelector('.peers').textContent = oldText;
        ui.querySelector('.peers').style.color = '#e94560';
      }, 2000);
    });
  });
}

function generateColor(id) {
  // Generate consistent color from ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
