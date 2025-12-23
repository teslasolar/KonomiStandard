// Rockwell/Allen-Bradley L5X format adapter

/**
 * Type mapping from universal to Rockwell
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
 * Convert universal UDT to Rockwell L5X format
 */
export function toRockwell(udt) {
  const members = udt.getMembers().map(m => {
    let dataType = TYPE_MAP[m.type] || m.type;

    // Handle arrays
    if (m.type.startsWith('ARRAY')) {
      const match = m.type.match(/ARRAY\[(\d+)\.\.(\d+)\] OF (.+)/);
      if (match) {
        const [, start, end, baseType] = match;
        const size = parseInt(end) - parseInt(start) + 1;
        dataType = `${TYPE_MAP[baseType] || baseType}[${size}]`;
      }
    }

    return `    <Member Name="${m.name}" DataType="${dataType}" Dimension="0" Radix="Decimal" Hidden="false" ExternalAccess="Read/Write">
      ${m.description ? `<Description><![CDATA[${m.description}]]></Description>` : ''}
    </Member>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<RSLogix5000Content SchemaRevision="1.0" SoftwareRevision="32.00">
  <Controller Use="Context" Name="MainController">
    <DataTypes Use="Context">
      <DataType Name="${udt.name}" Family="NoFamily" Class="User">
        <Description><![CDATA[${udt.description}]]></Description>
        <Members>
${members}
        </Members>
      </DataType>
    </DataTypes>
  </Controller>
</RSLogix5000Content>`;
}

/**
 * Parse Rockwell L5X format to universal UDT
 */
export function fromRockwell(l5xContent) {
  // Simple XML parsing (in production, use a proper XML parser)
  const udtMatch = l5xContent.match(/<DataType Name="([^"]+)"[^>]*>/);
  if (!udtMatch) {
    throw new Error('Invalid L5X format: No DataType found');
  }

  const udtName = udtMatch[1];

  const descMatch = l5xContent.match(/<Description><!\[CDATA\[([^\]]+)\]\]><\/Description>/);
  const description = descMatch ? descMatch[1] : '';

  const members = [];
  const memberRegex = /<Member Name="([^"]+)" DataType="([^"]+)"[^>]*>[\s\S]*?(?:<Description><!\[CDATA\[([^\]]*)\]\]><\/Description>)?/g;

  let memberMatch;
  while ((memberMatch = memberRegex.exec(l5xContent)) !== null) {
    const [, name, dataType, memberDesc] = memberMatch;

    // Reverse type mapping
    let universalType = dataType;
    for (const [univ, rock] of Object.entries(TYPE_MAP)) {
      if (dataType === rock) {
        universalType = univ;
        break;
      }
    }

    // Handle arrays
    if (dataType.includes('[')) {
      const arrayMatch = dataType.match(/(.+)\[(\d+)\]/);
      if (arrayMatch) {
        const [, baseType, size] = arrayMatch;
        let univBaseType = baseType;
        for (const [univ, rock] of Object.entries(TYPE_MAP)) {
          if (baseType === rock) {
            univBaseType = univ;
            break;
          }
        }
        universalType = `ARRAY[0..${parseInt(size) - 1}] OF ${univBaseType}`;
      }
    }

    members.push({
      name,
      type: universalType,
      default: null,
      description: memberDesc || ''
    });
  }

  return {
    name: udtName,
    description,
    members
  };
}

/**
 * Generate Rockwell structured text for PackML state machine
 */
export function generatePackMLStateMachine(unitName) {
  return `(* PackML State Machine for ${unitName} *)

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
