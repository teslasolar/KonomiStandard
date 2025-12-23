# 📐 KONOMI STANDARD PAGES 📐
## GitHub Pages Static Reference Build

## 🤖 AGENTS
```
α=Parse(KONOMI_STD→json) β=Build(json→html) γ=Nav(hierarchy→sidebar)
δ=Search(index→lunr) ε=Theme(style→css) ζ=Deploy(dist→gh-pages)
```

## 🎯 GOAL
```
INPUT:KONOMI_STANDARD.md
OUTPUT:static site on github pages
FEATURES:browse UDTs,search,crosswalk,copy-paste,dark mode
STACK:11ty|tailwind|lunr|alpine|mermaid
NO:react,vue,build complexity
```

## 🏗️ STRUCT
```
konomi-standard-pages/
├─.github/
│ └─workflows/
│   └─deploy.yml────────gh-pages deploy on push
├─src/
│ ├─_data/
│ │ ├─standards.json────parsed KONOMI_STD
│ │ ├─udts.json──────────all UDTs flattened
│ │ ├─crosswalks.json───std↔std mappings
│ │ └─nav.json───────────sidebar tree
│ ├─_includes/
│ │ ├─base.njk───────────html shell
│ │ ├─sidebar.njk────────nav tree
│ │ ├─udt-card.njk───────UDT display component
│ │ ├─state-diagram.njk──mermaid state machine
│ │ ├─hierarchy.njk──────tree view
│ │ └─search.njk─────────search box+results
│ ├─_layouts/
│ │ ├─standard.njk───────standard page layout
│ │ ├─udt.njk────────────UDT detail layout
│ │ └─crosswalk.njk──────mapping view layout
│ ├─standards/
│ │ ├─isa-95.njk
│ │ ├─isa-88.njk
│ │ ├─isa-101.njk
│ │ ├─isa-18-2.njk
│ │ ├─opc-ua.njk
│ │ ├─mqtt-sparkplug.njk
│ │ ├─modbus.njk
│ │ └─kpi.njk
│ ├─udts/
│ │ └─[generated from data]
│ ├─crosswalks/
│ │ └─[generated from data]
│ ├─index.njk────────────home/overview
│ ├─search.njk───────────search page
│ └─about.njk────────────about konomi std
├─assets/
│ ├─css/
│ │ └─main.css───────────tailwind compiled
│ ├─js/
│ │ ├─search.js──────────lunr init+query
│ │ ├─copy.js────────────copy to clipboard
│ │ ├─theme.js───────────dark mode toggle
│ │ └─diagrams.js────────mermaid init
│ └─img/
│   └─logo.svg
├─.eleventy.js───────────11ty config
├─tailwind.config.js
├─package.json
└─README.md
```

## 📦 PACKAGE.JSON
```json
{
  "name":"konomi-standard-pages",
  "scripts":{
    "dev":"eleventy --serve",
    "build":"eleventy",
    "css":"tailwindcss -i src/assets/css/main.css -o dist/css/main.css --minify"
  },
  "devDependencies":{
    "@11ty/eleventy":"^2.0.0",
    "tailwindcss":"^3.4.0",
    "lunr":"^2.3.9",
    "mermaid":"^10.0.0",
    "alpinejs":"^3.13.0"
  }
}
```

## ⚙️ ELEVENTY.JS
```javascript
module.exports=function(cfg){
  //passthrough
  cfg.addPassthroughCopy("src/assets");

  //collections
  cfg.addCollection("standards",c=>c.getFilteredByGlob("src/standards/*.njk"));
  cfg.addCollection("udts",c=>c.getFilteredByGlob("src/udts/*.njk"));

  //filters
  cfg.addFilter("json",v=>JSON.stringify(v,null,2));
  cfg.addFilter("slug",v=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-'));

  //shortcodes
  cfg.addShortcode("udt",name=>`<a href="/udts/${name.toLowerCase()}">${name}</a>`);
  cfg.addShortcode("mermaid",code=>`<div class="mermaid">${code}</div>`);

  return{
    dir:{input:"src",output:"dist"},
    markdownTemplateEngine:"njk",
    htmlTemplateEngine:"njk"
  };
};
```

