// ISA-88 Equipment Model UDTs

import { UDT, Identifier, Status, Command } from './base.js';

/**
 * Equipment Module - ISA-88 base equipment unit
 */
export class EquipmentModule extends UDT {
  constructor() {
    super('EquipmentModule', 'ISA-88 Equipment Module');
    this
      .addMember('ID', 'Identifier', null, 'Equipment identifier')
      .addMember('Status', 'Status', null, 'Equipment status')
      .addMember('Command', 'Command', null, 'Equipment commands')
      .addMember('Location', 'STRING', '', 'Physical location')
      .addMember('Description', 'STRING', '', 'Equipment description')
      .addMember('Manufacturer', 'STRING', '', 'Manufacturer name')
      .addMember('Model', 'STRING', '', 'Model number')
      .addMember('SerialNumber', 'STRING', '', 'Serial number')
      .addMember('InstallDate', 'LINT', 0, 'Installation date (Unix ms)')
      .addMember('MaintenanceDue', 'LINT', 0, 'Next maintenance date');
  }
}

/**
 * Control Module - ISA-88 Control Module
 */
export class ControlModule extends UDT {
  constructor() {
    super('ControlModule', 'ISA-88 Control Module - Basic equipment control');
    this
      .addMember('ID', 'Identifier', null, 'Module identifier')
      .addMember('Status', 'Status', null, 'Module status')
      .addMember('Command', 'Command', null, 'Module commands')
      .addMember('ParentEquipment', 'STRING', '', 'Parent equipment ID')
      .addMember('Type', 'STRING', '', 'Module type (e.g., "Valve", "Motor", "Pump")')
      .addMember('Interlock', 'BOOL', false, 'Interlock active')
      .addMember('InterlockSource', 'STRING', '', 'Interlock source description')
      .addMember('PermissiveOK', 'BOOL', false, 'All permissives satisfied')
      .addMember('FeedbackOK', 'BOOL', false, 'Feedback matches commanded state');
  }
}

/**
 * Unit - ISA-88 Unit (e.g., reactor, tank)
 */
export class Unit extends UDT {
  constructor() {
    super('Unit', 'ISA-88 Unit - Equipment that carries out one or more process functions');
    this
      .addMember('ID', 'Identifier', null, 'Unit identifier')
      .addMember('Status', 'Status', null, 'Unit status')
      .addMember('Command', 'Command', null, 'Unit commands')
      .addMember('Equipment', 'ARRAY[0..31] OF STRING', null, 'Equipment module IDs')
      .addMember('EquipmentCount', 'INT', 0, 'Number of equipment modules')
      .addMember('CurrentRecipe', 'STRING', '', 'Current recipe name')
      .addMember('BatchID', 'STRING', '', 'Current batch ID')
      .addMember('RecipePhase', 'INT', 0, 'Current recipe phase')
      .addMember('PhaseComplete', 'REAL', 0.0, 'Phase completion %');
  }
}

/**
 * ProcessCell - ISA-88 Process Cell
 */
export class ProcessCell extends UDT {
  constructor() {
    super('ProcessCell', 'ISA-88 Process Cell - Logical grouping of equipment');
    this
      .addMember('ID', 'Identifier', null, 'Cell identifier')
      .addMember('Status', 'Status', null, 'Cell status')
      .addMember('Units', 'ARRAY[0..15] OF STRING', null, 'Unit IDs in this cell')
      .addMember('UnitCount', 'INT', 0, 'Number of units')
      .addMember('ProductionMode', 'INT', 0, 'Production mode')
      .addMember('Schedule', 'STRING', '', 'Current production schedule');
  }
}

/**
 * Valve Control Module - Specific implementation
 */
