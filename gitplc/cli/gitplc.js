#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import * as converter from '../src/converter.js';
import * as git from '../src/git.js';
import * as types from '../src/types/base.js';
import * as equipment from '../src/types/equipment.js';

const program = new Command();

program
  .name('gitplc')
  .description('GitPLC - Universal PLC namespace and UDT transfer layer')
  .version('1.0.0');

// Initialize command
program
  .command('init')
  .description('Initialize a new GitPLC project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-v, --vendor <vendor>', 'Primary vendor (rockwell, siemens, codesys, beckhoff)')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      console.log(chalk.blue('🚀 Initializing GitPLC project...'));

      const metadata = await git.init(projectPath, options);

      console.log(chalk.green('✅ Project initialized!'));
      console.log(chalk.gray('\nProject details:'));
      console.log(chalk.gray(`  Name: ${metadata.name}`));
      console.log(chalk.gray(`  Vendor: ${metadata.vendor}`));
      console.log(chalk.gray(`  Version: ${metadata.version}`));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Add UDTs: gitplc add <type>'));
      console.log(chalk.gray('  2. Export to vendor: gitplc export <vendor>'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Add UDT command
program
  .command('add <type>')
  .description('Add a new UDT to the project')
  .option('-n, --name <name>', 'Custom UDT name')
  .action(async (type, options) => {
    try {
      const projectPath = process.cwd();

      // Map type to class
      const typeMap = {
        'identifier': types.Identifier,
        'status': types.Status,
        'command': types.Command,
        'value': types.Value,
        'alarm': types.Alarm,
        'equipment': equipment.EquipmentModule,
        'control': equipment.ControlModule,
        'unit': equipment.Unit,
        'cell': equipment.ProcessCell,
        'valve': equipment.ValveModule,
        'motor': equipment.MotorModule,
        'analog-in': equipment.AnalogInputModule,
        'analog-out': equipment.AnalogOutputModule
      };

      const UDTClass = typeMap[type.toLowerCase()];
      if (!UDTClass) {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        console.log(chalk.gray('\nAvailable types:'));
        console.log(chalk.gray('  ' + Object.keys(typeMap).join(', ')));
        process.exit(1);
      }

      const udt = new UDTClass();
      if (options.name) {
        udt.name = options.name;
      }

      const udtPath = await git.addUDT(projectPath, udt);

      console.log(chalk.green('✅ UDT added:'), chalk.bold(udt.name));
      console.log(chalk.gray(`   File: ${path.relative(projectPath, udtPath)}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Import command
program
  .command('import <vendor> <file>')
  .description('Import a UDT from vendor format')
  .action(async (vendor, file) => {
    try {
      const projectPath = process.cwd();

      console.log(chalk.blue(`📥 Importing from ${vendor}...`));

      const udtPath = await git.importVendorFile(projectPath, file, vendor, converter);

      console.log(chalk.green('✅ Imported:'), chalk.bold(path.relative(projectPath, udtPath)));
      console.log(chalk.gray('   Run "git commit" to save changes'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Export command
program
  .command('export <vendor>')
  .description('Export all UDTs to vendor format')
  .action(async (vendor) => {
    try {
      const projectPath = process.cwd();

      console.log(chalk.blue(`📤 Exporting to ${vendor}...`));

      const exported = await git.exportToVendor(projectPath, vendor, converter);

      console.log(chalk.green(`✅ Exported ${exported.length} UDT(s):`));
      exported.forEach(file => {
        console.log(chalk.gray(`   ${path.relative(projectPath, file)}`));
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Convert command
program
  .command('convert <source-vendor> <target-vendor> <file>')
  .description('Convert a UDT between vendor formats')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (sourceVendor, targetVendor, file, options) => {
    try {
      console.log(chalk.blue(`🔄 Converting ${sourceVendor} → ${targetVendor}...`));

      const content = await fs.readFile(file, 'utf-8');
      const converted = await converter.convert(content, sourceVendor, targetVendor);

      if (options.output) {
        await fs.writeFile(options.output, converted);
        console.log(chalk.green('✅ Converted:'), chalk.bold(options.output));
      } else {
        console.log(converted);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate state machine command
program
  .command('generate-sm <unit-name> <vendor>')
  .description('Generate PackML state machine code for a vendor')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (unitName, vendor, options) => {
    try {
      console.log(chalk.blue(`⚙️  Generating PackML state machine for ${unitName}...`));

      const code = converter.generateStateMachine(unitName, vendor);

      if (options.output) {
        await fs.writeFile(options.output, code);
        console.log(chalk.green('✅ Generated:'), chalk.bold(options.output));
      } else {
        console.log(code);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show project status')
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const status = await git.status(projectPath);

      console.log(chalk.bold('\n📐 GitPLC Project Status\n'));

      console.log(chalk.blue('Project:'));
      console.log(chalk.gray(`  Name: ${status.metadata.name}`));
      console.log(chalk.gray(`  Vendor: ${status.metadata.vendor}`));
      console.log(chalk.gray(`  Version: ${status.metadata.version}`));

      console.log(chalk.blue('\nGit:'));
      console.log(chalk.gray(`  Branch: ${status.git.branch}`));
      console.log(chalk.gray(`  Status: ${status.git.isClean ? chalk.green('Clean') : chalk.yellow('Modified')}`));

      if (status.git.modified.length > 0) {
        console.log(chalk.yellow(`  Modified files: ${status.git.modified.length}`));
      }
      if (status.git.created.length > 0) {
        console.log(chalk.yellow(`  New files: ${status.git.created.length}`));
      }

      if (status.recentCommits.length > 0) {
        console.log(chalk.blue('\nRecent commits:'));
        status.recentCommits.forEach(commit => {
          const date = new Date(commit.date).toLocaleDateString();
          console.log(chalk.gray(`  ${commit.hash.slice(0, 7)} - ${commit.message} (${date})`));
        });
      }

      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// List vendors command
program
  .command('vendors')
  .description('List supported vendors')
  .action(() => {
    const vendors = converter.getSupportedVendors();
    console.log(chalk.bold('\n📦 Supported Vendors:\n'));
    vendors.forEach(vendor => {
      console.log(chalk.gray(`  • ${vendor}`));
    });
    console.log();
  });

program.parse();