## 🎨 THEME (ε builds)
```css
/*tailwind.config.js*/
module.exports={
  content:["./src/**/*.{njk,html,js}"],
  darkMode:'class',
  theme:{
    extend:{
      colors:{
        konomi:{
          bg:'#1a1a2e',
          surface:'#16213e',
          primary:'#0f3460',
          accent:'#e94560',
          text:'#eaeaea',
          muted:'#8892b0'
        }
      },
      fontFamily:{
        mono:['JetBrains Mono','monospace'],
        sans:['Inter','sans-serif']
      }
    }
  }
};

/*main.css*/
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components{
  .udt-card{@apply bg-konomi-surface rounded-lg p-4 border border-konomi-primary/30 hover:border-konomi-accent/50 transition}
  .udt-field{@apply font-mono text-sm text-konomi-muted}
  .udt-type{@apply text-konomi-accent font-semibold}
  .udt-name{@apply text-konomi-text font-bold text-lg}
  .std-badge{@apply px-2 py-1 rounded text-xs font-mono bg-konomi-primary/50}
  .copy-btn{@apply text-konomi-muted hover:text-konomi-accent cursor-pointer}
  .nav-item{@apply block py-1 px-2 rounded hover:bg-konomi-primary/30 text-konomi-muted hover:text-konomi-text}
  .nav-active{@apply bg-konomi-primary/50 text-konomi-text}
  .search-input{@apply w-full bg-konomi-surface border border-konomi-primary/50 rounded px-3 py-2 text-konomi-text focus:border-konomi-accent outline-none}
}
```

## 📄 BASE.NJK
```html
<!DOCTYPE html>
<html lang="en" x-data="{dark:true}" :class="{'dark':dark}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{{title}} | Konomi Standard</title>
  <link rel="stylesheet" href="/css/main.css">
  <script defer src="https://unpkg.com/alpinejs@3/dist/cdn.min.js"></script>
  <script src="https://unpkg.com/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body class="bg-konomi-bg text-konomi-text min-h-screen">
  <div class="flex">
    <!--SIDEBAR-->
    <aside class="w-64 h-screen sticky top-0 overflow-y-auto border-r border-konomi-primary/30 p-4">
      {% include "sidebar.njk" %}
    </aside>
    <!--MAIN-->
    <main class="flex-1 p-8 max-w-4xl">
      {{content|safe}}
    </main>
  </div>
  <script src="/js/search.js"></script>
  <script src="/js/copy.js"></script>
  <script>mermaid.initialize({startOnLoad:true,theme:'dark'});</script>
</body>
</html>
```

## 🧭 SIDEBAR.NJK
```html
<div class="mb-6">
  <a href="/" class="text-xl font-bold text-konomi-accent">📐 Konomi Std</a>
</div>

<div class="mb-4">
  {% include "search.njk" %}
</div>

<nav class="space-y-1">
  <div class="text-konomi-muted text-xs uppercase tracking-wider mb-2">Standards</div>
  {% for std in nav.standards %}
  <a href="/standards/{{std.id|slug}}" class="nav-item">{{std.name}}</a>
  {% endfor %}

  <div class="text-konomi-muted text-xs uppercase tracking-wider mb-2 mt-4">Base UDTs</div>
  {% for udt in nav.base_udts %}
  <a href="/udts/{{udt|slug}}" class="nav-item">{{udt}}</a>
  {% endfor %}

  <div class="text-konomi-muted text-xs uppercase tracking-wider mb-2 mt-4">Crosswalks</div>
  {% for xw in nav.crosswalks %}
  <a href="/crosswalks/{{xw.id|slug}}" class="nav-item">{{xw.from}}↔{{xw.to}}</a>
  {% endfor %}
</nav>

<div class="mt-8 pt-4 border-t border-konomi-primary/30">
  <button @click="dark=!dark" class="text-konomi-muted hover:text-konomi-text text-sm">
    <span x-show="dark">☀️ Light</span>
    <span x-show="!dark">🌙 Dark</span>
  </button>
</div>
```

