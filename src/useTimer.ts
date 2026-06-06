import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
  label: string;
  totalSeconds: number;
  remaining: number;
  running: boolean;
  isPomo: boolean;
  phase: 'work' | 'break';
  cycle: number;
}

const POMO_WORK = 25 * 60;
const POMO_BREAK = 5 * 60;
const POMO_LONG_BREAK = 15 * 60;

export function useTimer() {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = useCallback((seconds: number, label: string) => {
    clearTick();
    const isPomo = label === 'Pomodoro';
    const state: TimerState = {
      label,
      totalSeconds: seconds,
      remaining: seconds,
      running: true,
      isPomo,
      phase: 'work',
      cycle: 1,
    };
    setTimer(state);
  }, []);

  const togglePause = useCallback(() => {
    setTimer(t => t ? { ...t, running: !t.running } : null);
  }, []);

  const stopTimer = useCallback(() => {
    clearTick();
    setTimer(null);
  }, []);

  useEffect(() => {
    if (!timer?.running) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (!t) return null;
        const next = t.remaining - 1;

        if (next <= 0) {
          if (t.isPomo) {
            // Advance pomodoro cycle
            const isBreak = t.phase === 'work';
            const newCycle = isBreak ? t.cycle : t.cycle + 1;
            const newPhase = isBreak ? 'break' : 'work';
            const longBreak = newCycle % 4 === 0 && newPhase === 'break';
            const newTotal = newPhase === 'work' ? POMO_WORK : (longBreak ? POMO_LONG_BREAK : POMO_BREAK);
            return {
              ...t,
              phase: newPhase,
              cycle: newCycle,
              totalSeconds: newTotal,
              remaining: newTotal,
              label: newPhase === 'break' ? (longBreak ? 'Long break' : 'Break') : 'Pomodoro',
            };
          }
          // Regular timer done
          clearTick();
          return { ...t, remaining: 0, running: false };
        }

        return { ...t, remaining: next };
      });
    }, 1000);

    return clearTick;
  }, [timer?.running]);

  return { timer, startTimer, togglePause, stopTimer };
}
