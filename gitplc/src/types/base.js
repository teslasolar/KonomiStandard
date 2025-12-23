// Base UDT types - Foundation for all vendor-specific UDTs

/**
 * Base UDT class - All PLC UDTs inherit from this
 */
export class UDT {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.members = new Map();
  }

  /**
   * Add a member to the UDT
   */
  addMember(name, type, defaultValue = null, description = '') {
    this.members.set(name, {
      name,
      type,
      defaultValue,
      description
    });
    return this;
  }

  /**
   * Get all members
   */
  getMembers() {
    return Array.from(this.members.values());
  }

  /**
   * Convert to vendor-specific format
   */
  toVendor(vendor) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Convert to universal format (YAML)
   */
  toUniversal() {
    return {
      name: this.name,
      description: this.description,
      members: Array.from(this.members.values()).map(m => ({
        name: m.name,
        type: m.type,
        default: m.defaultValue,
        description: m.description
      }))
    };
  }

  /**
   * Load from universal format
   */
  static fromUniversal(data) {
    const udt = new this(data.name, data.description);
    for (const member of data.members || []) {
      udt.addMember(member.name, member.type, member.default, member.description);
    }
    return udt;
  }
}

/**
 * Identifier UDT - Layer 1 base type
 */
export class Identifier extends UDT {
  constructor() {
    super('Identifier', 'Universal identifier with namespace support');
    this
      .addMember('Namespace', 'STRING', '', 'Namespace (e.g., "ISA-95", "OPC-UA")')
      .addMember('ID', 'STRING', '', 'Identifier within namespace')
      .addMember('Version', 'STRING', '1.0.0', 'Semantic version');
  }
}

/**
 * Status UDT - Layer 1 base type
 */
export class Status extends UDT {
  constructor() {
    super('Status', 'Standard status/state representation');
    this
      .addMember('State', 'INT', 0, 'Current state (PackML state number)')
      .addMember('StateName', 'STRING', 'STOPPED', 'State name')
      .addMember('SubState', 'INT', 0, 'Sub-state for detailed control')
      .addMember('Mode', 'INT', 0, 'Operating mode (0=Manual, 1=Auto, 2=Semi)')
      .addMember('Error', 'BOOL', false, 'Error present')
      .addMember('ErrorID', 'INT', 0, 'Error code')
      .addMember('ErrorMessage', 'STRING', '', 'Error description');
  }
}

/**
 * Command UDT - Layer 1 base type
 */
export class Command extends UDT {
  constructor() {
    super('Command', 'Standard command interface');
    this
      .addMember('Reset', 'BOOL', false, 'Reset command')
      .addMember('Start', 'BOOL', false, 'Start command')
      .addMember('Stop', 'BOOL', false, 'Stop command')
      .addMember('Hold', 'BOOL', false, 'Hold command')
      .addMember('Unhold', 'BOOL', false, 'Unhold command')
      .addMember('Abort', 'BOOL', false, 'Abort command')
      .addMember('Clear', 'BOOL', false, 'Clear command')
      .addMember('Suspend', 'BOOL', false, 'Suspend command')
      .addMember('Unsuspend', 'BOOL', false, 'Unsuspend command');
  }
}

/**
 * Value UDT - Layer 1 base type with quality and timestamp
 */
export class Value extends UDT {
  constructor() {
    super('Value', 'Value with quality and timestamp');
    this
      .addMember('Val', 'REAL', 0.0, 'Actual value')
      .addMember('Quality', 'INT', 192, 'OPC quality code (192=Good)')
      .addMember('Timestamp', 'LINT', 0, 'Unix timestamp (ms)')
      .addMember('Unit', 'STRING', '', 'Engineering unit');
  }
}

/**
 * Alarm UDT - Layer 1 base type
 */
export class Alarm extends UDT {
  constructor() {
    super('Alarm', 'Standard alarm representation');
    this
      .addMember('Enabled', 'BOOL', true, 'Alarm is enabled')
      .addMember('Active', 'BOOL', false, 'Alarm is active')
      .addMember('Acknowledged', 'BOOL', false, 'Alarm acknowledged')
      .addMember('Severity', 'INT', 0, 'Severity (0=Low, 1=Med, 2=High, 3=Critical)')
      .addMember('Timestamp', 'LINT', 0, 'Activation timestamp')
      .addMember('Message', 'STRING', '', 'Alarm message')
      .addMember('Source', 'STRING', '', 'Alarm source');
  }
}