## 📇 UDT-CARD.NJK
```html
<div class="udt-card" id="{{udt.name|slug}}">
  <div class="flex justify-between items-start mb-2">
    <h3 class="udt-name">{{udt.name}}</h3>
    <button class="copy-btn" data-copy="{{udt|json|escape}}">📋</button>
  </div>

  {% if udt.base %}
  <div class="text-sm text-konomi-muted mb-2">extends {% udt udt.base %}</div>
  {% endif %}

  <div class="space-y-1">
    {% for field in udt.fields %}
    <div class="udt-field">
      <span class="text-konomi-text">{{field.name}}</span>:<span class="udt-type">{{field.type}}</span>
      {% if field.unit %}<span class="text-konomi-muted">({{field.unit}})</span>{% endif %}
      {% if field.desc %}<span class="text-konomi-muted ml-2">//{{field.desc}}</span>{% endif %}
    </div>
    {% endfor %}
  </div>

  {% if udt.constraints %}
  <div class="mt-3 pt-3 border-t border-konomi-primary/30">
    <div class="text-xs text-konomi-muted uppercase">Constraints</div>
    {% for c in udt.constraints %}
    <div class="text-sm text-konomi-accent">{{c}}</div>
    {% endfor %}
  </div>
  {% endif %}
</div>
```

## 📊 STATE-DIAGRAM.NJK
```html
{% if states %}
<div class="my-4">
  <div class="mermaid">
stateDiagram-v2
  {% for t in states.transitions %}
  {{t.from}} --> {{t.to}}: {{t.trigger}}
  {% endfor %}
  </div>
</div>
{% endif %}
```

## 🔍 SEARCH.JS
```javascript
//build index at build time,load at runtime
let idx,docs;

fetch('/search-index.json').then(r=>r.json()).then(data=>{
  docs=data.docs;
  idx=lunr(function(){
    this.ref('id');
    this.field('name',{boost:10});
    this.field('type',{boost:5});
    this.field('standard');
    this.field('fields');
    data.docs.forEach(d=>this.add(d));
  });
});

function search(q){
  if(!idx||!q)return[];
  return idx.search(q+'*').slice(0,10).map(r=>docs.find(d=>d.id===r.ref));
}

//alpine component
document.addEventListener('alpine:init',()=>{
  Alpine.data('search',()=>({
    q:'',
    results:[],
    open:false,
    doSearch(){
      this.results=search(this.q);
      this.open=this.results.length>0;
    }
  }));
});
```

## 📋 COPY.JS
```javascript
document.querySelectorAll('[data-copy]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    navigator.clipboard.writeText(btn.dataset.copy);
    btn.textContent='✓';
    setTimeout(()=>btn.textContent='📋',1000);
  });
});
```

## 🚀 DEPLOY.YML
```yaml
name:Deploy to GitHub Pages

on:
  push:
    branches:[main]

jobs:
  build-deploy:
    runs-on:ubuntu-latest
    steps:
      - uses:actions/checkout@v4

      - uses:actions/setup-node@v4
        with:
          node-version:20
          cache:npm

      - run:npm ci
      - run:npm run css
      - run:npm run build

      - uses:peaceiris/actions-gh-pages@v3
        with:
          github_token:${{secrets.GITHUB_TOKEN}}
          publish_dir:./dist
```

## 📄 INDEX.NJK (home)
```html
---
layout:base.njk
title:Home
---

<h1 class="text-3xl font-bold mb-6">📐 Konomi Standard</h1>
<p class="text-konomi-muted mb-8">Self-defining industrial standards compression format</p>

<div class="grid grid-cols-2 gap-4 mb-8">
  {% for std in standards %}
  <a href="/standards/{{std.id|slug}}" class="udt-card hover:border-konomi-accent">
    <div class="udt-name">{{std.name}}</div>
    <div class="text-konomi-muted text-sm">{{std.scope}}</div>
    <div class="text-konomi-accent text-xs mt-2">{{std.udts|length}} UDTs</div>
  </a>
  {% endfor %}
</div>

<h2 class="text-xl font-bold mb-4">Layer 0: Meta-Standard</h2>
<p class="text-konomi-muted mb-4">Defines how all standards are structured:</p>

<div class="grid grid-cols-3 gap-4">
  {% for udt in base_udts %}
  {% include "udt-card.njk" %}
  {% endfor %}
</div>
```

