# 📐 Build Prompts Reference

This directory contains the original build prompts used to create the Konomi Standard Pages static site.

## Files

### [01-konomi-standard-pages.md](01-konomi-standard-pages.md)
**Purpose**: Technical specification for building the GitHub Pages static site

**Contents**:
- 🤖 Agent architecture (parse, build, nav, search, theme, deploy)
- 🏗️ Complete directory structure
- 📦 Package configuration
- ⚙️ Eleventy setup
- 🎨 Tailwind theme configuration
- 📄 Template structures (base, sidebar, UDT cards, state diagrams)
- 🔍 Search implementation
- 📋 Copy-to-clipboard functionality
- 🚀 GitHub Actions deployment workflow
- 🎯 Build order and commands

**Use this when**:
- Setting up the project from scratch
- Understanding the architecture
- Modifying templates or layouts
- Customizing the theme
- Troubleshooting build issues

### [02-konomi-standard-spec.md](02-konomi-standard-spec.md)
**Purpose**: Complete Konomi Standard specification

**Contents**:
- 🧬 Layer 0: Meta-standard (how standards are defined)
- 🔷 Layer 1: Base UDTs (primitives)
- 🏗️ Layer 2: ISA-95 (Enterprise-Control Integration)
- 🧪 Layer 3: ISA-88 (Batch Control)
- 🖥️ Layer 4: ISA-101 (HMI Design)
- 🚨 Layer 5: ISA-18.2 (Alarm Management)
- 📡 Layer 6: OPC-UA (Communication)
- 📨 Layer 7: MQTT/Sparkplug (Messaging)
- 🔧 Layer 8: Modbus (Field Protocol)
- 📊 Layer 9: KPIs (Performance Metrics)
- 🔀 Crosswalks between standards

**Use this when**:
- Adding new standard pages
- Understanding UDT structures
- Implementing crosswalk mappings
- Creating state diagrams
- Parsing standard definitions

### [03-konomi-p2p.md](03-konomi-p2p.md)
**Purpose**: Specification for peer-to-peer client layer

**Contents**:
- 🤖 Agent architecture (signal, mesh, sync, crypto, store, bridge, NAT, relay, boot)
- 📐 P2P primitives (PeerId, Multiaddr, Message, Room)
- 🔗 Transport stack (libp2p, WebRTC, WebSocket)
- 🧬 CRDT types (Register, Counter, Set, Map, Array, Text)
- 🔐 Cryptography (KeyPair, SharedSecret, Encryption, Signatures)
- 💾 IndexedDB storage schema
- 🌐 Discovery protocols (Bootstrap, DHT, PubSub)
- 🔀 NAT traversal strategies
- 📡 GossipSub mesh topology
- 🔄 Yjs sync protocol
- 🌉 Bridge injection for static sites
- 🔄 Adapter patterns (localStorage, forms, canvas)

**Use this when**:
- Adding P2P capabilities to static sites
- Implementing real-time collaboration
- Building serverless applications
- Creating offline-first features
- Setting up CRDT-based sync
- Implementing WebRTC connections

### [04-gitplc.md](04-gitplc.md)
**Purpose**: Universal PLC namespace and UDT transfer layer

**Contents**:
- 🤖 Agent architecture (parse, generate, diff, merge, validate, map, simulate, sync, convert, doc)
- 📐 Meta-UDT structure (how PLCs are described)
- 🔢 Primitive type mapping across vendors
- 🏭 ISA-88 equipment UDTs
- ⚙️ Control module UDTs (Motor, Valve, VFD, PID, I/O)
- 🚨 Alarm UDTs (ISA-18.2 compliant)
- 📜 Recipe/Batch UDTs
- 🔌 I/O card UDTs
- 🔄 Vendor converters (AB, Siemens, Codesys, Beckhoff, Omron, Mitsubishi)
- 📂 Git project structure
- 🛠️ CLI commands
- 🔄 Workflows (import, export, convert, validate, simulate, sync)

**Use this when**:
- Converting PLC programs between vendors
- Version controlling PLC code
- Implementing ISA-88/95 hierarchies
- Building universal PLC libraries
- Creating vendor-agnostic automation
- Setting up PLC simulation environments

## How to Use These Prompts

### Regenerating the Site

If you need to rebuild the site from scratch or create a similar project:

1. Start with `01-konomi-standard-pages.md` to understand the architecture
2. Use `02-konomi-standard-spec.md` for content structure
3. Follow the build order specified in prompt #1

### Extending the Site

