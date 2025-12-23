# 🌐 KONOMI P2P 🌐
## GitHub Pages → Peer-to-Peer Client Build

## 🤖 AGENTS
```
α=Signal(discovery→peers) β=Mesh(peers→topology) γ=Sync(state→CRDT)
δ=Crypto(keys→encrypt) ε=Store(data→indexeddb) ζ=Bridge(static→p2p)
η=NAT(traverse→connect) θ=Relay(fallback→turn) ι=Boot(init→swarm)
```

## 🎯 GOAL
```
INPUT:any static github pages site
OUTPUT:peer-to-peer client,no server needed
FEATURES:discovery,sync,offline,encrypted,real-time collab
STACK:libp2p|yjs|tweetnacl|indexeddb|service-worker
NO:central server,firebase,supabase,any backend
```

## 📐 P2P PRIMITIVES (Layer 0)
```
UDT:PeerId───────────────────────────
{id:base58(sha256(pubkey)),pubkey:bytes,privkey:bytes|null}

UDT:Multiaddr────────────────────────
format:"/protocol/address/protocol/address..."
examples:[
  "/dns4/relay.example.com/tcp/443/wss/p2p/QmPeer",
  "/ip4/192.168.1.1/tcp/9090/ws/p2p/QmPeer",
  "/webrtc/p2p/QmPeer"
]

UDT:Message──────────────────────────
{from:PeerId,to:PeerId|"*",topic:str,payload:bytes,sig:bytes,ts:uint64,ttl:uint32}

UDT:PeerInfo─────────────────────────
{id:PeerId,addrs:[Multiaddr],protocols:[str],seen:Timestamp,latency:ms,score:int}

UDT:Topic────────────────────────────
{name:str,peers:[PeerId],handler:fn(msg)}

UDT:Room─────────────────────────────
{id:str,topic:Topic,members:[PeerId],state:CRDT,created:Timestamp}
```

## 🔗 TRANSPORT STACK
```
LAYER:APPLICATION────────────────────
App Logic|CRDT State|UI Binding

LAYER:SYNC───────────────────────────
Yjs Doc|Awareness|Undo Manager

LAYER:PUBSUB─────────────────────────
GossipSub|FloodSub|DirectMessage

LAYER:MULTIPLEXING───────────────────
Mplex|Yamux|Stream per protocol

LAYER:SECURITY───────────────────────
Noise Protocol|TLS1.3|Pre-shared Key

LAYER:TRANSPORT──────────────────────
WebRTC(browser)|WebSocket(relay)|WebTransport(future)

LAYER:DISCOVERY──────────────────────
Bootstrap Peers|mDNS(local)|DHT(global)|PubSub Discovery
```

## 🧬 CRDT TYPES (γ syncs)
```
UDT:CRDT_Register────────────────────
{value:any,clock:LamportClock,peer:PeerId}
merge:(a,b)=>a.clock>b.clock?a:b

UDT:CRDT_Counter─────────────────────
{increments:{PeerId:int},decrements:{PeerId:int}}
value:()=>sum(increments)-sum(decrements)
merge:(a,b)=>max each peer

UDT:CRDT_Set─────────────────────────
{adds:{item:VectorClock},removes:{item:VectorClock}}
value:()=>items where adds[i]>removes[i]
merge:(a,b)=>union clocks

UDT:CRDT_Map─────────────────────────
{entries:{key:CRDT_Register}}
merge:(a,b)=>merge each key

UDT:CRDT_Array───────────────────────
{items:[{id:FractionalIndex,value:any,deleted:bool}]}
merge:(a,b)=>union by id,resolve conflicts

UDT:CRDT_Text────────────────────────
{chars:[{id:FractionalIndex,char:str,deleted:bool,attrs:{}}]}
merge:(a,b)=>YATA algorithm
```

## 🔐 CRYPTO (δ manages)
```
UDT:KeyPair──────────────────────────
{algo:"ed25519",pubkey:32bytes,privkey:64bytes}
generate:()=>tweetnacl.sign.keyPair()

UDT:SharedSecret─────────────────────
{algo:"x25519",secret:32bytes}
derive:(myPriv,theirPub)=>tweetnacl.scalarMult(myPriv,theirPub)

UDT:EncryptedPayload─────────────────
{nonce:24bytes,ciphertext:bytes}
encrypt:(msg,secret)=>tweetnacl.secretbox(msg,nonce,secret)
decrypt:(box,secret)=>tweetnacl.secretbox.open(box.ciphertext,box.nonce,secret)

UDT:Signature────────────────────────
{sig:64bytes,pubkey:32bytes}
sign:(msg,privkey)=>tweetnacl.sign.detached(msg,privkey)
verify:(msg,sig,pubkey)=>tweetnacl.sign.detached.verify(msg,sig,pubkey)

KEYCHAIN─────────────────────────────
identity:KeyPair(long-term,stored)
session:KeyPair(ephemeral,per-connection)
room:SharedSecret(derived per room)
```