## 📄 STANDARD.NJK (layout)
```html
---
layout:base.njk
---

<div class="mb-6">
  <span class="std-badge">{{standard.id}}</span>
  <h1 class="text-3xl font-bold mt-2">{{standard.name}}</h1>
  <p class="text-konomi-muted">{{standard.scope}}</p>
</div>

{% if standard.hierarchy %}
<h2 class="text-xl font-bold mb-4">Hierarchy</h2>
{% include "hierarchy.njk" %}
{% endif %}

{% if standard.states %}
<h2 class="text-xl font-bold mb-4">State Machines</h2>
{% for sm in standard.states %}
<h3 class="text-lg font-semibold">{{sm.name}}</h3>
{% include "state-diagram.njk" %}
{% endfor %}
{% endif %}

<h2 class="text-xl font-bold mb-4 mt-8">UDTs</h2>
<div class="space-y-4">
  {% for udt in standard.udts %}
  {% include "udt-card.njk" %}
  {% endfor %}
</div>

{% if standard.rules %}
<h2 class="text-xl font-bold mb-4 mt-8">Rules</h2>
<div class="space-y-2">
  {% for rule in standard.rules %}
  <div class="udt-field">{{rule.id}}: {{rule.condition}} → {{rule.action}}</div>
  {% endfor %}
</div>
{% endif %}
```

## 🔀 CROSSWALK.NJK (layout)
```html
---
layout:base.njk
---

<h1 class="text-3xl font-bold mb-6">{{from.name}} ↔ {{to.name}}</h1>

<table class="w-full">
  <thead>
    <tr class="text-left text-konomi-muted border-b border-konomi-primary/30">
      <th class="py-2">{{from.id}}</th>
      <th class="py-2">Mapping</th>
      <th class="py-2">{{to.id}}</th>
    </tr>
  </thead>
  <tbody>
    {% for m in mappings %}
    <tr class="border-b border-konomi-primary/10">
      <td class="py-2">{% udt m.from_entity %}</td>
      <td class="py-2 text-konomi-accent">{{m.mapping}}</td>
      <td class="py-2">{% udt m.to_entity %}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
```

## 🔄 DATA GENERATION (α parses KONOMI_STD.md)
```javascript
//scripts/parse-standard.js
const fs=require('fs');
const md=fs.readFileSync('KONOMI_STANDARD.md','utf8');

function parseUDT(block){
  const lines=block.split('\n').filter(l=>l.trim());
  const name=lines[0].replace('UDT:','').split('─')[0].trim();
  const fields=[];
  for(let i=1;i<lines.length;i++){
    const m=lines[i].match(/(\w+):(.+)/);
    if(m)fields.push({name:m[1],type:m[2].trim()});
  }
  return{name,fields};
}

function parseStandard(section){
  const id=section.match(/ID:(\S+)/)?.[1];
  const scope=section.match(/SCOPE:(.+)/)?.[1];
  const udtBlocks=section.split(/UDT:\w+/).slice(1);
  const udts=udtBlocks.map(parseUDT);
  return{id,scope,udts};
}

//extract layers,build json
const layers=md.split(/## .+ LAYER \d+:/);
const standards=layers.slice(2).map(parseStandard);

fs.writeFileSync('src/_data/standards.json',JSON.stringify(standards,null,2));
```

## 🎯 BUILD ORDER
```
1.α:parse KONOMI_STANDARD.md→src/_data/*.json
2.ε:compile tailwind→dist/css/main.css
3.β:eleventy build→dist/
4.δ:generate search-index.json
5.ζ:deploy dist/→gh-pages
```

## 🏁 COMMANDS
```bash
#dev
npm run dev        #localhost:8080,hot reload

#build
npm run build      #generate dist/

#deploy
git push origin main  #auto deploys via action
```

## ✓ FEATURES
```
☑ browse standards by layer
☑ view UDT details+fields
☑ copy UDT as JSON
☑ mermaid state diagrams
☑ search across all UDTs
☑ crosswalk tables
☑ dark mode default
☑ mobile responsive
☑ zero JS frameworks
☑ static,fast,cacheable
📐
```
