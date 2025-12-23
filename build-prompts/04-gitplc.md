# 🔧 GitPLC 🔧
## Universal PLC Namespace UDT Transfer Layer

## 🤖 AGENTS
```
α=Parse(vendor→UDT) β=Gen(UDT→vendor) γ=Diff(ver↔ver) δ=Merge(branch→main)
ε=Validate(UDT→ISA) ζ=Map(addr→tag) η=Sim(UDT→emulate) θ=Sync(git↔PLC)
ι=Convert(format↔format) κ=Doc(UDT→human)
```

## 🎯 GOAL
```
INPUT:any PLC program(AB,Siemens,Codesys,Beckhoff,Omron,Mitsubishi,...)
OUTPUT:universal UDT namespace(vendor-agnostic)
TRANSFER:UDT↔UDT,any PLC to any PLC
STRUCTURE:ISA-88/95 hierarchy
VERSION:git-based,diff,merge,branch
```

## 📐 LAYER 0: META-UDT (how PLCs are described)
```
UDT:GitPLC_Type──────────────────────
{
  id:UUID,
  name:str,                      #type name
  vendor:str|null,               #null=universal
  base:TypeRef|null,             #inheritance
  version:SemVer,
  fields:[Field],
  methods:[Method]|null,         #for OOP PLCs
  size_bits:int,                 #memory footprint
  alignment:int,
  endian:LE|BE,
  meta:{desc,author,created,modified}
}

UDT:Field────────────────────────────
{
  name:str,
  type:TypeRef,
  offset_bits:int,
  size_bits:int,
  array_dims:[int]|null,         #[10] or [3,4] or null
  initial:any|null,
  attrs:{
    retain:bool,                 #survives power cycle
    constant:bool,               #read-only
    persistent:bool,             #saved to flash
    opc_access:RO|RW|WO|None,
    eng_unit:str|null,
    eng_lo:num|null,
    eng_hi:num|null,
    desc:str|null
  }
}

UDT:TypeRef──────────────────────────
primitive:BOOL|SINT|INT|DINT|LINT|USINT|UINT|UDINT|ULINT|REAL|LREAL|STRING|WSTRING|TIME|DATE|DT|TOD
complex:ARRAY[n..m]OF T|STRUCT|ENUM|POINTER|REFERENCE|FB|CLASS
vendor_specific:{vendor,type_name,mapping}

UDT:Method───────────────────────────
{
  name:str,
  access:PUBLIC|PRIVATE|PROTECTED,
  inputs:[{name,type}],
  outputs:[{name,type}],
  inouts:[{name,type}],
  return:TypeRef|null,
  body:IL|ST|LD|FBD|SFC|null     #null=interface only
}
```

## 🔢 LAYER 1: PRIMITIVE MAPPING
```
UNIVERSAL_PRIMITIVES─────────────────
BOOL:1bit,false/true
SINT:8bit,signed,-128..127
USINT:8bit,unsigned,0..255
INT:16bit,signed,-32768..32767
UINT:16bit,unsigned,0..65535
DINT:32bit,signed
UDINT:32bit,unsigned
LINT:64bit,signed
ULINT:64bit,unsigned
REAL:32bit,IEEE754 float
LREAL:64bit,IEEE754 double
STRING:char[],default 80,UTF-8
WSTRING:wchar[],UTF-16
TIME:32bit,ms resolution,T#0ms..T#49d
LTIME:64bit,ns resolution
DATE:BCD or days since epoch
TOD:ms since midnight
DT:DATE+TOD combined

VENDOR_MAPPING───────────────────────
┌─────────┬──────┬────────┬────────┬─────────┬────────┐
│Universal│AB    │Siemens │Codesys │Beckhoff │Omron   │
├─────────┼──────┼────────┼────────┼─────────┼────────┤
│BOOL     │BOOL  │Bool    │BOOL    │BOOL     │BOOL    │
│SINT     │SINT  │SInt    │SINT    │SINT     │SINT    │
│INT      │INT   │Int     │INT     │INT      │INT     │
│DINT     │DINT  │DInt    │DINT    │DINT     │DINT    │
│REAL     │REAL  │Real    │REAL    │REAL     │REAL    │
│STRING   │STRING│String  │STRING  │STRING   │STRING  │
│TIME     │TIME  │Time    │TIME    │TIME     │TIME    │
│COUNTER  │CTU   │CTU     │CTU     │CTU      │CTU     │
│TIMER    │TON   │TON     │TON     │TON      │TIM     │
│PID      │PIDE  │PID_Cpt │PID     │FB_PID   │PIDAT   │
└─────────┴──────┴────────┴────────┴─────────┴────────┘

BIT_ADDRESSING───────────────────────
AB:%B[file]:[word]/[bit]→%I:1/0,%Q:0/5
Siemens:%[area][byte].[bit]→%I0.0,%Q1.7,%M10.3
Codesys:%[I|Q|M][X|B|W|D][addr]→%IX0.0,%QW5,%MD10
Beckhoff:%[I|Q|M][X|B|W|D][addr]→same as Codesys
Omron:CIO[word].[bit],W[word],D[word]→CIO0.00,W0,D100
```

