// Lightweight math parser - no external deps needed for basic cases.
// Handles: arithmetic, %, unit conversions, and simple algebra.

const TIMER_RE = /^timer\s+(pomo|pomodoro|\d+(?::\d+)?(?:m|min|s|sec|h|hr)?)\s*$/i;
const SECTION_RE = /^#{1,3}\s+.+/;

// Basic math evaluation using Function() — safe subset, no DOM access
function evalMath(expr: string): number {
  // Replace common math shorthands
  const cleaned = expr
    .replace(/\^/g, '**')
    .replace(/(\d)\s*%(?!\s*\d)/g, '$1/100')   // trailing % = divide by 100
    .replace(/(\d)\s*%\s*of\s*/gi, '$1/100*')  // "20% of 500"
    .replace(/x/gi, '*')
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

export type LineType = 'text' | 'math' | 'math-error' | 'timer' | 'section';

export interface ParsedLine {
  raw: string;
  type: LineType;
  result?: string;
  timerSeconds?: number;
  timerLabel?: string;
}

export function parseLine(raw: string): ParsedLine {
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

  // Math: line ends with = or contains = with expression
  // Detect: "32 * 14 =" or "= 32 * 14" or just "500 + 200"
  // Also detect lines with an obvious operator pattern
  const mathPatterns = [
    /^(.+?)\s*=\s*$/, // "expr ="
    /^=\s*(.+)$/,     // "= expr"
  ];

  for (const pat of mathPatterns) {
    const m = trimmed.match(pat);
    if (m) {
      try {
        const val = evalMath(m[1]);
        return { raw, type: 'math', result: formatResult(val) };
      } catch {
        return { raw, type: 'math-error', result: '?' };
      }
    }
  }

  // Auto-detect arithmetic lines (no = needed): lines that look like pure math
  const autoMathRe = /^[\d\s\+\-\*\/\.\(\),\^x×÷%]+$/;
  if (autoMathRe.test(trimmed) && trimmed.length > 1 && /\d/.test(trimmed) && /[\+\-\*\/\^x×÷]/.test(trimmed)) {
    try {
      const val = evalMath(trimmed);
      return { raw, type: 'math', result: formatResult(val) };
    } catch {
      // fall through to text
    }
  }

  return { raw, type: 'text' };
}

export function parseContent(content: string): ParsedLine[] {
  return content.split('\n').map(parseLine);
}
