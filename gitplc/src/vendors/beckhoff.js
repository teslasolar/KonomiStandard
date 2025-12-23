// Beckhoff TwinCAT format adapter

/**
 * Type mapping from universal to Beckhoff
 */
const TYPE_MAP = {
  'BOOL': 'BOOL',
  'INT': 'INT',
  'DINT': 'DINT',
  'LINT': 'LINT',
  'REAL': 'REAL',
  'STRING': 'STRING'
};

/**
 * Convert universal UDT to Beckhoff DUT
 */
export function toBeckhoff(udt) {
  const members = udt.getMembers().map((m, idx) => {
    let dataType = TYPE_MAP[m.type] || m.type;

    // Handle arrays
    if (m.type.startsWith('ARRAY')) {
      const match = m.type.match(/ARRAY\[(\d+)\.\.(\d+)\] OF (.+)/);
      if (match) {
        const [, start, end, baseType] = match;
        dataType = `ARRAY[${start}..${end}] OF ${TYPE_MAP[baseType] || baseType}`;
      }
    }

    const comment = m.description ? ` // ${m.description}` : '';
    const defaultVal = m.defaultValue !== null ? ` := ${formatDefault(m.defaultValue, m.type)}` : '';
    return `\t${m.name} : ${dataType}${defaultVal};${comment}`;
  }).join('\n');

  return `{attribute 'qualified_only'}
{attribute 'strict'}
TYPE ${udt.name} :
STRUCT
${members}
END_STRUCT
END_TYPE

// ${udt.description}
`;
}

/**
 * Format default value for Beckhoff
 */
function formatDefault(value, type) {
  if (type === 'BOOL') {
    return value ? 'TRUE' : 'FALSE';
  } else if (type === 'STRING') {
    return `'${value}'`;
  } else if (type === 'REAL') {
    return value.toString();
  }
  return value;
}

/**
 * Parse Beckhoff DUT to universal UDT
 */
export function fromBeckhoff(dutContent) {
  const nameMatch = dutContent.match(/TYPE (\w+) :/);
  if (!nameMatch) {
    throw new Error('Invalid Beckhoff format: No TYPE declaration found');
  }

  const udtName = nameMatch[1];

  const descMatch = dutContent.match(/\/\/ (.+)/);
  const description = descMatch ? descMatch[1] : '';

  const members = [];
  const memberRegex = /(\w+)\s*:\s*([^;:]+)(?::=\s*([^;]+))?;(?:\s*\/\/\s*(.+))?/g;

  let memberMatch;
  while ((memberMatch = memberRegex.exec(dutContent)) !== null) {
    const [, name, dataType, defaultVal, memberDesc] = memberMatch;

    // Reverse type mapping
    let universalType = dataType.trim();
    for (const [univ, beckhoff] of Object.entries(TYPE_MAP)) {
      if (dataType.trim() === beckhoff) {
        universalType = univ;
        break;
      }
    }

    members.push({
      name,
      type: universalType,
      default: defaultVal ? defaultVal.trim() : null,
      description: memberDesc ? memberDesc.trim() : ''
    });
  }

  return {
    name: udtName,
    description,
    members
  };
}

/**
 * Generate Beckhoff ST for PackML state machine
 */
export function generatePackMLStateMachine(unitName) {
  return `// PackML State Machine for ${unitName}

CASE ${unitName}.Status.State OF
  0: (* STOPPED *)
    IF ${unitName}.Command.Reset THEN
      ${unitName}.Status.State := 1; (* Transition to IDLE *)
      ${unitName}.Status.StateName := 'IDLE';
    END_IF;

  1: (* IDLE *)
    IF ${unitName}.Command.Start THEN
      ${unitName}.Status.State := 2; (* Transition to STARTING *)
      ${unitName}.Status.StateName := 'STARTING';
    END_IF;

  2: (* STARTING *)
    (* Startup sequence *)
    IF ${unitName}.Status.SubState = 100 THEN (* Complete *)
      ${unitName}.Status.State := 3; (* EXECUTE *)
      ${unitName}.Status.StateName := 'EXECUTE';
      ${unitName}.Status.SubState := 0;
    END_IF;

  3: (* EXECUTE *)
    IF ${unitName}.Command.Hold THEN
      ${unitName}.Status.State := 4; (* HOLDING *)
      ${unitName}.Status.StateName := 'HOLDING';
    ELSIF ${unitName}.Command.Stop THEN
      ${unitName}.Status.State := 6; (* STOPPING *)
      ${unitName}.Status.StateName := 'STOPPING';
    ELSIF ${unitName}.Command.Abort THEN
      ${unitName}.Status.State := 8; (* ABORTING *)
      ${unitName}.Status.StateName := 'ABORTING';
    END_IF;

  4: (* HOLDING *)
    IF ${unitName}.Status.SubState = 100 THEN
      ${unitName}.Status.State := 5; (* HELD *)
      ${unitName}.Status.StateName := 'HELD';
      ${unitName}.Status.SubState := 0;
    END_IF;

  5: (* HELD *)
    IF ${unitName}.Command.Unhold THEN
      ${unitName}.Status.State := 10; (* UNHOLDING *)
      ${unitName}.Status.StateName := 'UNHOLDING';
    END_IF;

  6: (* STOPPING *)
    IF ${unitName}.Status.SubState = 100 THEN
      ${unitName}.Status.State := 0; (* STOPPED *)
      ${unitName}.Status.StateName := 'STOPPED';
      ${unitName}.Status.SubState := 0;
    END_IF;

  8: (* ABORTING *)
    IF ${unitName}.Status.SubState = 100 THEN
      ${unitName}.Status.State := 9; (* ABORTED *)
      ${unitName}.Status.StateName := 'ABORTED';
      ${unitName}.Status.SubState := 0;
    END_IF;

  9: (* ABORTED *)
    IF ${unitName}.Command.Clear THEN
      ${unitName}.Status.State := 0; (* STOPPED *)
      ${unitName}.Status.StateName := 'STOPPED';
    END_IF;

  10: (* UNHOLDING *)
    IF ${unitName}.Status.SubState = 100 THEN
      ${unitName}.Status.State := 3; (* EXECUTE *)
      ${unitName}.Status.StateName := 'EXECUTE';
      ${unitName}.Status.SubState := 0;
    END_IF;

END_CASE;

(* Clear all commands after processing *)
${unitName}.Command.Reset := FALSE;
${unitName}.Command.Start := FALSE;
${unitName}.Command.Stop := FALSE;
${unitName}.Command.Hold := FALSE;
${unitName}.Command.Unhold := FALSE;
${unitName}.Command.Abort := FALSE;
${unitName}.Command.Clear := FALSE;
`;
}