## 🏭 LAYER 2: ISA-88 EQUIPMENT UDTs
```
UDT:Equipment────────────────────────
{
  path:PATH,                     #Area/Line/Cell/Unit
  level:ProcessCell|Unit|EM|CM,
  state:PackML_State,
  mode:PackML_Mode,
  cmd:Equipment_Cmd,
  sts:Equipment_Sts,
  cfg:Equipment_Cfg,
  hmi:Equipment_HMI,
  alarms:[Alarm_Instance],
  children:[Equipment]|null
}

UDT:PackML_State─────────────────────
{
  current:DINT,                  #enum value
  target:DINT,
  last:DINT,
  timer:TIME,
  enum:{
    0:Undefined,
    1:Clearing,2:Stopped,3:Starting,4:Idle,
    5:Suspended,6:Execute,7:Stopping,8:Aborting,
    9:Aborted,10:Holding,11:Held,12:Unholding,
    13:Suspending,14:Unsuspending,15:Resetting,
    16:Completing,17:Complete
  }
}

UDT:PackML_Mode──────────────────────
{
  current:DINT,
  requested:DINT,
  enum:{1:Production,2:Maintenance,3:Manual,4:Auto,5:SemiAuto}
}

UDT:Equipment_Cmd────────────────────
{
  start:BOOL,stop:BOOL,hold:BOOL,unhold:BOOL,
  suspend:BOOL,unsuspend:BOOL,abort:BOOL,clear:BOOL,
  reset:BOOL,complete:BOOL,
  mode_request:DINT,
  custom:[BOOL]                  #equipment-specific
}

UDT:Equipment_Sts────────────────────
{
  ready:BOOL,running:BOOL,done:BOOL,
  faulted:BOOL,warning:BOOL,
  interlocked:BOOL,interlock_reason:DINT,
  runtime:TIME,cycle_count:UDINT,
  custom:[BOOL]
}

UDT:Equipment_Cfg────────────────────
{
  enabled:BOOL,
  sim_mode:BOOL,
  bypass_interlocks:BOOL,
  auto_reset:BOOL,
  timeouts:{starting:TIME,stopping:TIME,aborting:TIME},
  custom:ANY
}

UDT:Equipment_HMI────────────────────
{
  visible:BOOL,
  faceplate_id:STRING,
  color_override:DINT,
  blink:BOOL,
  nav_target:STRING
}
```

