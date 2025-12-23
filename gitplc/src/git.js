// Git integration for PLC project versioning

import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Initialize a new GitPLC repository
 */
export async function init(projectPath, options = {}) {
  const git = simpleGit(projectPath);

  // Initialize git if not already a repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
  }

  // Create directory structure
  await createProjectStructure(projectPath);

  // Create .gitignore
  await fs.writeFile(
    path.join(projectPath, '.gitignore'),
    `# Vendor-specific build artifacts
*.opt
*.tmp
*.bak
~*.tmp

# IDE files
.vs/
.vscode/
*.suo
*.user

# Build outputs
build/
dist/
out/

# OS files
.DS_Store
Thumbs.db
`
  );

  // Create project metadata
  const metadata = {
    name: options.name || path.basename(projectPath),
    description: options.description || '',
    created: new Date().toISOString(),
    vendor: options.vendor || 'universal',
    version: '1.0.0',
    standards: {
      'isa-88': '1.0',
      'packml': '1.0'
    }
  };

  await fs.writeFile(
    path.join(projectPath, 'project.yaml'),
    yaml.dump(metadata, { indent: 2 })
  );

  // Initial commit
  await git.add('.');
  await git.commit('Initial commit: GitPLC project structure');

  return metadata;
}

/**
 * Create standard project structure
 */
async function createProjectStructure(projectPath) {
  const dirs = [
    'udts',           // Universal UDT definitions (YAML)
    'equipment',      // Equipment modules
    'control',        // Control modules
    'recipes',        // Recipe definitions
    'alarms',         // Alarm definitions
    'hmi',            // HMI screens
    'docs',           // Documentation
    'vendor/rockwell',   // Vendor-specific exports
    'vendor/siemens',
    'vendor/codesys',
    'vendor/beckhoff'
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }

  // Create README
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    `# GitPLC Project

This project uses GitPLC for universal PLC program management.

## Structure

- \`udts/\` - Universal UDT definitions (vendor-agnostic YAML)
- \`equipment/\` - Equipment modules (ISA-88)
- \`control/\` - Control modules
- \`recipes/\` - Recipe definitions
- \`alarms/\` - Alarm definitions
- \`vendor/\` - Vendor-specific exports

## Workflow

1. Edit universal UDTs in \`udts/\`
2. Export to vendor format: \`gitplc export <vendor>\`
3. Import to PLC IDE
4. Make changes in PLC IDE
5. Export from PLC IDE
6. Import to GitPLC: \`gitplc import <vendor> <file>\`
7. Commit changes: \`git commit -am "Update from PLC"\`

## Standards

This project follows:
- ISA-88 Equipment Model
- PackML State Machine
- Konomi Standard Layer 0-9
`
  );
}

/**
 * Add a UDT to the repository
 */
export async function addUDT(projectPath, udt, category = 'udts') {
  const git = simpleGit(projectPath);

  const udtPath = path.join(projectPath, category, `${udt.name}.yaml`);
  await fs.writeFile(udtPath, yaml.dump(udt.toUniversal(), { indent: 2 }));

  await git.add(udtPath);

  return udtPath;
}

/**
 * Import UDT from vendor format
 */
export async function importVendorFile(projectPath, vendorFile, vendor, converter) {
  const git = simpleGit(projectPath);

  const content = await fs.readFile(vendorFile, 'utf-8');
  const universal = await converter.toUniversal(content, vendor);

  // Parse to get UDT name
  const udtData = yaml.load(universal);
  const udtPath = path.join(projectPath, 'udts', `${udtData.name}.yaml`);

  await fs.writeFile(udtPath, universal);
  await git.add(udtPath);

  return udtPath;
}

/**
 * Export all UDTs to vendor format
 */
export async function exportToVendor(projectPath, vendor, converter) {
  const udtsDir = path.join(projectPath, 'udts');
  const vendorDir = path.join(projectPath, 'vendor', vendor);

  await fs.mkdir(vendorDir, { recursive: true });

  const files = await fs.readdir(udtsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const exported = [];

  for (const file of yamlFiles) {
    const yamlContent = await fs.readFile(path.join(udtsDir, file), 'utf-8');
    const vendorContent = await converter.fromUniversal(yamlContent, vendor);

    const udtData = yaml.load(yamlContent);
    const vendorFile = path.join(vendorDir, `${udtData.name}.${getVendorExtension(vendor)}`);

    await fs.writeFile(vendorFile, vendorContent);
    exported.push(vendorFile);
  }

  return exported;
}

/**
 * Get file extension for vendor
 */
function getVendorExtension(vendor) {
  const extensions = {
    rockwell: 'L5X',
    siemens: 'scl',
    codesys: 'st',
    beckhoff: 'TcDUT'
  };
  return extensions[vendor.toLowerCase()] || 'txt';
}

/**
 * Get project status
 */
export async function status(projectPath) {
  const git = simpleGit(projectPath);

  const statusSummary = await git.status();
  const log = await git.log({ maxCount: 5 });

  const metadata = yaml.load(
    await fs.readFile(path.join(projectPath, 'project.yaml'), 'utf-8')
  );

  return {
    metadata,
    git: {
      branch: statusSummary.current,
      modified: statusSummary.modified,
      created: statusSummary.created,
      deleted: statusSummary.deleted,
      isClean: statusSummary.isClean()
    },
    recentCommits: log.all
  };
}

/**
 * Create a branch for vendor-specific work
 */
export async function createVendorBranch(projectPath, vendor) {
  const git = simpleGit(projectPath);

  const branchName = `vendor/${vendor}`;
  await git.checkoutLocalBranch(branchName);

  return branchName;
}

/**
 * Diff between universal and vendor version
 */
export async function diffVendor(projectPath, udtName, vendor, converter) {
  const universalPath = path.join(projectPath, 'udts', `${udtName}.yaml`);
  const vendorPath = path.join(
    projectPath,
    'vendor',
    vendor,
    `${udtName}.${getVendorExtension(vendor)}`
  );

  const universalContent = await fs.readFile(universalPath, 'utf-8');
  const vendorContent = await fs.readFile(vendorPath, 'utf-8');

  // Convert vendor back to universal for comparison
  const vendorAsUniversal = await converter.toUniversal(vendorContent, vendor);

  return {
    universal: universalContent,
    vendor: vendorContent,
    vendorAsUniversal,
    hasChanges: universalContent !== vendorAsUniversal
  };
}