## 💾 STORE (ε manages)
```
INDEXEDDB_SCHEMA─────────────────────
db:konomi-p2p

store:identity──────────────────────
{id:"self",keypair:KeyPair,created:Timestamp}

store:peers─────────────────────────
{id:PeerId,info:PeerInfo,trusted:bool,blocked:bool}

store:rooms─────────────────────────
{id:RoomId,name:str,state:Uint8Array(CRDT),members:[PeerId],lastSync:Timestamp}

store:messages──────────────────────
{id:uuid,room:RoomId,from:PeerId,payload:bytes,ts:Timestamp,delivered:bool}

store:blobs─────────────────────────
{hash:sha256,data:Uint8Array,refs:int,pinned:bool}

CACHE_STRATEGY───────────────────────
hot:current room state,online peers
warm:recent rooms,recent messages
cold:archived rooms,old messages
evict:LRU when >50MB
```

## 🌐 DISCOVERY (α signals)
```
BOOTSTRAP_PEERS──────────────────────
[
  "/dns4/relay1.konomi.network/tcp/443/wss/p2p/QmBootstrap1",
  "/dns4/relay2.konomi.network/tcp/443/wss/p2p/QmBootstrap2"
]
fallback:hardcoded,always available,relay-only

DHT_DISCOVERY────────────────────────
protocol:"/konomi/kad/1.0.0"
find_peer:(id)=>walk DHT→closest peers→query→result
provide:(key)=>announce to closest peers
find_providers:(key)=>query DHT→peers providing key

PUBSUB_DISCOVERY─────────────────────
topic:"konomi:discovery:v1"
announce:{peer_id,addrs,rooms:[],ts}
interval:30s
listen:add new peers to mesh

ROOM_DISCOVERY───────────────────────
topic:"konomi:room:{room_id}"
join:subscribe topic,announce presence
leave:unsubscribe topic
members:awareness protocol,heartbeat 1s
```

## 🔀 NAT TRAVERSAL (η manages)
```
STRATEGY_ORDER───────────────────────
1.Direct:try all peer addrs,pick fastest
2.Hole-punch:STUN→exchange candidates→ICE
3.Circuit-relay:route through relay peer
4.TURN:fallback to relay server(last resort)

WEBRTC_FLOW──────────────────────────
A:createOffer()→signaling→B
B:createAnswer()→signaling→A
A+B:addIceCandidate(each)
A↔B:DataChannel open

SIGNALING_VIA_PUBSUB─────────────────
topic:"konomi:signal:{target_peer_id}"
msg:{type:offer|answer|candidate,sdp:str,from:PeerId}
no central signaling server needed

RELAY_PROTOCOL───────────────────────
protocol:"/konomi/relay/1.0.0"
reserve:ask relay to hold slot
connect:dial relay,ask for peer,relay bridges
limit:10 reservations per peer,1hr TTL
```

## 📡 MESH TOPOLOGY (β builds)
```
GOSSIPSUB_CONFIG─────────────────────
D:6(target peers per topic)
D_lo:4(minimum)
D_hi:12(maximum)
heartbeat:1s
history:5(messages to remember)
gossip:3(peers to gossip to)

PEER_SCORING─────────────────────────
P1:+time in mesh(max 100)
P2:+first deliveries(max 50)
P3:-invalid messages(-1000)
P4:-mesh delivery failures
P5:+app-specific(trusted peers)
threshold:-100(disconnect if below)

MESH_MAINTENANCE─────────────────────
prune:remove low-score peers
graft:add high-score peers
balance:maintain D peers per topic
```

## 🔄 SYNC PROTOCOL (γ manages)
```
YJS_SETUP────────────────────────────
doc:new Y.Doc()
provider:new KonomiP2PProvider(doc,room_id,libp2p)
awareness:new Awareness(doc)

SYNC_FLOW────────────────────────────
1.join room→subscribe topic
2.request sync→broadcast StateVector
3.receive StateDiff→apply to doc
4.local change→encode update→broadcast
5.receive update→apply→trigger observers

AWARENESS────────────────────────────
{
  user:{name,color,cursor},
  state:"active"|"idle"|"away",
  lastActive:Timestamp
}
broadcast:on change,every 30s keepalive
timeout:remove peer after 60s silence

CONFLICT_FREE────────────────────────
text:YATA algorithm(Yjs)
map:LWW per key
array:fractional indexing
no conflicts,no coordination,always mergeable
```