## ⚙️ LAYER 3: CONTROL MODULE UDTs
```
UDT:CM_Base──────────────────────────
{
  tag:STRING[32],
  desc:STRING[80],
  state:CM_State,
  mode:CM_Mode,
  fault:Fault_Data,
  sim:Sim_Data
}

UDT:CM_State─────────────────────────
{current:DINT,enum:{0:Off,1:Starting,2:Running,3:Stopping,4:Faulted}}

UDT:CM_Mode──────────────────────────
{current:DINT,enum:{0:OOS,1:Manual,2:Auto}}

UDT:Fault_Data───────────────────────
{
  active:BOOL,code:DINT,msg:STRING[80],
  timestamp:DT,ack:BOOL,reset:BOOL
}

UDT:Sim_Data─────────────────────────
{
  enable:BOOL,value:REAL,
  ramp_enable:BOOL,ramp_rate:REAL
}

UDT:CM_DiscreteOut───────────────────
extends:CM_Base
{
  cmd:BOOL,                      #command
  fbk:BOOL,                      #feedback
  fbk_time:TIME,                 #expected feedback time
  fail_to_state:BOOL,            #0=off,1=on
  output→:BOOL                   #to physical output
}

UDT:CM_DiscreteIn────────────────────
extends:CM_Base
{
  input←:BOOL,                   #from physical input
  value:BOOL,                    #processed value
  invert:BOOL,
  debounce:TIME,
  on_delay:TIME,
  off_delay:TIME
}

UDT:CM_AnalogIn──────────────────────
extends:CM_Base
{
  input←:INT,                    #raw from AI card
  raw:INT,                       #raw preserved
  value:REAL,                    #scaled EU
  scale:{raw_lo:INT,raw_hi:INT,eng_lo:REAL,eng_hi:REAL,clamp:BOOL},
  filter:{enable:BOOL,factor:REAL},
  alarms:{hihi:Alarm_SP,hi:Alarm_SP,lo:Alarm_SP,lolo:Alarm_SP,roc:Alarm_SP}
}

UDT:CM_AnalogOut─────────────────────
extends:CM_Base
{
  sp:REAL,                       #setpoint EU
  value:REAL,                    #actual output EU
  output→:INT,                   #to AO card
  scale:{eng_lo:REAL,eng_hi:REAL,raw_lo:INT,raw_hi:INT},
  ramp:{enable:BOOL,rate:REAL},
  limits:{lo:REAL,hi:REAL}
}

UDT:CM_Motor─────────────────────────
extends:CM_Base
{
  cmd:{start:BOOL,stop:BOOL,jog:BOOL,reset:BOOL},
  sts:{running:BOOL,ready:BOOL,faulted:BOOL,current:REAL,runtime:TIME},
  cfg:{start_delay:TIME,stop_delay:TIME,jog_time:TIME,overcurrent:REAL},
  io:{run_cmd→:BOOL,run_fbk←:BOOL,fault←:BOOL,current←:INT}
}

UDT:CM_Valve─────────────────────────
extends:CM_Base
{
  cmd:{open:BOOL,close:BOOL},
  sts:{opened:BOOL,closed:BOOL,transit:BOOL,faulted:BOOL},
  cfg:{open_time:TIME,close_time:TIME,fail_pos:DINT},
  io:{open_cmd→:BOOL,close_cmd→:BOOL,open_fbk←:BOOL,close_fbk←:BOOL}
}

UDT:CM_VFD───────────────────────────
extends:CM_Base
{
  cmd:{run:BOOL,stop:BOOL,fwd:BOOL,rev:BOOL,speed_sp:REAL,reset:BOOL},
  sts:{running:BOOL,at_speed:BOOL,faulted:BOOL,speed_act:REAL,current:REAL,torque:REAL},
  cfg:{min_speed:REAL,max_speed:REAL,accel:TIME,decel:TIME},
  io:{run_cmd→:BOOL,speed_sp→:INT,speed_act←:INT,fault←:BOOL}
}

UDT:CM_PID───────────────────────────
extends:CM_Base
{
  sp:REAL,                       #setpoint
  pv:REAL,                       #process variable
  cv:REAL,                       #control variable (output)
  tune:{kp:REAL,ki:REAL,kd:REAL,ts:TIME},
  limits:{cv_hi:REAL,cv_lo:REAL,db:REAL},
  sts:{error:REAL,p_term:REAL,i_term:REAL,d_term:REAL,saturated:BOOL},
  cfg:{reverse:BOOL,anti_windup:BOOL,track_enable:BOOL,track_value:REAL}
}
```

## 🚨 LAYER 4: ALARM UDTs
```
UDT:Alarm_SP─────────────────────────
{
  enable:BOOL,
  sp:REAL,
  deadband:REAL,
  delay:TIME,
  priority:DINT,                 #1-4 per ISA-18.2
  class:STRING[20]
}

UDT:Alarm_Instance───────────────────
{
  id:UDINT,
  tag:STRING[40],
  type:DINT,                     #enum:HI,HIHI,LO,LOLO,DEV,ROG,DISC
  priority:DINT,
  state:Alarm_State,
  sp:REAL,
  pv:REAL,
  times:{in:DT,ack:DT,out:DT},
  user_ack:STRING[20],
  msg:STRING[80],
  help:STRING[255],
  shelved:BOOL,
  shelve_until:DT,
  suppressed:BOOL
}

UDT:Alarm_State──────────────────────
{
  current:DINT,
  bits:{active:BOOL,acked:BOOL,shelved:BOOL,suppressed:BOOL,disabled:BOOL},
  enum:{0:NORM,1:UNACK,2:ACKED,3:RTN_UNACK,4:SHELVED,5:SUPPRESSED,6:DISABLED}
}

UDT:Alarm_Summary────────────────────
{
  total_active:UDINT,
  unacked:UDINT,
  by_priority:[UDINT,UDINT,UDINT,UDINT],  #P1,P2,P3,P4
  most_recent:Alarm_Instance,
  oldest_unacked:Alarm_Instance
}
```