export class ValveModule extends UDT {
  constructor() {
    super('ValveModule', 'Valve control module with position feedback');
    this
      .addMember('ID', 'Identifier', null, 'Valve identifier')
      .addMember('Status', 'Status', null, 'Valve status')
      .addMember('Command', 'Command', null, 'Valve commands')
      .addMember('Open', 'BOOL', false, 'Open command')
      .addMember('Close', 'BOOL', false, 'Close command')
      .addMember('OpenFeedback', 'BOOL', false, 'Valve is fully open')
      .addMember('CloseFeedback', 'BOOL', false, 'Valve is fully closed')
      .addMember('Position', 'REAL', 0.0, 'Valve position % (0-100)')
      .addMember('FailPosition', 'INT', 0, 'Fail position (0=Close, 1=Open, 2=Stay)')
      .addMember('TravelTime', 'REAL', 0.0, 'Expected travel time (s)');
  }
}

/**
 * Motor Control Module - Specific implementation
 */
export class MotorModule extends UDT {
  constructor() {
    super('MotorModule', 'Motor control module with running feedback');
    this
      .addMember('ID', 'Identifier', null, 'Motor identifier')
      .addMember('Status', 'Status', null, 'Motor status')
      .addMember('Command', 'Command', null, 'Motor commands')
      .addMember('Start', 'BOOL', false, 'Start command')
      .addMember('Stop', 'BOOL', false, 'Stop command')
      .addMember('Running', 'BOOL', false, 'Motor running feedback')
      .addMember('Fault', 'BOOL', false, 'Motor fault')
      .addMember('Speed', 'REAL', 0.0, 'Speed setpoint (Hz or %)')
      .addMember('SpeedFeedback', 'REAL', 0.0, 'Actual speed')
      .addMember('Current', 'REAL', 0.0, 'Motor current (A)')
      .addMember('OverloadTrip', 'BOOL', false, 'Overload protection tripped');
  }
}

/**
 * Analog Input Module
 */
export class AnalogInputModule extends UDT {
  constructor() {
    super('AnalogInputModule', 'Analog input with scaling and alarming');
    this
      .addMember('ID', 'Identifier', null, 'Input identifier')
      .addMember('RawValue', 'INT', 0, 'Raw ADC value')
      .addMember('ScaledValue', 'REAL', 0.0, 'Scaled engineering value')
      .addMember('Unit', 'STRING', '', 'Engineering unit')
      .addMember('RawMin', 'INT', 0, 'Raw minimum (e.g., 0)')
      .addMember('RawMax', 'INT', 32767, 'Raw maximum (e.g., 32767)')
      .addMember('ScaleMin', 'REAL', 0.0, 'Scaled minimum')
      .addMember('ScaleMax', 'REAL', 100.0, 'Scaled maximum')
      .addMember('HighAlarm', 'REAL', 90.0, 'High alarm setpoint')
      .addMember('LowAlarm', 'REAL', 10.0, 'Low alarm setpoint')
      .addMember('AlarmEnabled', 'BOOL', true, 'Alarms enabled')
      .addMember('AlarmActive', 'BOOL', false, 'Alarm active');
  }
}

/**
 * Analog Output Module
 */
export class AnalogOutputModule extends UDT {
  constructor() {
    super('AnalogOutputModule', 'Analog output with scaling');
    this
      .addMember('ID', 'Identifier', null, 'Output identifier')
      .addMember('Setpoint', 'REAL', 0.0, 'Engineering setpoint')
      .addMember('RawOutput', 'INT', 0, 'Raw DAC value')
      .addMember('Unit', 'STRING', '', 'Engineering unit')
      .addMember('RawMin', 'INT', 0, 'Raw minimum')
      .addMember('RawMax', 'INT', 32767, 'Raw maximum')
      .addMember('ScaleMin', 'REAL', 0.0, 'Scaled minimum')
      .addMember('ScaleMax', 'REAL', 100.0, 'Scaled maximum')
      .addMember('ManualMode', 'BOOL', false, 'Manual mode active')
      .addMember('ManualValue', 'REAL', 0.0, 'Manual setpoint');
  }
}
