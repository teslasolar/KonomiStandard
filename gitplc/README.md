# 🔧 GitPLC

Universal PLC namespace and UDT transfer layer - Cross-vendor PLC program conversion via Git.

## What is GitPLC?

GitPLC solves the vendor lock-in problem in industrial automation. Write your PLC programs once in a **universal format**, then export to any vendor:

- **Rockwell/Allen-Bradley** (L5X)
- **Siemens** (TIA Portal, SCL)
- **CODESYS** (IEC 61131-3)
- **Beckhoff** (TwinCAT)

All your PLC code lives in **version control** (Git), enabling:
- Collaborative development
- Code review and auditing
- Rollback and branching
- CI/CD for PLC programs

## Features

- ✅ **Universal UDT Format**: Vendor-agnostic YAML definitions
- ✅ **ISA-88 Equipment Model**: Built-in equipment hierarchy (Cell → Unit → Equipment Module → Control Module)
- ✅ **PackML State Machine**: Auto-generate standard PackML states for any vendor
- ✅ **Bidirectional Sync**: Import from vendor → Universal → Export to different vendor
- ✅ **Git Native**: Full version control with branching and merging
- ✅ **CLI Tool**: Simple commands for all operations
- ✅ **Zero Backend**: Works entirely offline with local Git

## Quick Start

### Install

```bash
npm install -g gitplc
```

### Initialize a Project

```bash
mkdir my-plc-project
cd my-plc-project
gitplc init --name "Production Line 1" --vendor rockwell
```

This creates:
```
my-plc-project/
├── udts/              # Universal UDT definitions (YAML)
├── equipment/         # Equipment modules
├── control/           # Control modules
├── recipes/           # Recipe definitions
├── alarms/            # Alarm definitions
├── vendor/            # Vendor-specific exports
│   ├── rockwell/
│   ├── siemens/
│   ├── codesys/
│   └── beckhoff/
├── project.yaml       # Project metadata
└── README.md
```

### Add UDTs

```bash
# Add standard ISA-88 equipment module
gitplc add equipment --name "Tank_001"

# Add a valve control module
gitplc add valve --name "V_100"

# Add a motor control module
gitplc add motor --name "M_200"

# Add analog input
gitplc add analog-in --name "PT_100"
```

### Export to Your PLC Vendor

```bash
# Export all UDTs to Rockwell L5X format
gitplc export rockwell

# Export to Siemens TIA Portal format
gitplc export siemens

# Export to CODESYS
gitplc export codesys
```

### Import from Vendor Format

Made changes in your PLC IDE? Import them back:

```bash
# Import from Rockwell L5X
gitplc import rockwell Tank_001.L5X

# Import from Siemens
gitplc import siemens Tank_001.scl
```

### Generate PackML State Machine

```bash
# Generate state machine code for a unit
gitplc generate-sm Unit_100 rockwell -o Unit_100_SM.st
gitplc generate-sm Unit_100 siemens -o Unit_100_SM.scl
```

### Version Control Workflow

```bash
# Check status
gitplc status

# Commit changes
git add .
git commit -m "Add Tank_001 equipment module"

# Create vendor-specific branch
git checkout -b vendor/siemens

# Export to Siemens
gitplc export siemens

# Merge back
git checkout main
git merge vendor/siemens
```

## Universal UDT Format

UDTs are stored as YAML for human readability and Git friendliness:

```yaml
# udts/ValveModule.yaml
name: ValveModule
description: Valve control module with position feedback
members:
  - name: ID
    type: Identifier
    description: Valve identifier

  - name: Status
    type: Status
    description: Valve status

  - name: Command
    type: Command
    description: Valve commands

  - name: Open
    type: BOOL
    default: false
    description: Open command

  - name: Close
    type: BOOL
    default: false
    description: Close command

  - name: OpenFeedback
    type: BOOL
    default: false
    description: Valve is fully open

  - name: CloseFeedback
    type: BOOL
    default: false
    description: Valve is fully closed

  - name: Position
    type: REAL
    default: 0.0
    description: Valve position % (0-100)
```

## Built-in UDT Types

### Layer 1: Base Types
- `Identifier` - Universal identifier with namespace
- `Status` - PackML status with state, mode, errors
- `Command` - PackML commands (Start, Stop, Reset, etc.)
- `Value` - Value with quality and timestamp
- `Alarm` - Standard alarm representation

### Layer 2: ISA-88 Equipment
- `EquipmentModule` - Base equipment unit
- `ControlModule` - Basic equipment control
- `Unit` - Process unit (reactor, tank)
- `ProcessCell` - Logical grouping of units

