// Lightweight math parser - no external deps needed for basic cases.
// Handles: arithmetic, %, variables, and simple algebra.

const TIMER_RE = /^timer\s+(pomo|pomodoro|\d+(?::\d+)?(?:m|min|s|sec|h|hr)?)\s*$/i;
const SECTION_RE = /^#{1,3}\s+.+/;
const VAR_ASSIGN_RE = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/;
const VAR_NAME_RE = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

// Substitute known variables into an expression string
function substituteVars(expr: string, vars: Record<string, number>): string {
  return expr.replace(VAR_NAME_RE, (match) => {
    if (match === 'x') return '*'; // keep x as multiply shorthand
    return vars[match] !== undefined ? String(vars[match]) : match;
  });
}

// Basic math evaluation using Function() — safe subset, no DOM access
function evalMath(expr: string, vars: Record<string, number> = {}): number {
  // Substitute variables first
  let cleaned = substituteVars(expr, vars);

  // Replace common math shorthands
  cleaned = cleaned
    .replace(/\^/g, '**')
    .replace(/(\d)\s*%(?!\s*\d)/g, '$1/100')   // trailing % = divide by 100
    .replace(/(\d)\s*%\s*of\s*/gi, '$1/100*')  // "20% of 500"
    .replace(/\bx\b/gi, '*')
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/,/g, '')                          // 1,000 → 1000
    .trim();

  if (!/^[\d\s\+\-\*\/\.\(\)\%\*]+$/.test(cleaned)) {
    throw new Error('unsupported');
  }

  // eslint-disable-next-line no-new-func
  const result = new Function(`"use strict"; return (${cleaned})`)();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('invalid');
  return result;
}