## 📜 LAYER 5: RECIPE/BATCH UDTs
```
UDT:Phase_Base───────────────────────
{
  id:DINT,
  name:STRING[40],
  state:Phase_State,
  owner:UDINT,                   #batch ID
  unit:STRING[40],               #allocated unit
  step:DINT,                     #current step
  params:Phase_Params,
  report:Phase_Report,
  times:{start:DT,end:DT,running:TIME,held:TIME}
}

UDT:Phase_State──────────────────────
{
  current:DINT,
  cmd:DINT,
  enum:{0:Idle,1:Running,2:Complete,3:Pausing,4:Paused,5:Holding,6:Held,7:Restarting,8:Stopping,9:Stopped,10:Aborting,11:Aborted}
}

UDT:Phase_Params─────────────────────
{
  target_temp:REAL,
  target_time:TIME,
  target_level:REAL,
  target_speed:REAL,
  target_pressure:REAL,
  custom:ARRAY[0..19]OF REAL
}

UDT:Phase_Report─────────────────────
{
  actual_temp:REAL,
  actual_time:TIME,
  actual_level:REAL,
  material_in:REAL,
  material_out:REAL,
  energy:REAL,
  custom:ARRAY[0..19]OF REAL
}

UDT:Batch────────────────────────────
{
  id:UDINT,
  recipe_id:STRING[40],
  recipe_ver:STRING[20],
  product:STRING[40],
  lot:STRING[40],
  state:Batch_State,
  times:{create:DT,start:DT,end:DT},
  unit_allocs:[{unit:STRING,start:DT,end:DT}],
  phases:[Phase_Base],
  params:Batch_Params,
  report:Batch_Report
}

UDT:Batch_State──────────────────────
{current:DINT,enum:{0:Created,1:Ready,2:Running,3:Held,4:Complete,5:Aborted}}

UDT:Batch_Params─────────────────────
{
  size:REAL,
  size_unit:STRING[10],
  priority:DINT,
  custom:ARRAY[0..49]OF {name:STRING,value:REAL,unit:STRING}
}

UDT:Batch_Report─────────────────────
{
  actual_size:REAL,
  yield:REAL,
  quality_grade:STRING[10],
  deviations:UDINT,
  events:[{ts:DT,type:DINT,msg:STRING}]
}
```

## 🔌 LAYER 6: IO UDTs
```
UDT:IO_Card──────────────────────────
{
  slot:DINT,
  type:DINT,                     #enum:DI,DO,AI,AO,RTD,TC,HART,etc
  vendor:STRING[20],
  model:STRING[40],
  channels:DINT,
  status:IO_Status,
  config:IO_Config,
  points:[IO_Point]
}

UDT:IO_Status────────────────────────
{
  ok:BOOL,
  fault:BOOL,
  comm_fault:BOOL,
  config_fault:BOOL,
  diag:[DINT]
}

UDT:IO_Config────────────────────────
{
  sample_rate:TIME,
  filter:DINT,
  range:DINT,
  wire_type:DINT,                #2-wire,3-wire,4-wire
  burnout:DINT                   #upscale,downscale
}

UDT:IO_Point─────────────────────────
{
  channel:DINT,
  tag:STRING[40],
  desc:STRING[80],
  type:DINT,                     #DI,DO,AI,AO
  raw:DINT,
  value:REAL,
  quality:DINT,
  alarm:BOOL,
  wire_fault:BOOL
}

UDT:IO_Map───────────────────────────
{
  plc_addr:STRING[20],           #%I0.0,%IW10,etc
  card:DINT,                     #slot/rack
  channel:DINT,
  tag:STRING[40],                #linked CM tag
  desc:STRING[80]
}
```