**Adding a new standard page**:
1. Reference the standard definition in `02-konomi-standard-spec.md`
2. Follow the template pattern from `01-konomi-standard-pages.md`
3. Create the `.njk` file in `src/standards/`

**Adding UDT pages**:
1. Find UDT definitions in `02-konomi-standard-spec.md`
2. Use the UDT-CARD template from `01-konomi-standard-pages.md`
3. Create the `.njk` file in `src/udts/`

**Implementing crosswalks**:
1. Reference crosswalk definitions in `02-konomi-standard-spec.md`
2. Use the CROSSWALK layout from `01-konomi-standard-pages.md`
3. Create the `.njk` file in `src/crosswalks/`

### Customizing

**Theme changes**:
- See THEME section in `01-konomi-standard-pages.md`
- Modify `tailwind.config.js` colors
- Update component classes in `main.css`

**Search enhancements**:
- Reference SEARCH.JS in `01-konomi-standard-pages.md`
- Implement Lunr.js for full-text search
- Generate search index at build time

**Parser improvements**:
- See DATA GENERATION section in `01-konomi-standard-pages.md`
- Parse complete UDT definitions from `02-konomi-standard-spec.md`
- Generate more detailed JSON data

## Key Concepts

### Agent Architecture (α, β, γ, δ, ε, ζ)
- **α (Parse)**: Convert KONOMI_STANDARD.md → JSON
- **β (Build)**: Transform JSON → HTML with Eleventy
- **γ (Nav)**: Generate hierarchy → sidebar navigation
- **δ (Search)**: Create search index → Lunr.js
- **ε (Theme)**: Compile Tailwind → CSS
- **ζ (Deploy)**: Push dist/ → GitHub Pages

### UDT-First Design
Everything is defined as a User Defined Type (UDT):
- Consistent structure across all standards
- Reusable components
- Type inheritance
- Copy-pasteable JSON

### Layer Architecture
- **Layer 0**: Meta (defines how to define)
- **Layer 1**: Base primitives (Identifier, Timestamp, etc.)
- **Layers 2-9**: Specific standards
- **Crosswalks**: Mappings between layers

## Build Workflow

```
KONOMI_STANDARD.md
    ↓ (α parse)
src/_data/*.json
    ↓ (β build)
HTML templates
    ↓ (ε theme)
Styled pages
    ↓ (ζ deploy)
GitHub Pages
```

## Quick Reference

| Need | Use Prompt | Section |
|------|-----------|---------|
| **Static Site** | | |
| Project setup | #1 | STRUCT, PACKAGE.JSON |
| Add standard page | #1 + #2 | STANDARD.NJK + Layer definitions |
| Add UDT page | #1 + #2 | UDT-CARD.NJK + UDT definitions |
| Customize theme | #1 | THEME |
| State diagrams | #1 | STATE-DIAGRAM.NJK |
| Crosswalk mapping | #1 + #2 | CROSSWALK.NJK + Crosswalks |
| Search | #1 | SEARCH.JS |
| Deployment | #1 | DEPLOY.YML |
| **P2P Features** | | |
| P2P setup | #3 | LIBP2P.JS, PACKAGE.JSON |
| Inject P2P | #3 | BRIDGE/INJECT.JS |
| CRDT sync | #3 | PROVIDER.JS, SYNC PROTOCOL |
| Discovery | #3 | DISCOVERY |
| NAT traversal | #3 | NAT TRAVERSAL |
| Encryption | #3 | CRYPTO |
| Offline storage | #3 | STORE, SERVICE-WORKER.JS |
| Adapt page state | #3 | ADAPTER PATTERNS |
| **PLC Tools** | | |
| PLC import | #4 | CONVERTER, CLI |
| Vendor conversion | #4 | VENDOR CONVERTERS |
| ISA-88 structure | #4 | LAYER 2-5 |
| Git structure | #4 | GIT STRUCTURE |
| Validation | #4 | VALIDATORS |
| Simulation | #4 | SIM |
| PLC sync | #4 | SYNC |

## Notes

- All prompts work together as a unified system:
  - **#1**: Static site infrastructure (how to build)
  - **#2**: Content specification (what to build)
  - **#3**: P2P layer (how to add real-time collaboration)
  - **#4**: PLC tooling (universal automation transfer)
- Keep all files as reference when extending the system
- The actual implementation may differ slightly from these specs based on practical considerations
- Each prompt is self-contained but references the UDT-first design from Konomi Standard

## 📐

**For questions or contributions, see the main [README.md](../README.md)**