### Layer 3: Specific Control Modules
- `ValveModule` - Valve with position feedback
- `MotorModule` - Motor with running feedback
- `AnalogInputModule` - Analog input with alarming
- `AnalogOutputModule` - Analog output with scaling

## Vendor Conversion Examples

### Rockwell (Allen-Bradley L5X)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RSLogix5000Content SchemaRevision="1.0">
  <Controller Use="Context" Name="MainController">
    <DataTypes Use="Context">
      <DataType Name="ValveModule" Family="NoFamily" Class="User">
        <Members>
          <Member Name="Open" DataType="BOOL" Radix="Decimal"/>
          <Member Name="Close" DataType="BOOL" Radix="Decimal"/>
          <Member Name="Position" DataType="REAL" Radix="Float"/>
        </Members>
      </DataType>
    </DataTypes>
  </Controller>
</RSLogix5000Content>
```

### Siemens (TIA Portal)

```iec-st
TYPE "ValveModule"
VERSION : 0.1
   STRUCT
      Open : Bool;
      Close : Bool;
      Position : Real;
   END_STRUCT;
END_TYPE
```

### CODESYS

```iec-st
TYPE ValveModule :
STRUCT
	Open : BOOL;
	Close : BOOL;
	Position : REAL;
END_STRUCT
END_TYPE
```

## CLI Reference

### Project Management

```bash
gitplc init                    # Initialize new project
gitplc status                  # Show project status
gitplc vendors                 # List supported vendors
```

### UDT Management

```bash
gitplc add <type>              # Add a new UDT
gitplc add equipment           # Add equipment module
gitplc add valve --name V_100  # Add valve with custom name
```

Available types:
- `identifier`, `status`, `command`, `value`, `alarm`
- `equipment`, `control`, `unit`, `cell`
- `valve`, `motor`, `analog-in`, `analog-out`

### Import/Export

```bash
gitplc import <vendor> <file>  # Import from vendor format
gitplc export <vendor>         # Export all UDTs to vendor

# Examples
gitplc import rockwell Tank.L5X
gitplc export siemens
```

### Conversion

```bash
gitplc convert <source> <target> <file> [-o output]

# Convert Rockwell to Siemens
gitplc convert rockwell siemens Tank.L5X -o Tank.scl

# Convert Siemens to CODESYS
gitplc convert siemens codesys Tank.scl -o Tank.st
```

### Code Generation

```bash
gitplc generate-sm <unit-name> <vendor> [-o output]

# Generate PackML state machine
gitplc generate-sm Reactor_001 rockwell -o Reactor_SM.st
gitplc generate-sm Reactor_001 siemens -o Reactor_SM.scl
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Universal Format (YAML)                 │
│  • ISA-88 Equipment Model                       │
│  • PackML State Machine                         │
│  • Layer 0-9 Konomi Standard                    │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│   Git Storage   │  │   Converters    │
│  • Version Ctrl │  │  • Rockwell     │
│  • Branching    │  │  • Siemens      │
│  • Auditing     │  │  • CODESYS      │
└─────────────────┘  │  • Beckhoff     │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
         ┌────────┐      ┌────────┐      ┌────────┐
         │ L5X    │      │ SCL    │      │ ST     │
         │ Export │      │ Export │      │ Export │
         └────────┘      └────────┘      └────────┘
              │               │               │
              ▼               ▼               ▼
         PLC IDE         PLC IDE         PLC IDE
```

## Workflows

### Scenario 1: Greenfield Project

Starting fresh with a new control system:

```bash
# 1. Initialize project
gitplc init --name "Production Line 1"

# 2. Add equipment based on P&ID
gitplc add unit --name "Reactor_001"
gitplc add valve --name "V_100_Feed"
gitplc add valve --name "V_101_Drain"
gitplc add motor --name "M_100_Agitator"
gitplc add analog-in --name "PT_100_Pressure"

# 3. Export to your vendor
gitplc export rockwell

# 4. Import to PLC IDE (Studio 5000, TIA Portal, etc.)
# 5. Develop application logic in PLC IDE
# 6. Export from PLC IDE
# 7. Import changes back

gitplc import rockwell Reactor_001.L5X

# 8. Commit
git commit -am "Complete reactor control logic"
```

### Scenario 2: Converting Existing Project

Moving from one vendor to another:

```bash
# 1. Initialize project
gitplc init --name "Migration Project" --vendor rockwell

# 2. Import all existing UDTs
for file in *.L5X; do
  gitplc import rockwell "$file"
done

# 3. Export to new vendor
gitplc export siemens

