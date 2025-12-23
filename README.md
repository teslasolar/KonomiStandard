# 📐 Konomi Standard Pages

Static reference site for the Konomi Standard - a self-defining industrial standards compression format. Built with Eleventy, Tailwind CSS, and deployed to GitHub Pages.

## 🚀 Features

- **Browse Standards**: Navigate through ISA-95, ISA-88, ISA-101, ISA-18.2, OPC-UA, MQTT Sparkplug, Modbus, and KPI standards
- **UDT Explorer**: View and copy User Defined Types as JSON
- **State Diagrams**: Visualize state machines with Mermaid
- **Search**: Fast client-side search across all standards and UDTs
- **Crosswalks**: View mappings between different standards
- **Dark Mode**: Beautiful dark theme optimized for readability
- **Copy to Clipboard**: One-click copy for UDT definitions
- **Zero JS Frameworks**: Lightweight, fast, and cacheable static site

## 📁 Repository Structure

```
konomi-standard-pages/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── src/
│   ├── _data/                  # Generated JSON data
│   │   ├── standards.json
│   │   ├── base_udts.json
│   │   ├── crosswalks.json
│   │   └── nav.json
│   ├── _includes/              # Reusable templates
│   │   ├── base.njk
│   │   └── sidebar.njk
│   ├── _layouts/               # Page layouts
│   ├── standards/              # Standard detail pages
│   │   ├── isa-95.njk
│   │   └── isa-88.njk
│   ├── udts/                   # UDT detail pages
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css        # Tailwind styles
│   │   └── js/
│   │       ├── search.js
│   │       ├── copy.js
│   │       └── theme.js
│   ├── index.njk               # Home page
│   └── about.njk               # About page
├── scripts/
│   └── parse-standard.js       # Parser for KONOMI_STANDARD.md
├── .eleventy.js                # Eleventy configuration
├── tailwind.config.js          # Tailwind configuration
├── package.json
└── README.md
```

## ⚙️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/teslasolar/KonomiStandard.git
cd KonomiStandard
npm install
```

### 2. Development

```bash
# Run parser to generate data
npm run parse

# Build CSS
npm run css

# Start development server
npm run dev
# Visit http://localhost:8080
```

### 3. Build for Production

```bash
# Build the site
npm run build

# Output will be in dist/
```

### 4. Deploy to GitHub Pages

The site auto-deploys when you push to `main`:

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main branch
4. Site will deploy automatically

Manual deployment:
```bash
git add .
git commit -m "Update site"
git push origin main
```

## 🎨 Tech Stack

- **[Eleventy](https://www.11ty.dev/)**: Static site generator
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Alpine.js](https://alpinejs.dev/)**: Minimal JavaScript framework for interactivity
- **[Mermaid](https://mermaid.js.org/)**: Diagram and flowchart rendering
- **[Lunr.js](https://lunrjs.com/)**: Client-side search (planned)
- **GitHub Pages**: Free hosting

## 📊 Site Structure

### Layer Architecture

- **Layer 0**: Meta-standard (how standards are defined)
- **Layer 1**: Base UDTs (Identifier, Timestamp, Quality, Value, etc.)
- **Layer 2**: ISA-95 (Enterprise-Control Integration)
- **Layer 3**: ISA-88 (Batch Control)
- **Layer 4**: ISA-101 (HMI Design)
- **Layer 5**: ISA-18.2 (Alarm Management)
- **Layer 6**: OPC-UA (Communication)
- **Layer 7**: MQTT/Sparkplug (Messaging)
- **Layer 8**: Modbus (Field Protocol)
- **Layer 9**: KPIs (Performance Metrics)

### Crosswalks

Mappings between standards:
- ISA-95 ↔ ISA-88
- ISA-95 ↔ OPC-UA
- ISA-88 ↔ PackML
- ISA-101 ↔ ISA-18.2
- OPC-UA ↔ Sparkplug

## 🎯 Available Commands

```bash
npm run dev         # Start development server (localhost:8080)
npm run build       # Build production site
npm run css         # Compile Tailwind CSS
npm run parse       # Parse KONOMI_STANDARD.md to JSON
```

## 🧪 Customization

### Adding a New Standard

1. Add standard to `scripts/parse-standard.js`
2. Create page in `src/standards/[standard-name].njk`
3. Run `npm run parse` to regenerate data
4. Build and deploy

### Adding UDT Pages

1. Create `src/udts/[udt-name].njk`
2. Follow the template pattern from existing UDT pages
3. Include UDT fields, examples, and usage

### Modifying Theme

Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  konomi: {
    bg: '#1a1a2e',        // Background
    surface: '#16213e',   // Card background
    primary: '#0f3460',   // Primary accent
    accent: '#e94560',    // Highlight color
    text: '#eaeaea',      // Text color
    muted: '#8892b0'      // Muted text
  }
}
```

## 🛠️ Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf dist .cache node_modules
npm install
npm run build
```

### CSS Not Updating

```bash
# Force rebuild CSS
npm run css
```

### Development Server Issues

```bash
# Kill process and restart
pkill -f eleventy
npm run dev
```

## 📝 License

MIT License - Feel free to use and modify!
