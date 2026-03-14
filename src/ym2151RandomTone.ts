// ym2151RandomTone.ts
// Vendored from cat2151/web-ym2151 src/random-tone/types.ts and src/random-tone/index.ts
// Track upstream SHA: see src/random-tone/index.ts in web-ym2151 main branch
// Do NOT modify vendored functions — report issues to upstream instead.

// ---- Vendored types (from src/random-tone/types.ts) ----

interface ParamRange {
  min: number;
  max: number;
}

interface OperatorRandomConfig {
  TL?: ParamRange;
  AR?: ParamRange;
  DR?: ParamRange;
  SR?: ParamRange;
  RR?: ParamRange;
  SL?: ParamRange;
  KS?: ParamRange;
  MUL?: ParamRange;
  DT1?: ParamRange;
}

interface GlobalRandomConfig {
  CON?: ParamRange;
  FL?: ParamRange;
  NOTE?: { enabled: boolean } | ParamRange;
}

interface RandomConfig {
  commonOperatorParams?: OperatorRandomConfig;
  operators?: OperatorRandomConfig[];
  global: GlobalRandomConfig;
}

// ---- Vendored functions (from src/random-tone/index.ts) ----

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomValue(range: ParamRange | undefined): number | undefined {
  if (!range) return undefined;
  return randomInt(range.min, range.max);
}

function formatParam(name: string, value: number | undefined): string | undefined {
  if (value === undefined) return undefined;
  const hexValue = value.toString(16).toUpperCase();
  const paddedValue = hexValue.padStart(2, '0');
  return `${name}=${paddedValue}`;
}

function getOperatorConfig(config: RandomConfig, operatorIndex: number): OperatorRandomConfig {
  const common = config.commonOperatorParams || {};
  const specific = config.operators?.[operatorIndex] || {};
  return {
    TL: specific.TL ?? common.TL,
    AR: specific.AR ?? common.AR,
    DR: specific.DR ?? common.DR,
    SR: specific.SR ?? common.SR,
    RR: specific.RR ?? common.RR,
    SL: specific.SL ?? common.SL,
    KS: specific.KS ?? common.KS,
    MUL: specific.MUL ?? common.MUL,
    DT1: specific.DT1 ?? common.DT1,
  };
}

const CARRIERS_PER_CON: ReadonlyArray<ReadonlyArray<number>> = [
  [3],          // CON=0
  [3],          // CON=1
  [3],          // CON=2
  [3],          // CON=3
  [2, 3],       // CON=4
  [1, 2, 3],    // CON=5
  [1, 2, 3],    // CON=6
  [0, 1, 2, 3], // CON=7
];

const MODULATOR_TL_PER_CON: ReadonlyArray<number> = [
  0x20, // CON=0
  0x20, // CON=1
  0x20, // CON=2
  0x20, // CON=3
  0x18, // CON=4
  0x10, // CON=5
  0x10, // CON=6
  0x00, // CON=7
];

function isCarrierOp(con: number, operatorIndex: number): boolean {
  return (CARRIERS_PER_CON[con] ?? []).includes(operatorIndex);
}

function getModulatorTLForCON(con: number): number {
  return MODULATOR_TL_PER_CON[con] ?? 0x00;
}

export function getDefaultConfig(): RandomConfig {
  return {
    commonOperatorParams: {
      TL: { min: 0, max: 0 },
      AR: { min: 5, max: 31 },
      DR: { min: 0, max: 9 },
      SR: { min: 0, max: 0 },
      RR: { min: 0, max: 0 },
      SL: { min: 15, max: 15 },
      KS: { min: 0, max: 3 },
      MUL: { min: 0, max: 15 },
      DT1: { min: 0, max: 7 },
    },
    global: {
      CON: { min: 0, max: 7 },
      FL: { min: 0, max: 7 },
      NOTE: { enabled: false },
    },
  };
}