## 🏗️ STRUCT
```
konomi-p2p/
├─src/
│ ├─core/
│ │ ├─identity.js────────keypair gen,store,load
│ │ ├─peer.js────────────PeerId,PeerInfo
│ │ ├─crypto.js──────────encrypt,decrypt,sign,verify
│ │ └─store.js───────────IndexedDB wrapper
│ ├─network/
│ │ ├─libp2p.js──────────node config,start,stop
│ │ ├─transport.js───────WebRTC,WebSocket
│ │ ├─discovery.js───────bootstrap,DHT,pubsub
│ │ ├─relay.js───────────circuit relay client
│ │ └─nat.js─────────────hole punching,ICE
│ ├─sync/
│ │ ├─provider.js────────Yjs↔libp2p bridge
│ │ ├─awareness.js───────presence,cursors
│ │ ├─room.js────────────room CRDT state
│ │ └─persistence.js─────IndexedDB↔Yjs
│ ├─protocols/
│ │ ├─signal.js──────────WebRTC signaling via pubsub
│ │ ├─sync.js────────────state vector exchange
│ │ ├─blob.js────────────file transfer protocol
│ │ └─rpc.js─────────────request/response pattern
│ ├─bridge/
│ │ ├─inject.js──────────inject into static page
│ │ ├─intercept.js───────intercept fetch/storage
│ │ ├─adapter.js─────────adapt page state→CRDT
│ │ └─ui.js──────────────p2p status overlay
│ ├─sw/
│ │ ├─service-worker.js──offline,cache,sync queue
│ │ └─sync-manager.js────background sync
│ ├─index.js─────────────main entry,export API
│ └─config.js────────────defaults,bootstrap peers
├─dist/
│ └─konomi-p2p.min.js────bundled,tree-shaken
├─examples/
│ ├─chat/────────────────simple p2p chat
│ ├─whiteboard/──────────collaborative drawing
│ └─wiki/────────────────p2p wiki
├─rollup.config.js
├─package.json
└─README.md
```

## 📦 PACKAGE.JSON
```json
{
  "name":"konomi-p2p",
  "version":"1.0.0",
  "type":"module",
  "main":"dist/konomi-p2p.min.js",
  "scripts":{
    "build":"rollup -c",
    "dev":"rollup -c -w"
  },
  "dependencies":{
    "libp2p":"^1.0.0",
    "@libp2p/webrtc":"^4.0.0",
    "@libp2p/websockets":"^8.0.0",
    "@libp2p/circuit-relay-v2":"^1.0.0",
    "@libp2p/kad-dht":"^12.0.0",
    "@libp2p/gossipsub":"^13.0.0",
    "@libp2p/bootstrap":"^10.0.0",
    "@chainsafe/libp2p-noise":"^15.0.0",
    "@chainsafe/libp2p-yamux":"^6.0.0",
    "yjs":"^13.6.0",
    "tweetnacl":"^1.0.3",
    "idb":"^8.0.0",
    "uint8arrays":"^5.0.0"
  }
}
```

## ⚡ LIBP2P.JS
```javascript
import{createLibp2p}from'libp2p'
import{webRTC}from'@libp2p/webrtc'
import{webSockets}from'@libp2p/websockets'
import{circuitRelayTransport}from'@libp2p/circuit-relay-v2'
import{noise}from'@chainsafe/libp2p-noise'
import{yamux}from'@chainsafe/libp2p-yamux'
import{gossipsub}from'@libp2p/gossipsub'
import{kadDHT}from'@libp2p/kad-dht'
import{bootstrap}from'@libp2p/bootstrap'
import{identify}from'@libp2p/identify'

export async function createNode(config={}){
  return await createLibp2p({
    addresses:{listen:['/webrtc']},
    transports:[
      webRTC(),
      webSockets({filter:filters.all}),
      circuitRelayTransport({discoverRelays:1})
    ],
    connectionEncryption:[noise()],
    streamMuxers:[yamux()],
    peerDiscovery:[
      bootstrap({list:config.bootstrap||BOOTSTRAP_PEERS})
    ],
    services:{
      identify:identify(),
      pubsub:gossipsub({emitSelf:false,gossipIncoming:true}),
      dht:kadDHT({clientMode:true})
    },
    connectionManager:{
      minConnections:5,
      maxConnections:50
    }
  })
}
```