function formatResult(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  // Up to 6 sig figs, strip trailing zeros
  return parseFloat(n.toPrecision(6)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function parseTimerLine(line: string): { label: string; seconds: number } | null {
  const m = line.match(TIMER_RE);
  if (!m) return null;
  const val = m[1].toLowerCase();

  if (val === 'pomo' || val === 'pomodoro') {
    return { label: 'Pomodoro', seconds: 25 * 60 };
  }

  // hh:mm or mm:ss format
  if (val.includes(':')) {
    const parts = val.split(':').map(Number);
    const seconds = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    return { label: `${val}`, seconds };
  }

  // number with optional unit
  const numMatch = val.match(/^(\d+(?:\.\d+)?)(m|min|s|sec|h|hr)?$/);
  if (!numMatch) return null;
  const n = parseFloat(numMatch[1]);
  const unit = numMatch[2] ?? 'm';

  let seconds = 0;
  if (unit.startsWith('h')) seconds = n * 3600;
  else if (unit.startsWith('s')) seconds = n;
  else seconds = n * 60; // default: minutes

  return { label: `${n}${unit === 'm' || unit === 'min' ? ' min' : unit.startsWith('h') ? ' hr' : ' sec'}`, seconds: Math.round(seconds) };
}

// ---------------------------------------------------------------------------
// Date math
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Parse natural date strings like "Dec 25", "Dec 25 2027", "2026-12-25", "next friday"
function parseDate(s: string): Date | null {
  const t = s.trim().toLowerCase();

  if (t === 'today')     return today();
  if (t === 'tomorrow')  { const d = today(); d.setDate(d.getDate() + 1); return d; }
  if (t === 'yesterday') { const d = today(); d.setDate(d.getDate() - 1); return d; }

  // "next <weekday>"
  const nextDay = t.match(/^next\s+(\w+)$/);
  if (nextDay && WEEKDAYS[nextDay[1]] !== undefined) {
    const d = today();
    const target = WEEKDAYS[nextDay[1]];
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // ISO: 2026-12-25
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);

  // "Dec 25" or "Dec 25 2027"
  const mdy = t.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (mdy && MONTHS[mdy[1]] !== undefined) {
    const year = mdy[3] ? +mdy[3] : new Date().getFullYear();
    return new Date(year, MONTHS[mdy[1]], +mdy[2]);
  }

  // "25 Dec" or "25 Dec 2027"
  const dmy = t.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (dmy && MONTHS[dmy[2]] !== undefined) {
    const year = dmy[3] ? +dmy[3] : new Date().getFullYear();
    return new Date(year, MONTHS[dmy[2]], +dmy[1]);
  }

  return null;
}

type DateResult = { result: string; numeric?: number };

function parseDateMath(line: string): DateResult | null {
  const s = line.trim().toLowerCase();

  // "today" / "tomorrow" / "yesterday" / "next friday"
  const bare = parseDate(s);
  if (bare) return { result: fmtDate(bare) };

  // "today + N days/weeks/months/years"
  // "today - N days/weeks/months/years"
  let m = s.match(/^(today|tomorrow|yesterday)\s*([\+\-])\s*(\d+)\s*(day|days|week|weeks|month|months|year|years)$/);
  if (m) {
    const base = parseDate(m[1])!;
    const sign = m[2] === '+' ? 1 : -1;
    const n = +m[3] * sign;
    const unit = m[4];
    if (unit.startsWith('day'))   base.setDate(base.getDate() + n);
    if (unit.startsWith('week'))  base.setDate(base.getDate() + n * 7);
    if (unit.startsWith('month')) base.setMonth(base.getMonth() + n);
    if (unit.startsWith('year'))  base.setFullYear(base.getFullYear() + n);
    return { result: fmtDate(base) };
  }

  // "days until <date>" / "weeks until <date>"
  m = s.match(/^(days?|weeks?)\s+until\s+(.+)$/);
  if (m) {
    const target = parseDate(m[2]);
    if (target) {
      const diff = diffDays(today(), target);
      const isWeeks = m[1].startsWith('week');
      const val = isWeeks ? +(diff / 7).toFixed(1) : diff;
      const unit = isWeeks ? (Math.abs(val) === 1 ? 'week' : 'weeks') : (Math.abs(diff) === 1 ? 'day' : 'days');
      return { result: `${val} ${unit}`, numeric: val };
    }
  }

  // "days since <date>"
  m = s.match(/^days?\s+since\s+(.+)$/);
  if (m) {
    const past = parseDate(m[1]);
    if (past) {
      const diff = diffDays(past, today());
      return { result: `${diff} ${diff === 1 ? 'day' : 'days'}`, numeric: diff };
    }
  }

  // "days between <date> and <date>"
  m = s.match(/^days?\s+between\s+(.+?)\s+and\s+(.+)$/);
  if (m) {
    const a = parseDate(m[1]);
    const b = parseDate(m[2]);
    if (a && b) {
      const diff = Math.abs(diffDays(a, b));
      return { result: `${diff} ${diff === 1 ? 'day' : 'days'}`, numeric: diff };
    }
  }

  // "age of YYYY-MM-DD" or "age of Month DD YYYY"
  m = s.match(/^age\s+of\s+(.+)$/);
  if (m) {
    const dob = parseDate(m[1]);
    if (dob) {
      const now = today();
      let age = now.getFullYear() - dob.getFullYear();
      const beforeBirthday = now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (beforeBirthday) age--;
      return { result: `${age} years`, numeric: age };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Unit conversions
// ---------------------------------------------------------------------------

// All units normalised to a base unit via multiply factor
// Base: metres (length), kg (weight), litres (volume), m² (area), m/s (speed)
const UNITS: Record<string, { base: string; factor: number }> = {
  // Length → metres
  km: { base: 'length', factor: 1000 },
  kilometer: { base: 'length', factor: 1000 },
  kilometers: { base: 'length', factor: 1000 },
  kilometre: { base: 'length', factor: 1000 },
  kilometres: { base: 'length', factor: 1000 },
  m: { base: 'length', factor: 1 },
  meter: { base: 'length', factor: 1 },
  meters: { base: 'length', factor: 1 },
  metre: { base: 'length', factor: 1 },
  metres: { base: 'length', factor: 1 },
  cm: { base: 'length', factor: 0.01 },
  centimeter: { base: 'length', factor: 0.01 },
  centimeters: { base: 'length', factor: 0.01 },
  mm: { base: 'length', factor: 0.001 },
  millimeter: { base: 'length', factor: 0.001 },
  millimeters: { base: 'length', factor: 0.001 },
  mile: { base: 'length', factor: 1609.344 },
  miles: { base: 'length', factor: 1609.344 },
  mi: { base: 'length', factor: 1609.344 },
  yard: { base: 'length', factor: 0.9144 },
  yards: { base: 'length', factor: 0.9144 },
  yd: { base: 'length', factor: 0.9144 },
  foot: { base: 'length', factor: 0.3048 },
  feet: { base: 'length', factor: 0.3048 },
  ft: { base: 'length', factor: 0.3048 },
  inch: { base: 'length', factor: 0.0254 },
  inches: { base: 'length', factor: 0.0254 },
  in: { base: 'length', factor: 0.0254 },
  nm: { base: 'length', factor: 1852 },           // nautical mile

  // Weight → kg
  kg: { base: 'weight', factor: 1 },
  kilogram: { base: 'weight', factor: 1 },
  kilograms: { base: 'weight', factor: 1 },
  g: { base: 'weight', factor: 0.001 },
  gram: { base: 'weight', factor: 0.001 },
  grams: { base: 'weight', factor: 0.001 },
  mg: { base: 'weight', factor: 0.000001 },
  milligram: { base: 'weight', factor: 0.000001 },
  milligrams: { base: 'weight', factor: 0.000001 },
  lb: { base: 'weight', factor: 0.453592 },
  lbs: { base: 'weight', factor: 0.453592 },
  pound: { base: 'weight', factor: 0.453592 },
  pounds: { base: 'weight', factor: 0.453592 },
  oz: { base: 'weight', factor: 0.0283495 },
  ounce: { base: 'weight', factor: 0.0283495 },
  ounces: { base: 'weight', factor: 0.0283495 },
  t: { base: 'weight', factor: 1000 },            // metric ton
  ton: { base: 'weight', factor: 1000 },
  tons: { base: 'weight', factor: 1000 },
  tonne: { base: 'weight', factor: 1000 },
  tonnes: { base: 'weight', factor: 1000 },

  // Volume → litres
  l: { base: 'volume', factor: 1 },
  liter: { base: 'volume', factor: 1 },
  liters: { base: 'volume', factor: 1 },
  litre: { base: 'volume', factor: 1 },
  litres: { base: 'volume', factor: 1 },
  ml: { base: 'volume', factor: 0.001 },
  milliliter: { base: 'volume', factor: 0.001 },
  milliliters: { base: 'volume', factor: 0.001 },
  gallon: { base: 'volume', factor: 3.78541 },
  gallons: { base: 'volume', factor: 3.78541 },
  gal: { base: 'volume', factor: 3.78541 },
  pint: { base: 'volume', factor: 0.473176 },
  pints: { base: 'volume', factor: 0.473176 },
  pt: { base: 'volume', factor: 0.473176 },
  cup: { base: 'volume', factor: 0.236588 },
  cups: { base: 'volume', factor: 0.236588 },
  floz: { base: 'volume', factor: 0.0295735 },

  // Area → m²
  sqm: { base: 'area', factor: 1 },
  sqkm: { base: 'area', factor: 1e6 },
  sqft: { base: 'area', factor: 0.092903 },
  sqmi: { base: 'area', factor: 2589988 },
  acre: { base: 'area', factor: 4046.86 },
  acres: { base: 'area', factor: 4046.86 },
  hectare: { base: 'area', factor: 10000 },
  hectares: { base: 'area', factor: 10000 },
  ha: { base: 'area', factor: 10000 },

  // Speed → m/s
  kmh: { base: 'speed', factor: 1 / 3.6 },
  kph: { base: 'speed', factor: 1 / 3.6 },
  mph: { base: 'speed', factor: 0.44704 },
  knot: { base: 'speed', factor: 0.514444 },
  knots: { base: 'speed', factor: 0.514444 },
  ms: { base: 'speed', factor: 1 },               // metres per second

  // Data → bytes
  b: { base: 'data', factor: 1 },
  byte: { base: 'data', factor: 1 },
  bytes: { base: 'data', factor: 1 },
  kb: { base: 'data', factor: 1024 },
  mb: { base: 'data', factor: 1024 ** 2 },
  gb: { base: 'data', factor: 1024 ** 3 },
  tb: { base: 'data', factor: 1024 ** 4 },
};

// Temperature handled separately (not just multiplicative)
function convertTemp(value: number, from: string, to: string): number | null {
  const f = from.toLowerCase().replace(/°/g, '').replace('degrees', '').trim();
  const t = to.toLowerCase().replace(/°/g, '').replace('degrees', '').trim();
  // Normalise to Celsius first
  let celsius: number;
  if (f === 'c' || f === 'celsius' || f === 'centigrade') celsius = value;
  else if (f === 'f' || f === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (f === 'k' || f === 'kelvin') celsius = value - 273.15;
  else return null;
  // Convert to target
  if (t === 'c' || t === 'celsius' || t === 'centigrade') return celsius;
  if (t === 'f' || t === 'fahrenheit') return celsius * 9 / 5 + 32;
  if (t === 'k' || t === 'kelvin') return celsius + 273.15;
  return null;
}

const TEMP_RE = /^(?:convert\s+)?([\d,\.]+)\s*°?\s*(c|f|k|celsius|fahrenheit|kelvin|centigrade)\s+(?:in|to)\s+°?\s*(c|f|k|celsius|fahrenheit|kelvin|centigrade)$/i;
const UNIT_RE  = /^(?:convert\s+)?([\d,\.]+)\s*([a-z²/]+)\s+(?:in|to)\s+([a-z²/]+)$/i;

function parseUnitConversion(line: string): { result: number; label: string } | null {
  const s = line.trim();

  // Temperature
  const tm = s.match(TEMP_RE);
  if (tm) {
    const val = parseFloat(tm[1].replace(/,/g, ''));
    const result = convertTemp(val, tm[2], tm[3]);
    if (result !== null) return { result, label: tm[3].toLowerCase().replace(/^\w/, c => c.toUpperCase()) };
  }

  // General units
  const um = s.match(UNIT_RE);
  if (!um) return null;
  const val = parseFloat(um[1].replace(/,/g, ''));
  const fromKey = um[2].toLowerCase();
  const toKey   = um[3].toLowerCase();
  const from = UNITS[fromKey];
  const to   = UNITS[toKey];
  if (!from || !to || from.base !== to.base) return null;
  const result = (val * from.factor) / to.factor;
  return { result, label: um[3] };
}

// ---------------------------------------------------------------------------
// Natural language → math expression
// Returns a numeric result directly, or null if the line isn't recognised
// ---------------------------------------------------------------------------
function parseNaturalLanguage(line: string, vars: Record<string, number>): number | null {
  const s = line.trim().toLowerCase();

  // Helper: resolve a token to a number (variable or literal)
  const num = (tok: string): number => {
    const t = tok.replace(/,/g, '').trim();
    if (vars[t] !== undefined) return vars[t];
    const n = parseFloat(t);
    if (!isNaN(n)) return n;
    throw new Error('not a number');
  };

  // "X% of Y"  — already handled in evalMath but catches natural phrasing too
  let m = s.match(/^([\d,\.]+)\s*%\s*of\s+([\w,\.]+)$/);
  if (m) return num(m[1]) / 100 * num(m[2]);

  // "what is X% of Y"
  m = s.match(/^what\s+is\s+([\d,\.]+)\s*%\s*of\s+([\w,\.]+)\??$/);
  if (m) return num(m[1]) / 100 * num(m[2]);

  // "split X by Y"  /  "divide X by Y"
  m = s.match(/^(?:split|divide)\s+([\w,\.]+)\s+(?:by|between|among)\s+([\w,\.]+)$/);
  if (m) return num(m[1]) / num(m[2]);

  // "X split Y ways"  /  "X divided by Y"
  m = s.match(/^([\w,\.]+)\s+(?:split|divided)\s+(?:by\s+)?([\w,\.]+)(?:\s+ways?)?$/);
  if (m) return num(m[1]) / num(m[2]);

  // "double X"  /  "triple X"  /  "half of X"
  m = s.match(/^(double|twice)\s+([\w,\.]+)$/);
  if (m) return num(m[2]) * 2;

  m = s.match(/^triple\s+([\w,\.]+)$/);
  if (m) return num(m[1]) * 3;

  m = s.match(/^half\s+(?:of\s+)?([\w,\.]+)$/);
  if (m) return num(m[1]) / 2;

  m = s.match(/^quarter\s+(?:of\s+)?([\w,\.]+)$/);
  if (m) return num(m[1]) / 4;

  // "X times Y"
  m = s.match(/^([\w,\.]+)\s+times\s+([\w,\.]+)$/);
  if (m) return num(m[1]) * num(m[2]);

  // "X plus Y"  /  "X minus Y"
  m = s.match(/^([\w,\.]+)\s+plus\s+([\w,\.]+)$/);
  if (m) return num(m[1]) + num(m[2]);

  m = s.match(/^([\w,\.]+)\s+minus\s+([\w,\.]+)$/);
  if (m) return num(m[1]) - num(m[2]);

  // "X percent"  → X / 100
  m = s.match(/^([\d,\.]+)\s*percent$/);
  if (m) return num(m[1]) / 100;

  // "discount X by Y%"
  m = s.match(/^discount\s+([\w,\.]+)\s+by\s+([\d,\.]+)\s*%$/);
  if (m) { const base = num(m[1]); return base - base * num(m[2]) / 100; }

  // "increase X by Y%"  /  "add Y% to X"
  m = s.match(/^(?:increase|raise|add)\s+([\w,\.]+)\s+by\s+([\d,\.]+)\s*%$/);
  if (m) { const base = num(m[1]); return base + base * num(m[2]) / 100; }

  m = s.match(/^add\s+([\d,\.]+)\s*%\s+to\s+([\w,\.]+)$/);
  if (m) { const base = num(m[2]); return base + base * num(m[1]) / 100; }

  // "X squared"  /  "X cubed"
  m = s.match(/^([\w,\.]+)\s+squared$/);
  if (m) { const v = num(m[1]); return v * v; }

  m = s.match(/^([\w,\.]+)\s+cubed$/);
  if (m) { const v = num(m[1]); return v * v * v; }

  return null;
}

export type LineType = 'text' | 'math' | 'math-error' | 'timer' | 'section' | 'var-assign' | 'date' | 'list-header' | 'list-item' | 'list-comment';

export interface ParsedLine {
  raw: string;
  type: LineType;
  result?: string;
  resultUnit?: string; // set for unit conversions
  varName?: string;    // set when type === 'var-assign'
  timerSeconds?: number;
  timerLabel?: string;
  checked?: boolean;   // set when type === 'list-item'
}

export interface ParseResult {
  lines: ParsedLine[];
  listMode: boolean;
  listTitle?: string;
}

// ---------------------------------------------------------------------------
// Running totals
// ---------------------------------------------------------------------------
function parseRunningTotal(line: string, results: number[]): number | null {
  const s = line.trim().toLowerCase();
  if (results.length === 0) return null;

  if (/^(total|sum)$/.test(s))
    return results.reduce((a, b) => a + b, 0);

  if (/^(average|avg|mean)$/.test(s))
    return results.reduce((a, b) => a + b, 0) / results.length;

  if (/^(count)$/.test(s))
    return results.length;

  if (/^(min|minimum)$/.test(s))
    return Math.min(...results);

  if (/^(max|maximum)$/.test(s))
    return Math.max(...results);

  // "sum of last N"  /  "average of last N"
  let m = s.match(/^(?:sum|total)\s+of\s+last\s+(\d+)$/);
  if (m) {
    const n = parseInt(m[1]);
    return results.slice(-n).reduce((a, b) => a + b, 0);
  }

  m = s.match(/^(?:average|avg|mean)\s+of\s+last\s+(\d+)$/);
  if (m) {
    const n = parseInt(m[1]);
    const slice = results.slice(-n);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  return null;
}

// Parse a single line given the current variable context (mutates vars on assignment)
function parseLine(raw: string, vars: Record<string, number>, results: number[]): ParsedLine {
  const trimmed = raw.trim();

  // Section heading
  if (SECTION_RE.test(trimmed)) {
    return { raw, type: 'section' };
  }

  // Timer command
  const timer = parseTimerLine(trimmed);
  if (timer) {
    return { raw, type: 'timer', timerSeconds: timer.seconds, timerLabel: timer.label };
  }

  // Date math
  try {
    const dr = parseDateMath(trimmed);
    if (dr !== null) {
      if (dr.numeric !== undefined) results.push(dr.numeric);
      return { raw, type: 'date', result: dr.result };
    }
  } catch { /* not date math */ }

  // Unit conversions
  try {
    const uc = parseUnitConversion(trimmed);
    if (uc !== null) {
      results.push(uc.result);
      return { raw, type: 'math', result: formatResult(uc.result), resultUnit: uc.label };
    }
  } catch { /* not a unit conversion */ }

  // Running totals — must come before variable assignment so "total" isn't parsed as var
  try {
    const rtResult = parseRunningTotal(trimmed, results);
    if (rtResult !== null) {
      results.push(rtResult);
      return { raw, type: 'math', result: formatResult(rtResult) };
    }
  } catch { /* not a running total */ }

  // Variable assignment: "name = expr"
  const assignMatch = trimmed.match(VAR_ASSIGN_RE);
  if (assignMatch) {
    const [, name, expr] = assignMatch;
    try {
      const val = evalMath(expr, vars);
      vars[name] = val;
      results.push(val);
      return { raw, type: 'var-assign', varName: name, result: formatResult(val) };
    } catch {
      return { raw, type: 'math-error', result: '?' };
    }
  }

  // Explicit trailing "expr =" or leading "= expr"
  const mathPatterns = [
    /^(.+?)\s*=\s*$/, // "expr ="
    /^=\s*(.+)$/,     // "= expr"
  ];
  for (const pat of mathPatterns) {
    const m = trimmed.match(pat);
    if (m) {
      try {
        const val = evalMath(m[1], vars);
        results.push(val);
        return { raw, type: 'math', result: formatResult(val) };
      } catch {
        return { raw, type: 'math-error', result: '?' };
      }
    }
  }

  // Natural language math
  try {
    const nlResult = parseNaturalLanguage(trimmed, vars);
    if (nlResult !== null) {
      results.push(nlResult);
      return { raw, type: 'math', result: formatResult(nlResult) };
    }
  } catch { /* not natural language */ }

  // Auto-detect: pure arithmetic OR expression referencing known variables
  const autoMathRe = /^[\d\s\+\-\*\/\.\(\),\^x×÷%]+$/;
  const hasKnownVar = Object.keys(vars).some(v => new RegExp(`\\b${v}\\b`).test(trimmed));
  const looksLikeMath = autoMathRe.test(trimmed) && trimmed.length > 1 && /\d/.test(trimmed) && /[\+\-\*\/\^x×÷]/.test(trimmed);

  if (looksLikeMath || hasKnownVar) {
    try {
      const val = evalMath(trimmed, vars);
      results.push(val);
      return { raw, type: 'math', result: formatResult(val) };
    } catch {
      // fall through to text
    }
  }

  return { raw, type: 'text' };
}

const LIST_TRIGGER_RE = /^list(?::\s*(.+))?$/i;

export function parseContent(content: string): ParseResult {
  const rawLines = content.split('\n');
  const firstLine = rawLines[0]?.trim() ?? '';
  const listMatch = firstLine.match(LIST_TRIGGER_RE);
  const listMode = !!listMatch;
  const listTitle = listMatch?.[1]?.trim();

  if (listMode) {
    const lines: ParsedLine[] = rawLines.map((raw, i) => {
      if (i === 0) return { raw, type: 'list-header' };
      const trimmed = raw.trim();
      if (trimmed === '') return { raw, type: 'text' };
      if (trimmed.startsWith('//')) return { raw, type: 'list-comment' };
      if (SECTION_RE.test(trimmed)) return { raw, type: 'section' };
      // Checked if line ends with " /x" (case-insensitive)
      const checked = /\s\/x\s*$/i.test(raw);
      return { raw, type: 'list-item', checked };
    });
    return { lines, listMode: true, listTitle };
  }

  const vars: Record<string, number> = {};
  const results: number[] = [];
  return {
    lines: rawLines.map(line => parseLine(line, vars, results)),
    listMode: false,
  };
}