export function generateRandomToneString(config: RandomConfig, currentContent?: string): string {
  const lines: string[] = [];

  const conRaw = randomValue(config.global.CON);
  let con: number;
  if (conRaw !== undefined) {
    con = conRaw & 0x7;
  } else {
    const match = currentContent?.match(/CON=([0-9A-Fa-f]+)/i);
    con = match ? (parseInt(match[1], 16) & 0x7) : 7;
  }
  const modulatorTL = getModulatorTLForCON(con);

  for (let i = 0; i < 4; i++) {
    const opConfig = getOperatorConfig(config, i);
    const parts: string[] = [];

    const tl = formatParam('TL', isCarrierOp(con, i) ? 0 : modulatorTL);
    if (tl) parts.push(tl);

    const ar = formatParam('AR', randomValue(opConfig.AR));
    if (ar) parts.push(ar);

    const dr = formatParam('DR', randomValue(opConfig.DR));
    if (dr) parts.push(dr);

    const sr = formatParam('SR', randomValue(opConfig.SR));
    if (sr) parts.push(sr);

    const rr = formatParam('RR', randomValue(opConfig.RR));
    if (rr) parts.push(rr);

    const sl = formatParam('SL', randomValue(opConfig.SL));
    if (sl) parts.push(sl);

    const ks = randomValue(opConfig.KS);
    if (ks !== undefined) parts.push(`KS=${ks.toString(16).toUpperCase()}`);

    const mul = formatParam('MUL', randomValue(opConfig.MUL));
    if (mul) parts.push(mul);

    const dt1 = randomValue(opConfig.DT1);
    if (dt1 !== undefined) parts.push(`DT1=${dt1.toString(16).toUpperCase()}`);

    lines.push(parts.join(' '));
  }

  const globalParts: string[] = [];

  if (conRaw !== undefined) {
    globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
  } else if (currentContent?.match(/CON=/i)) {
    globalParts.push(`CON=${con.toString(16).toUpperCase()}`);
  }

  const fl = randomValue(config.global.FL);
  if (fl !== undefined) globalParts.push(`FL=${fl.toString(16).toUpperCase()}`);

  const noteConfig = config.global.NOTE;
  if (noteConfig) {
    const hasMinMax = 'min' in noteConfig && 'max' in noteConfig;
    const isEnabled = 'enabled' in noteConfig && noteConfig.enabled;

    if (hasMinMax) {
      const note = randomValue(noteConfig as ParamRange);
      if (note !== undefined) {
        globalParts.push(`NOTE=${note.toString(16).toUpperCase().padStart(2, '0')}`);
      }
    } else if (!isEnabled) {
      const noteMatch = currentContent?.match(/NOTE=([0-9A-F]+)/i);
      if (noteMatch) {
        globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
      } else {
        globalParts.push('NOTE=4A');
      }
    }
  } else {
    const noteMatch = currentContent?.match(/NOTE=([0-9A-F]+)/i);
    if (noteMatch) {
      globalParts.push(`NOTE=${noteMatch[1].toUpperCase()}`);
    } else {
      globalParts.push('NOTE=4A');
    }
  }

  lines.push(globalParts.join(' '));
  return lines.join('\n');
}

// ---- Local helpers: convert tone string to YM2151 register events ----

interface OperatorParams {
  TL?: number;
  AR?: number;
  DR?: number;
  SR?: number;
  RR?: number;
  SL?: number;
  KS?: number;
  MUL?: number;
  DT1?: number;
}

interface GlobalParams {
  con: number;
  fl: number;
}

interface ToneEvent {
  time: number;
  addr: string;
  data: string;
}

export interface ToneAttachmentEntry {
  ProgramChange: number;
  Tone: { events: ToneEvent[] };
}

function toHex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
}

function parseParamLine(line: string): Record<string, number> {
  const params: Record<string, number> = {};
  const parts = line.toUpperCase().split(/\s+/);
  for (const part of parts) {
    const match = part.match(/^([A-Z0-9]+)=([0-9A-F]+)$/);
    if (match) {
      params[match[1]] = parseInt(match[2], 16);
    }
  }
  return params;
}

// YM2151 hardware operator register order mapping:
// Display order [OP0, OP1, OP2, OP3] → hardware slot [0, 2, 1, 3]
const REG_FROM_O1_O4 = [0, 2, 1, 3];

function getDefaultOperatorParams(): OperatorParams {
  return { TL: 0x00, AR: 0x1F, DR: 0x10, SR: 0x00, RR: 0x07, SL: 0x00, KS: 0, MUL: 0x01, DT1: 3 };
}