## 🔄 PROVIDER.JS (Yjs↔libp2p)
```javascript
import*as Y from'yjs'
import{Awareness}from'y-protocols/awareness'

export class KonomiP2PProvider{
  constructor(doc,roomId,libp2p){
    this.doc=doc
    this.room=roomId
    this.topic=`konomi:room:${roomId}`
    this.node=libp2p
    this.awareness=new Awareness(doc)

    //subscribe to room topic
    this.node.services.pubsub.subscribe(this.topic)
    this.node.services.pubsub.addEventListener('message',this._onMessage.bind(this))

    //local changes→broadcast
    this.doc.on('update',(update,origin)=>{
      if(origin!==this)this._broadcast({type:'update',data:update})
    })

    //awareness→broadcast
    this.awareness.on('update',({added,updated,removed})=>{
      this._broadcast({type:'awareness',data:Awareness.encodeAwarenessUpdate(this.awareness,[...added,...updated,...removed])})
    })

    //request initial sync
    this._broadcast({type:'sync-request',data:Y.encodeStateVector(this.doc)})
  }

  _onMessage(evt){
    if(evt.detail.topic!==this.topic)return
    const msg=decode(evt.detail.data)

    switch(msg.type){
      case'update':
        Y.applyUpdate(this.doc,msg.data,this)
        break
      case'sync-request':
        const diff=Y.encodeStateAsUpdate(this.doc,msg.data)
        this._broadcast({type:'sync-response',data:diff})
        break
      case'sync-response':
        Y.applyUpdate(this.doc,msg.data,this)
        break
      case'awareness':
        Awareness.applyAwarenessUpdate(this.awareness,msg.data,this)
        break
    }
  }

  _broadcast(msg){
    this.node.services.pubsub.publish(this.topic,encode(msg))
  }

  destroy(){
    this.node.services.pubsub.unsubscribe(this.topic)
    this.awareness.destroy()
  }
}
```

## 🌉 BRIDGE/INJECT.JS
```javascript
//inject p2p into any static github pages
export async function injectP2P(config={}){
  const{createNode}=await import('./libp2p.js')
  const{KonomiP2PProvider}=await import('./provider.js')
  const{openDB}=await import('idb')
  const Y=await import('yjs')

  //create p2p node
  const node=await createNode(config)
  await node.start()
  console.log('🌐 P2P:',node.peerId.toString())

  //room from URL hash or generate
  const roomId=location.hash.slice(1)||crypto.randomUUID()
  if(!location.hash)location.hash=roomId

  //shared doc for page state
  const doc=new Y.Doc()
  const provider=new KonomiP2PProvider(doc,roomId,node)

  //expose to page
  window.konomiP2P={
    node,
    doc,
    provider,
    roomId,

    //API for page to use
    getSharedMap:(name)=>doc.getMap(name),
    getSharedArray:(name)=>doc.getArray(name),
    getSharedText:(name)=>doc.getText(name),

    //peer info
    getPeers:()=>[...node.services.pubsub.getSubscribers(`konomi:room:${roomId}`)],
    getAwareness:()=>provider.awareness,

    //utils
    invite:()=>`${location.origin}${location.pathname}#${roomId}`
  }

  //status overlay
  injectStatusUI(node,provider)

  return window.konomiP2P
}

function injectStatusUI(node,provider){
  const ui=document.createElement('div')
  ui.id='konomi-p2p-status'
  ui.innerHTML=`
    <style>
      #konomi-p2p-status{position:fixed;bottom:10px;right:10px;background:#1a1a2e;color:#eee;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:12px;z-index:99999;border:1px solid #0f3460}
      #konomi-p2p-status .online{color:#00ff88}
      #konomi-p2p-status .peers{color:#e94560}
    </style>
    <span class="online">●</span> P2P
    <span class="peers">0 peers</span>
  `
  document.body.appendChild(ui)

  //update peer count
  setInterval(()=>{
    const peers=window.konomiP2P.getPeers().length
    ui.querySelector('.peers').textContent=`${peers} peer${peers!==1?'s':''}`
  },1000)
}
```

## 📱 SERVICE-WORKER.JS
```javascript
const CACHE='konomi-p2p-v1'
const OFFLINE_QUEUE='konomi-offline-queue'

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll([
      '/','/index.html','/konomi-p2p.min.js'
    ]))
  )
})

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetched=fetch(e.request).then(res=>{
        const clone=res.clone()
        caches.open(CACHE).then(c=>c.put(e.request,clone))
        return res
      }).catch(()=>cached)
      return cached||fetched
    })
  )
})