## 🔄 LAYER 7: VENDOR CONVERTERS
```
CONVERTER:AB→UDT─────────────────────
source:.L5X,.ACD
parse:XML→DOM→walk tags→emit UDT
mapping:{
  AOI→UDT:Method,
  UDT→UDT,
  Tag→Field,
  Program→Namespace,
  Routine→Method,
  Rung→Statement(IL)
}

CONVERTER:Siemens→UDT────────────────
source:.zap16,.xml(TIA export)
parse:XML→blocks→emit UDT
mapping:{
  FB→UDT:Method,
  DB→UDT,
  UDT→UDT,
  Tag→Field,
  OB→Namespace,
  FC→Method
}

CONVERTER:Codesys→UDT────────────────
source:.project,.xml(PLCopen)
parse:PLCopen XML→emit UDT
mapping:{
  FUNCTION_BLOCK→UDT:Method,
  STRUCT→UDT,
  VAR→Field,
  PROGRAM→Namespace,
  FUNCTION→Method
}

CONVERTER:Beckhoff→UDT───────────────
source:.tsproj,.xml
parse:TwinCAT XML→emit UDT
#same as Codesys(IEC 61131-3)

CONVERTER:Omron→UDT──────────────────
source:.cxp,.smc2
parse:binary/XML→emit UDT
mapping:{
  FB→UDT:Method,
  Structure→UDT,
  Variable→Field,
  Task→Namespace
}

CONVERTER:Mitsubishi→UDT─────────────
source:.gx3,GX Works export
parse:proprietary→emit UDT
mapping:{
  FB→UDT:Method,
  Structure→UDT,
  Device→Field,
  Program→Namespace
}

REVERSE_CONVERTERS───────────────────
UDT→AB:emit .L5X XML
UDT→Siemens:emit TIA XML
UDT→Codesys:emit PLCopen XML
UDT→Beckhoff:emit PLCopen XML
UDT→Omron:emit .cxp XML
UDT→Mitsubishi:emit GX XML
```

## 📂 GIT STRUCTURE
```
gitplc-project/
├─.git/
├─.gitplc/
│ ├─config.json──────────project config
│ ├─vendor-map.json──────vendor↔UDT mappings
│ └─hooks/───────────────pre-commit validation
├─equipment/
│ ├─area1/
│ │ ├─line1/
│ │ │ ├─cell1/
│ │ │ │ ├─unit1.udt.json
│ │ │ │ └─unit2.udt.json
│ │ │ └─_line1.udt.json
│ │ └─_area1.udt.json
│ └─_equipment.udt.json
├─types/
│ ├─base/
│ │ ├─CM_Base.udt.json
│ │ ├─CM_Motor.udt.json
│ │ ├─CM_Valve.udt.json
│ │ └─...
│ ├─custom/
│ │ └─MySpecialValve.udt.json
│ └─_types.index.json
├─io/
│ ├─rack1.io.json
│ ├─rack2.io.json
│ └─_io.map.json
├─recipes/
│ ├─product_a.recipe.json
│ └─product_b.recipe.json
├─alarms/
│ └─alarm_config.json
├─exports/
│ ├─ab/────────────────AB .L5X files
│ ├─siemens/───────────TIA exports
│ └─codesys/───────────PLCopen XML
└─README.md
```

## 📦 FILE FORMATS
```
*.udt.json───────────────────────────
{
  "$schema":"gitplc/udt/v1",
  "id":"uuid",
  "name":"CM_Motor",
  "version":"1.2.0",
  "base":"CM_Base",
  "fields":[...],
  "methods":[...],
  "meta":{...}
}

*.io.json────────────────────────────
{
  "$schema":"gitplc/io/v1",
  "rack":1,
  "cards":[{slot,type,channels,points:[...]}]
}

*.recipe.json────────────────────────
{
  "$schema":"gitplc/recipe/v1",
  "id":"product_a",
  "version":"2.0.0",
  "procedure":{...},
  "formula":{...}
}

.gitplc/config.json──────────────────
{
  "project":"MyPlant",
  "default_vendor":"ab",
  "isa_level":"Unit",
  "validation":"strict",
  "export_on_commit":true
}
```

## 🛠️ CLI
```bash
#init project
gitplc init --vendor ab

#import from PLC
gitplc import program.L5X --vendor ab
gitplc import project.zap16 --vendor siemens

#export to PLC
gitplc export --vendor ab --output exports/ab/
gitplc export --vendor siemens --output exports/siemens/

#convert between vendors
gitplc convert exports/ab/program.L5X --to siemens

#validate ISA compliance
gitplc validate --isa-88 --isa-18.2

#diff versions
gitplc diff HEAD~1 HEAD --udt CM_Motor

#merge branches
gitplc merge feature/new-motor --resolve=theirs

#simulate
gitplc sim equipment/area1/line1/cell1/unit1.udt.json

#sync to PLC(live)
gitplc sync --target 192.168.1.10 --vendor ab --mode upload
gitplc sync --target 192.168.1.10 --vendor ab --mode download

#generate docs
gitplc docs --format html --output docs/
```

