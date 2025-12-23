# 📐 Konomi Standard Pages - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Data & Build
```bash
npm run parse    # Parse KONOMI_STANDARD.md → JSON
npm run css      # Build Tailwind CSS
npm run build    # Build static site
```

### Step 3: Preview
```bash
npm run dev      # Start development server
# Visit http://localhost:8080
```

## 📦 What's Included

- ✅ Home page with standards overview
- ✅ ISA-95 detail page (Enterprise-Control Integration)
- ✅ ISA-88 detail page (Batch Control) with PackML state diagram
- ✅ Identifier UDT page (UUID, PATH, TAG, URN)
- ✅ About page
- ✅ Dark mode by default
- ✅ Search functionality
- ✅ Copy-to-clipboard for UDTs
- ✅ Responsive sidebar navigation

## 🎨 Key Features Demonstrated

### 1. UDT Cards
```njk
<div class="udt-card">
  <h3 class="udt-name">Equipment</h3>
  <div class="udt-field">
    <span class="text-konomi-text">id</span>:
    <span class="udt-type">UUID</span>
  </div>
</div>
```

### 2. State Diagrams (Mermaid)
```njk
<div class="mermaid">
stateDiagram-v2
    IDLE --> EXECUTE: Start
    EXECUTE --> COMPLETE: Done
</div>
```

### 3. Copy to Clipboard
```html
<button class="copy-btn" data-copy='{"name":"Equipment"}'>
  📋
</button>
```

### 4. Search
Alpine.js powered search in sidebar - searches across standards and UDTs.

## 🔧 Next Steps

### Add More Standard Pages

1. Create `src/standards/isa-101.njk`:
```njk
---
layout: base.njk
title: ISA-101
---
<h1>ISA-101: HMI Design</h1>
<!-- Add content -->
```

2. Build and view:
```bash
npm run build
npm run dev
```

### Add More UDT Pages

1. Create `src/udts/timestamp.njk`
2. Follow the pattern from `identifier.njk`
3. Include all timestamp formats (ISO8601, EPOCH_MS, OPC_FILETIME)

### Customize Theme

Edit `tailwind.config.js`:
```javascript
colors: {
  konomi: {
    accent: '#your-color',  // Change accent color
  }
}
```

Then rebuild CSS:
```bash
npm run css
```

## 🚀 Deploy to GitHub Pages

### One-Time Setup

1. Go to repository **Settings** → **Pages**
2. Set source to **GitHub Actions**
3. Save

### Every Deployment

```bash
git add .
git commit -m "Update site"
git push origin main
```

Site will auto-deploy via GitHub Actions workflow.

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Eleventy setup | ✅ Complete |
| Tailwind CSS | ✅ Complete |
| Dark mode | ✅ Complete |
| Search | ✅ Basic (can be enhanced with Lunr.js) |
| Copy to clipboard | ✅ Complete |
| State diagrams | ✅ Complete |
| ISA-95 page | ✅ Complete |
| ISA-88 page | ✅ Complete |
| Base UDT pages | 🔄 1/8 complete |
| Crosswalk pages | ⏳ Planned |
| Full parser | ⏳ Needs enhancement |

## 💡 Tips

1. **Fast Iteration**: Keep `npm run dev` running while editing
2. **CSS Changes**: Run `npm run css` if Tailwind classes not working
3. **Data Changes**: Re-run `npm run parse` after modifying parser
4. **Clean Build**: `rm -rf dist .cache && npm run build`

## 🎯 Goals Achieved

- ✅ Static site with zero JS frameworks
- ✅ Beautiful dark mode theme
- ✅ Fast, cacheable pages
- ✅ Copy-paste UDT definitions
- ✅ State machine visualization
- ✅ Search functionality
- ✅ Auto-deploy to GitHub Pages
- ✅ Mobile responsive

## 📐

**Happy Building!**