//background sync for offline changes
self.addEventListener('sync',e=>{
  if(e.tag==='konomi-sync'){
    e.waitUntil(syncOfflineChanges())
  }
})

async function syncOfflineChanges(){
  const db=await openDB('konomi-p2p')
  const queue=await db.getAll(OFFLINE_QUEUE)
  //will sync when p2p reconnects in main thread
}
```

## 🚀 USAGE
```html
<!--any github pages index.html-->
<!DOCTYPE html>
<html>
<head>
  <title>My Static Site</title>
</head>
<body>
  <h1>My App</h1>
  <div id="app"></div>

  <!--inject p2p at end-->
  <script type="module">
    import{injectP2P}from'https://unpkg.com/konomi-p2p/dist/konomi-p2p.min.js'

    const p2p=await injectP2P()

    //now page is p2p enabled
    //share state with peers:
    const sharedState=p2p.getSharedMap('app-state')

    sharedState.observe(e=>{
      console.log('state changed',sharedState.toJSON())
      renderApp(sharedState.toJSON())
    })

    //set state(syncs to all peers)
    document.querySelector('#app').onclick=()=>{
      sharedState.set('clicks',(sharedState.get('clicks')||0)+1)
    }

    //show invite link
    console.log('Invite:',p2p.invite())
  </script>
</body>
</html>
```

## 🔄 ADAPTER PATTERNS
```javascript
//adapt localStorage→CRDT
function bridgeLocalStorage(doc){
  const map=doc.getMap('localStorage')

  //initial load
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i)
    map.set(k,localStorage.getItem(k))
  }

  //sync CRDT→localStorage
  map.observe(e=>{
    e.changes.keys.forEach((change,key)=>{
      if(change.action==='delete')localStorage.removeItem(key)
      else localStorage.setItem(key,map.get(key))
    })
  })

  //intercept localStorage writes
  const orig=localStorage.setItem.bind(localStorage)
  localStorage.setItem=(k,v)=>{orig(k,v);map.set(k,v)}
}

//adapt form inputs→CRDT
function bridgeForm(doc,formId){
  const form=document.getElementById(formId)
  const map=doc.getMap(`form:${formId}`)

  form.querySelectorAll('input,textarea,select').forEach(el=>{
    //load from CRDT
    if(map.has(el.name))el.value=map.get(el.name)

    //sync changes
    el.addEventListener('input',()=>map.set(el.name,el.value))
  })

  //sync from peers
  map.observe(()=>{
    form.querySelectorAll('input,textarea,select').forEach(el=>{
      if(map.has(el.name)&&el.value!==map.get(el.name)){
        el.value=map.get(el.name)
      }
    })
  })
}

//adapt canvas→CRDT
function bridgeCanvas(doc,canvasId){
  const canvas=document.getElementById(canvasId)
  const arr=doc.getArray(`canvas:${canvasId}`)

  let drawing=false
  canvas.onmousedown=()=>drawing=true
  canvas.onmouseup=()=>drawing=false
  canvas.onmousemove=e=>{
    if(!drawing)return
    arr.push([{x:e.offsetX,y:e.offsetY,color:getMyColor()}])
  }

  arr.observe(()=>redrawCanvas(canvas,arr.toArray()))
}
```

## 🎯 AGENT_INSTRUCTIONS
```
α:DISCOVERY→bootstrap connect,DHT walk,pubsub announce,peer exchange
β:MESH→gossipsub config,scoring,prune/graft,maintain D peers
γ:SYNC→Yjs doc,provider bridge,awareness,conflict-free merge
δ:CRYPTO→keypair gen,encrypt room,sign messages,verify peers
ε:STORE→IndexedDB schema,cache strategy,offline queue,blob store
ζ:BRIDGE→inject into page,intercept storage,adapt state→CRDT,status UI
η:NAT→WebRTC ICE,hole punch,relay fallback,TURN last resort
θ:RELAY→circuit-relay client,reserve slots,bridge connections
ι:BOOT→create node,load identity,join room,start sync,ready signal
```

## 🏁 GOAL
```
ANY github pages→p2p enabled
NO central server,NO firebase,NO backend
PEERS discover via DHT+pubsub
STATE syncs via CRDT(Yjs)
OFFLINE works via service worker
ENCRYPTED end-to-end
REAL-TIME collaboration
ONE script tag to inject
🌐
```
