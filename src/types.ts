export interface ParsedLine {
  raw: string;
  type: 'text' | 'math' | 'math-error' | 'timer' | 'section';
  result?: string;
  timerSeconds?: number;
}

export interface Note {
  id: string;
  content: string;
  updatedAt: number;
}

export interface TimerState {
  label: string;
  totalSeconds: number;
  remaining: number;
  running: boolean;
  isPomo: boolean;
  phase: 'work' | 'break';
  cycle: number;
}
