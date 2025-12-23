// Siemens TIA Portal format adapter

/**
 * Type mapping from universal to Siemens
 */
const TYPE_MAP = {
  'BOOL': 'Bool',
  'INT': 'Int',
  'DINT': 'DInt',
  'LINT': 'LInt',
  'REAL': 'Real',
  'STRING': 'String'
};

/**
 * Convert universal UDT to Siemens DB structure
 */
export function toSiemens(udt) {
  const members = udt.getMembers().map((m, idx) => {
    let dataType = TYPE_MAP[m.type] || m.type;

    // Handle arrays
    if (m.type.startsWith('ARRAY')) {
      const match = m.type.match(/ARRAY\[(\d+)\.\.(\d+)\] OF (.+)/);
      if (match) {
        const [, start, end, baseType] = match;
        dataType = `Array[${start}..${end}] of ${TYPE_MAP[baseType] || baseType}`;
      }
    }

    const comment = m.description ? ` // ${m.description}` : '';
    return `      ${m.name} : ${dataType};${comment}`;
  }).join('\n');

  return `TYPE "${udt.name}"
VERSION : 0.1
   STRUCT
${members}
   END_STRUCT;

END_TYPE

(* ${udt.description} *)
`;
}

/**
 * Parse Siemens type definition to universal UDT
 */
export function fromSiemens(typeContent) {
  const nameMatch = typeContent.match(/TYPE "([^"]+)"/);
  if (!nameMatch) {
    throw new Error('Invalid Siemens format: No TYPE declaration found');
  }

  const udtName = nameMatch[1];

  const descMatch = typeContent.match(/\(\* (.+) \*\)/);
  const description = descMatch ? descMatch[1] : '';

  const members = [];
  const memberRegex = /(\w+)\s*:\s*([^;]+);(?:\s*\/\/\s*(.+))?/g;

  let memberMatch;
  while ((memberMatch = memberRegex.exec(typeContent)) !== null) {
    const [, name, dataType, memberDesc] = memberMatch;

    // Reverse type mapping
    let universalType = dataType.trim();
    for (const [univ, siemens] of Object.entries(TYPE_MAP)) {
      if (dataType.trim() === siemens) {
        universalType = univ;
        break;
      }
    }

    // Handle arrays
    if (dataType.includes('Array')) {
      const arrayMatch = dataType.match(/Array\[(\d+)\.\.(\d+)\]\s+of\s+(.+)/);
      if (arrayMatch) {
        const [, start, end, baseType] = arrayMatch;
        let univBaseType = baseType.trim();
        for (const [univ, siemens] of Object.entries(TYPE_MAP)) {
          if (baseType.trim() === siemens) {
            univBaseType = univ;
            break;
          }
        }
        universalType = `ARRAY[${start}..${end}] OF ${univBaseType}`;
      }
    }

    members.push({
      name,
      type: universalType,
      default: null,
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
 * Generate Siemens SCL for PackML state machine
 */
export function generatePackMLStateMachine(unitName) {
  return `(* PackML State Machine for ${unitName} *)

CASE "${unitName}".Status.State OF
  0: (* STOPPED *)
    IF "${unitName}".Command.Reset THEN
      "${unitName}".Status.State := 1; (* Transition to IDLE *)
      "${unitName}".Status.StateName := 'IDLE';
    END_IF;

  1: (* IDLE *)
    IF "${unitName}".Command.Start THEN
      "${unitName}".Status.State := 2; (* Transition to STARTING *)
      "${unitName}".Status.StateName := 'STARTING';
    END_IF;

  2: (* STARTING *)
    (* Startup sequence *)
    IF "${unitName}".Status.SubState = 100 THEN (* Complete *)
      "${unitName}".Status.State := 3; (* EXECUTE *)
      "${unitName}".Status.StateName := 'EXECUTE';
      "${unitName}".Status.SubState := 0;
    END_IF;

  3: (* EXECUTE *)
    IF "${unitName}".Command.Hold THEN
      "${unitName}".Status.State := 4; (* HOLDING *)
      "${unitName}".Status.StateName := 'HOLDING';
    ELSIF "${unitName}".Command.Stop THEN
      "${unitName}".Status.State := 6; (* STOPPING *)
      "${unitName}".Status.StateName := 'STOPPING';
    ELSIF "${unitName}".Command.Abort THEN
      "${unitName}".Status.State := 8; (* ABORTING *)
      "${unitName}".Status.StateName := 'ABORTING';
    END_IF;

  4: (* HOLDING *)
    IF "${unitName}".Status.SubState = 100 THEN
      "${unitName}".Status.State := 5; (* HELD *)
      "${unitName}".Status.StateName := 'HELD';
      "${unitName}".Status.SubState := 0;
    END_IF;

  5: (* HELD *)
    IF "${unitName}".Command.Unhold THEN
      "${unitName}".Status.State := 10; (* UNHOLDING *)
      "${unitName}".Status.StateName := 'UNHOLDING';
    END_IF;

  6: (* STOPPING *)
    IF "${unitName}".Status.SubState = 100 THEN
      "${unitName}".Status.State := 0; (* STOPPED *)
      "${unitName}".Status.StateName := 'STOPPED';
      "${unitName}".Status.SubState := 0;
    END_IF;

  8: (* ABORTING *)
    IF "${unitName}".Status.SubState = 100 THEN
      "${unitName}".Status.State := 9; (* ABORTED *)
      "${unitName}".Status.StateName := 'ABORTED';
      "${unitName}".Status.SubState := 0;
    END_IF;

  9: (* ABORTED *)
    IF "${unitName}".Command.Clear THEN
      "${unitName}".Status.State := 0; (* STOPPED *)
      "${unitName}".Status.StateName := 'STOPPED';
    END_IF;

  10: (* UNHOLDING *)
    IF "${unitName}".Status.SubState = 100 THEN
      "${unitName}".Status.State := 3; (* EXECUTE *)
      "${unitName}".Status.StateName := 'EXECUTE';
      "${unitName}".Status.SubState := 0;
    END_IF;

END_CASE;

(* Clear all commands after processing *)
"${unitName}".Command.Reset := FALSE;
"${unitName}".Command.Start := FALSE;
"${unitName}".Command.Stop := FALSE;
"${unitName}".Command.Hold := FALSE;
"${unitName}".Command.Unhold := FALSE;
"${unitName}".Command.Abort := FALSE;
"${unitName}".Command.Clear := FALSE;
`;
}