# 4. Review exported files in vendor/siemens/
# 5. Import to new PLC IDE
```

### Scenario 3: Multi-Vendor Project

Same control logic, multiple vendors:

```bash
# 1. Maintain universal UDTs in main branch
git checkout main

# 2. Create vendor branches
git checkout -b vendor/rockwell
gitplc export rockwell
git commit -am "Rockwell export"

git checkout main
git checkout -b vendor/siemens
gitplc export siemens
git commit -am "Siemens export"

# 3. When logic changes:
git checkout main
# Make changes to universal UDTs
git commit -am "Update valve logic"

# 4. Merge to vendor branches
git checkout vendor/rockwell
git merge main
gitplc export rockwell

git checkout vendor/siemens
git merge main
gitplc export siemens
```

## ISA-88 Equipment Hierarchy

GitPLC follows ISA-88 equipment model:

```
ProcessCell (e.g., "Production Line 1")
  └─ Unit (e.g., "Reactor Tank")
      └─ EquipmentModule (e.g., "Agitator Assembly")
          └─ ControlModule (e.g., "Motor M-100")
```

Each level has standard:
- `ID` (Identifier)
- `Status` (PackML state machine)
- `Command` (PackML commands)

## PackML State Machine

All equipment follows PackML states:

```
STOPPED → IDLE → STARTING → EXECUTE → STOPPING → STOPPED
                      ↓
                  HOLDING → HELD → UNHOLDING
                      ↓
                  ABORTING → ABORTED → STOPPED
```

Generate state machine code for any vendor:

```bash
gitplc generate-sm MyUnit rockwell
gitplc generate-sm MyUnit siemens
```

## Type Mapping

GitPLC automatically maps types between vendors:

| Universal | Rockwell | Siemens | CODESYS | Beckhoff |
|-----------|----------|---------|---------|----------|
| BOOL      | BOOL     | Bool    | BOOL    | BOOL     |
| INT       | INT      | Int     | INT     | INT      |
| DINT      | DINT     | DInt    | DINT    | DINT     |
| LINT      | LINT     | LInt    | LINT    | LINT     |
| REAL      | REAL     | Real    | REAL    | REAL     |
| STRING    | STRING   | String  | STRING  | STRING   |

Arrays are automatically converted:
- Universal: `ARRAY[0..9] OF INT`
- Rockwell: `INT[10]`
- Siemens: `Array[0..9] of Int`

## API Usage

You can also use GitPLC as a library:

```javascript
import {
  EquipmentModule,
  ValveModule,
  toRockwell,
  toSiemens
} from 'gitplc';

// Create a UDT
const valve = new ValveModule();

// Export to Rockwell
const l5x = toRockwell(valve);

// Export to Siemens
const scl = toSiemens(valve);
```

## Standards Compliance

GitPLC implements:

- **ISA-88** (Batch Control)
  - Equipment hierarchy
  - Procedural model
  - Recipe management

- **PackML** (Packaging Machine Language)
  - State machine
  - Unit/Mode model
  - Admin commands

- **ISA-95** (Enterprise-Control Integration)
  - Equipment model
  - Personnel model
  - Material model

- **Konomi Standard** (Layer 0-9)
  - Self-describing format
  - UDT-first design
  - Crosswalk definitions

## Limitations

- **Vendor-specific features**: Advanced vendor features (e.g., Rockwell Add-On Instructions, Siemens System Functions) may not convert perfectly
- **Logic blocks**: Currently focuses on UDTs/data structures; function blocks/ladder logic requires manual conversion
- **Arrays**: Multi-dimensional arrays have limited support
- **Strings**: String length varies by vendor (Rockwell: 82, Siemens: 254, CODESYS: 255)

## Contributing

GitPLC is part of the Konomi Standard ecosystem. To add support for new vendors:

1. Create adapter in `src/vendors/<vendor>.js`
2. Implement `toVendor(udt)` and `fromVendor(content)`
3. Add type mappings
4. Add tests
5. Submit PR

## License

MIT

## Part of Konomi Standard

GitPLC implements Layer 0-9 of the Konomi Standard specification:

- **Layer 0**: Meta-standard structure
- **Layer 1**: Base UDTs (Identifier, Status, Value, etc.)
- **Layer 2**: ISA-95 Enterprise-Control
- **Layer 3**: ISA-88 Batch Control
- **Layer 4**: ISA-101 HMI
- **Layer 5**: ISA-18.2 Alarms
- **Layer 6**: OPC-UA Information Model
- **Layer 7**: MQTT Sparkplug
- **Layer 8**: Modbus
- **Layer 9**: KPIs

📐 [Learn more about Konomi Standard](../README.md)
