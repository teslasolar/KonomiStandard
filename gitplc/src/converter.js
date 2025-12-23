// Universal UDT converter - Handles conversion between all vendor formats

import yaml from 'js-yaml';
import * as rockwell from './vendors/rockwell.js';
import * as siemens from './vendors/siemens.js';
import * as codesys from './vendors/codesys.js';
import * as beckhoff from './vendors/beckhoff.js';

const VENDORS = {
  rockwell,
  siemens,
  codesys,
  beckhoff
};

/**
 * Convert UDT from any vendor format to universal YAML
 */
export async function toUniversal(content, sourceVendor) {
  const vendor = VENDORS[sourceVendor.toLowerCase()];
  if (!vendor) {
    throw new Error(`Unknown vendor: ${sourceVendor}. Supported: ${Object.keys(VENDORS).join(', ')}`);
  }

  if (!vendor.fromVendor && !vendor[`from${capitalize(sourceVendor)}`]) {
    throw new Error(`Vendor ${sourceVendor} does not support import`);
  }

  const fromFn = vendor.fromVendor || vendor[`from${capitalize(sourceVendor)}`];
  const udtData = fromFn(content);

  return yaml.dump(udtData, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  });
}

/**
 * Convert UDT from universal YAML to vendor format
 */
export async function fromUniversal(yamlContent, targetVendor) {
  const vendor = VENDORS[targetVendor.toLowerCase()];
  if (!vendor) {
    throw new Error(`Unknown vendor: ${targetVendor}. Supported: ${Object.keys(VENDORS).join(', ')}`);
  }

  if (!vendor.toVendor && !vendor[`to${capitalize(targetVendor)}`]) {
    throw new Error(`Vendor ${targetVendor} does not support export`);
  }

  const udtData = yaml.load(yamlContent);

  // Create UDT object from data
  const udt = {
    name: udtData.name,
    description: udtData.description || '',
    getMembers: () => udtData.members || []
  };

  const toFn = vendor.toVendor || vendor[`to${capitalize(targetVendor)}`];
  return toFn(udt);
}

/**
 * Convert directly from one vendor to another via universal format
 */
export async function convert(content, sourceVendor, targetVendor) {
  const universal = await toUniversal(content, sourceVendor);
  return await fromUniversal(universal, targetVendor);
}

/**
 * Generate PackML state machine for a vendor
 */
export function generateStateMachine(unitName, targetVendor) {
  const vendor = VENDORS[targetVendor.toLowerCase()];
  if (!vendor) {
    throw new Error(`Unknown vendor: ${targetVendor}`);
  }

  if (!vendor.generatePackMLStateMachine) {
    throw new Error(`Vendor ${targetVendor} does not support state machine generation`);
  }

  return vendor.generatePackMLStateMachine(unitName);
}

/**
 * Get list of supported vendors
 */
export function getSupportedVendors() {
  return Object.keys(VENDORS);
}

/**
 * Validate UDT structure
 */
export function validate(udtData) {
  const errors = [];

  if (!udtData.name) {
    errors.push('UDT must have a name');
  }

  if (!udtData.members || !Array.isArray(udtData.members)) {
    errors.push('UDT must have a members array');
  } else {
    udtData.members.forEach((member, idx) => {
      if (!member.name) {
        errors.push(`Member ${idx} missing name`);
      }
      if (!member.type) {
        errors.push(`Member ${member.name || idx} missing type`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