/**
 * Generate YM2151 tone register events for channel 0 (tone definition only).
 * Does NOT include KC (key code), KF (key fraction), or key-on events —
 * those are handled by the MIDI event stream.
 */
function generateToneEvents(operators: OperatorParams[], globalParams: GlobalParams): ToneEvent[] {
  const events: ToneEvent[] = [];

  // 0x20: RL/FL/CON for channel 0 (RL=11 = stereo, FL=feedback, CON=algorithm)
  const rlFlCon = 0xC0 | ((globalParams.fl & 0x7) << 3) | (globalParams.con & 0x7);
  events.push({ time: 0.0, addr: '0x20', data: toHex(rlFlCon) });

  // 0x38: PMS/AMS for channel 0 (disable LFO pitch/amplitude modulation)
  events.push({ time: 0.0, addr: '0x38', data: '0x00' });

  for (let op = 0; op < 4; op++) {
    const params = operators[op] ?? getDefaultOperatorParams();
    const opOffset = REG_FROM_O1_O4[op] * 8;

    // DT1/MUL (0x40 + opOffset)
    const dt1 = params.DT1 ?? 3;
    const mul = params.MUL ?? 1;
    const dt1Mul = ((dt1 & 0x7) << 4) | (mul & 0x0F);
    events.push({ time: 0.0, addr: toHex(0x40 + opOffset), data: toHex(dt1Mul) });

    // TL (0x60 + opOffset)
    const tl = params.TL ?? 0x00;
    events.push({ time: 0.0, addr: toHex(0x60 + opOffset), data: toHex(tl & 0x7F) });

    // KS/AR (0x80 + opOffset)
    const ks = params.KS ?? 0;
    const ar = params.AR ?? 0x1F;
    const ksAr = ((ks & 0x3) << 6) | (ar & 0x1F);
    events.push({ time: 0.0, addr: toHex(0x80 + opOffset), data: toHex(ksAr) });

    // AMS-EN/D1R (0xA0 + opOffset)
    const dr = params.DR ?? 0x10;
    events.push({ time: 0.0, addr: toHex(0xA0 + opOffset), data: toHex(dr & 0x1F) });

    // DT2/D2R (0xC0 + opOffset)
    const sr = params.SR ?? 0x00;
    events.push({ time: 0.0, addr: toHex(0xC0 + opOffset), data: toHex(sr & 0x1F) });

    // D1L/RR (0xE0 + opOffset)
    const sl = params.SL ?? 0x00;
    const rr = params.RR ?? 0x07;
    const slRr = ((sl & 0x0F) << 4) | (rr & 0x0F);
    events.push({ time: 0.0, addr: toHex(0xE0 + opOffset), data: toHex(slRr) });
  }

  return events;
}

/**
 * Parse a tone string (as produced by generateRandomToneString) into YM2151 register events.
 */
function toneStringToEvents(toneString: string): ToneEvent[] {
  const lines = toneString.trim().split('\n').filter(l => l.trim());
  const operators: OperatorParams[] = [];
  const globalParams: GlobalParams = { con: 7, fl: 0 };

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes('CON=') || upper.includes('FL=') || upper.includes('NOTE=')) {
      const p = parseParamLine(line);
      if (p.CON !== undefined) globalParams.con = p.CON;
      if (p.FL !== undefined) globalParams.fl = p.FL;
      // NOTE is ignored: pitch is determined by MIDI key-code events
    } else {
      operators.push(parseParamLine(line));
    }
  }

  while (operators.length < 4) {
    operators.push(getDefaultOperatorParams());
  }

  return generateToneEvents(operators, globalParams);
}

/**
 * Generate a random YM2151 tone and return it as an attachment object
 * (compatible with the PIANO_PRESET_ATTACHMENT_OBJ format used by
 * smf_to_ym2151_json_with_attachment).
 *
 * @returns Object containing the attachment array and the generated tone string.
 */
export function generateRandomToneAttachment(): { attachment: ToneAttachmentEntry[]; toneString: string } {
  const config = getDefaultConfig();
  const toneString = generateRandomToneString(config);
  const events = toneStringToEvents(toneString);
  const attachment: ToneAttachmentEntry[] = [
    {
      ProgramChange: 0,
      Tone: { events },
    },
  ];
  return { attachment, toneString };
}