## 🔄 WORKFLOWS
```
WORKFLOW:Import→Edit→Export──────────
1.gitplc import program.L5X
2.edit types/*.udt.json(VSCode,etc)
3.git commit -m "updated motor logic"
4.gitplc export --vendor ab

WORKFLOW:Cross-Platform────────────
1.gitplc import siemens_project.zap16 --vendor siemens
2.gitplc export --vendor ab
3.compare/merge with existing AB project

WORKFLOW:Multi-Site─────────────────
1.git clone gitplc-standard-library
2.fork/branch per site
3.customize equipment/types
4.PR back common improvements

WORKFLOW:CI/CD──────────────────────
on push:
  gitplc validate --strict
  gitplc export --all-vendors
  gitplc sim --test-suite
  archive exports/
```

## 🏗️ STRUCT
```
gitplc/
├─src/
│ ├─core/
│ │ ├─udt.js─────────────UDT class,validate,serialize
│ │ ├─field.js───────────Field class,type resolution
│ │ ├─project.js─────────Project class,file management
│ │ └─isa.js─────────────ISA-88/95 hierarchy helpers
│ ├─converters/
│ │ ├─ab/
│ │ │ ├─import.js────────.L5X→UDT
│ │ │ └─export.js────────UDT→.L5X
│ │ ├─siemens/
│ │ │ ├─import.js────────.zap16→UDT
│ │ │ └─export.js────────UDT→TIA XML
│ │ ├─codesys/
│ │ │ ├─import.js────────PLCopen→UDT
│ │ │ └─export.js────────UDT→PLCopen
│ │ ├─beckhoff/
│ │ ├─omron/
│ │ └─mitsubishi/
│ ├─validators/
│ │ ├─isa88.js───────────S88 compliance
│ │ ├─isa95.js───────────S95 compliance
│ │ ├─isa18.js───────────Alarm compliance
│ │ └─types.js───────────Type checking
│ ├─diff/
│ │ ├─udt-diff.js────────Structural diff
│ │ ├─merge.js───────────3-way merge
│ │ └─conflict.js────────Conflict resolution
│ ├─sim/
│ │ ├─runtime.js─────────UDT interpreter
│ │ ├─io-sim.js──────────Simulated IO
│ │ └─hmi-sim.js─────────Web-based HMI
│ ├─sync/
│ │ ├─ab-comms.js────────EtherNet/IP
│ │ ├─siemens-comms.js───S7 protocol
│ │ └─codesys-comms.js───Codesys gateway
│ ├─cli/
│ │ ├─index.js───────────CLI entry
│ │ ├─commands/──────────Command implementations
│ │ └─prompts.js─────────Interactive prompts
│ └─vscode/
│   ├─extension.js───────VSCode extension
│   ├─udt-language.js────Syntax highlighting
│   └─intellisense.js────Autocomplete
├─schemas/
│ ├─udt.schema.json
│ ├─io.schema.json
│ └─recipe.schema.json
├─templates/
│ ├─CM_Motor.udt.json
│ ├─CM_Valve.udt.json
│ └─...
├─tests/
├─package.json
└─README.md
```

## 🎯 AGENT_INSTRUCTIONS
```
α:PARSE→read vendor format,walk AST,emit UDT JSON,preserve comments
β:GEN→read UDT JSON,emit vendor format,validate syntax,format output
γ:DIFF→load two versions,structural compare,emit changeset,highlight
δ:MERGE→3-way merge,detect conflicts,auto-resolve safe,prompt unsafe
ε:VALIDATE→check ISA-88/95/18.2,type check,reference check,report
ζ:MAP→IO address↔tag path,generate map file,update on change
η:SIM→interpret UDT,simulate IO,run logic,web HMI,mock sensors
θ:SYNC→connect PLC,upload/download,compare online↔offline,safe transfer
ι:CONVERT→vendor A→UDT→vendor B,preserve semantics,warn on loss
κ:DOC→UDT→markdown,UDT→HTML,generate diagrams,export PDF
```

## 🏁 GOAL
```
UNIVERSAL namespace:any PLC→UDT→any PLC
ISA structured:88/95 hierarchy,PackML states
VERSION control:git,diff,merge,branch
VENDOR agnostic:AB,Siemens,Codesys,Beckhoff,Omron,Mitsubishi,...
TRANSFER:UDT is the interchange format
VALIDATE:ISA compliance built-in
SIMULATE:test without hardware
SYNC:bidirectional PLC↔git
🔧
```
