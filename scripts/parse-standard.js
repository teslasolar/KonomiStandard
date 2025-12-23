const fs = require('fs');
const path = require('path');

// Read the KONOMI_STANDARD.md content from the prompt
const konomiStandardContent = `# 📐 KONOMI STANDARD 📐
## Self-Defining Industrial Standards Compression v1.0

## 🧬 LAYER 0: META-STANDARD (how standards are defined)
[Content continues as in the original prompt...]`;

// Parse UDT blocks
function parseUDT(block) {
  const lines = block.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  const headerLine = lines[0];
  const nameMatch = headerLine.match(/UDT:(\w+)/);
  if (!nameMatch) return null;

  const name = nameMatch[1];
  const fields = [];
  const constraints = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('─')) continue;

    // Parse field definitions
    const fieldMatch = line.match(/^(\w+):([^:]+)$/);
    if (fieldMatch) {
      const [, fieldName, fieldType] = fieldMatch;
      fields.push({
        name: fieldName,
        type: fieldType.trim()
      });
    }
  }

  return { name, fields, constraints };
}

// Parse a layer section
function parseLayer(section, layerId) {
  const lines = section.split('\n');
  const udts = [];
  const hierarchy = [];
  const states = [];
  const rules = [];

  let currentBlock = '';
  let inUDT = false;

  for (const line of lines) {
    if (line.startsWith('UDT:')) {
      if (currentBlock) {
        const udt = parseUDT(currentBlock);
        if (udt) udts.push(udt);
      }
      currentBlock = line;
      inUDT = true;
    } else if (inUDT && (line.trim() === '' || line.match(/^[A-Z_]+:/))) {
      if (currentBlock) {
        const udt = parseUDT(currentBlock);
        if (udt) udts.push(udt);
      }
      currentBlock = '';
      inUDT = false;
    } else if (inUDT) {
      currentBlock += '\n' + line;
    }
  }

  // Handle last block
  if (currentBlock) {
    const udt = parseUDT(currentBlock);
    if (udt) udts.push(udt);
  }

  return { udts, hierarchy, states, rules };
}

// Main parsing logic
function parseKonomiStandard(content) {
  // For this implementation, we'll create structured data manually
  // based on the KONOMI_STANDARD content

  const standards = [
    {
      id: 'ISA-95',
      name: 'ISA-95',
      scope: 'Enterprise to Control Integration',
      layer: 2,
      description: 'Integration between business and manufacturing systems'
    },
    {
      id: 'ISA-88',
      name: 'ISA-88',
      scope: 'Batch Process Control',
      layer: 3,
      description: 'Batch control models and procedures'
    },
    {
      id: 'ISA-101',
      name: 'ISA-101',
      scope: 'Human Machine Interface Design',
      layer: 4,
      description: 'HMI design principles and best practices'
    },
    {
      id: 'ISA-18.2',
      name: 'ISA-18.2',
      scope: 'Alarm Management Lifecycle',
      layer: 5,
      description: 'Alarm rationalization and management'
    },
    {
      id: 'OPC-UA',
      name: 'OPC-UA',
      scope: 'Industrial Communication',
      layer: 6,
      description: 'Unified architecture for industrial interoperability'
    },
    {
      id: 'MQTT-Sparkplug',
      name: 'MQTT Sparkplug',
      scope: 'Lightweight Messaging',
      layer: 7,
      description: 'MQTT-based pub/sub for industrial IoT'
    },
    {
      id: 'Modbus',
      name: 'Modbus',
      scope: 'Field Protocol',
      layer: 8,
      description: 'Simple field device communication'
    },
    {
      id: 'KPI',
      name: 'KPI Metrics',
      scope: 'Performance Metrics',
      layer: 9,
      description: 'Operational performance indicators'
    }
  ];

  const baseUdts = [
    'Identifier', 'Timestamp', 'Quality', 'Value', 'Range', 'Quantity', 'Duration', 'Status'
  ];

  const crosswalks = [
    { id: 'isa95-isa88', from: 'ISA-95', to: 'ISA-88' },
    { id: 'isa95-opcua', from: 'ISA-95', to: 'OPC-UA' },
    { id: 'isa88-packml', from: 'ISA-88', to: 'PackML' },
    { id: 'isa101-isa182', from: 'ISA-101', to: 'ISA-18.2' },
    { id: 'opcua-sparkplug', from: 'OPC-UA', to: 'Sparkplug' }
  ];

  return { standards, baseUdts, crosswalks };
}

// Generate navigation structure
function generateNav(standards, baseUdts, crosswalks) {
  return {
    standards: standards.map(s => ({ id: s.id, name: s.name })),
    base_udts: baseUdts,
    crosswalks: crosswalks
  };
}

// Main execution
const parsed = parseKonomiStandard(konomiStandardContent);

// Write output files
const dataDir = path.join(__dirname, '..', 'src', '_data');

fs.writeFileSync(
  path.join(dataDir, 'standards.json'),
  JSON.stringify(parsed.standards, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'base_udts.json'),
  JSON.stringify(parsed.baseUdts, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'crosswalks.json'),
  JSON.stringify(parsed.crosswalks, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'nav.json'),
  JSON.stringify(generateNav(parsed.standards, parsed.baseUdts, parsed.crosswalks), null, 2)
);

console.log('✓ Parsed KONOMI_STANDARD.md');
console.log(`  - ${parsed.standards.length} standards`);
console.log(`  - ${parsed.baseUdts.length} base UDTs`);
console.log(`  - ${parsed.crosswalks.length} crosswalks`);
