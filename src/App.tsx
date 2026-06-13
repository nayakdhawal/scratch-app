import { useEffect, useCallback, useRef } from 'react';
import { usePads } from './usePads';
import { useTimer } from './useTimer';
import Scratchpad from './components/Scratchpad';
import TimerWidget from './components/TimerWidget';
import StatusBar from './components/StatusBar';
import iconUrl from './assets/icon.svg';

const DEBOUNCE_MS = 500;
const SWIPE_THRESHOLD = 60;  // px of horizontal deltaX to trigger
const SWIPE_COOLDOWN  = 500; // ms before another swipe is accepted

export default function App() {
  const { pads, activePad, activeId, setActiveId, updateContent, newPad, closePad, goNext, goPrev, goToIndex } = usePads();
  const { timer, startTimer, togglePause, stopTimer } = useTimer();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<Date | null>(null);
  const swipeCooldownRef = useRef(false);
  const swipeAccumRef = useRef(0);

  const handleChange = useCallback((val: string) => {
    updateContent(activeId, val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSavedRef.current = new Date();
    }, DEBOUNCE_MS);
  }, [activeId, updateContent]);

  // Trackpad swipe navigation
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      // Only act on predominantly horizontal swipes
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (swipeCooldownRef.current) return;

      swipeAccumRef.current += e.deltaX;

      if (swipeAccumRef.current > SWIPE_THRESHOLD) {
        goNext();
        swipeAccumRef.current = 0;
        swipeCooldownRef.current = true;
        setTimeout(() => { swipeCooldownRef.current = false; }, SWIPE_COOLDOWN);
      } else if (swipeAccumRef.current < -SWIPE_THRESHOLD) {
        goPrev();
        swipeAccumRef.current = 0;
        swipeCooldownRef.current = true;
        setTimeout(() => { swipeCooldownRef.current = false; }, SWIPE_COOLDOWN);
      }
    };
    window.addEventListener('wheel', handler, { passive: true });
    return () => window.removeEventListener('wheel', handler);
  }, [goNext, goPrev]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 't') { e.preventDefault(); newPad(); return; }
      if (e.key === 'w') { e.preventDefault(); closePad(activeId); return; }
      if (e.key === ']' || e.key === 'ArrowRight') { e.preventDefault(); goNext(); return; }
      if (e.key === '[' || e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return; }

      // Cmd+1..9 jump to pad
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) { e.preventDefault(); goToIndex(num - 1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId, newPad, closePad, goNext, goPrev, goToIndex]);

  const handleToggleLine = useCallback((lineIndex: number) => {
    const lines = activePad.content.split('\n');
    const line = lines[lineIndex];
    if (!line) return;
    if (/\s\/x\s*$/i.test(line)) {
      lines[lineIndex] = line.replace(/\s\/x\s*$/i, '');
    } else {
      lines[lineIndex] = line.trimEnd() + ' /x';
    }
    updateContent(activeId, lines.join('\n'));
  }, [activePad.content, activeId, updateContent]);

  const lineCount = activePad.content === '' ? 0 : activePad.content.split('\n').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Title bar — draggable, shows app name + pad dots on the right */}
      <div
        data-tauri-drag-region
        style={{
          flexShrink: 0,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 80,   /* clear macOS traffic lights */
          paddingRight: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* App name — centred in remaining space */}
        <div
          data-tauri-drag-region
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <img
            src={iconUrl}
            width={14}
            height={14}
            style={{ opacity: 0.7, flexShrink: 0 }}
          />
          <span style={{
            fontSize: 13,
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            color: 'var(--text2)',
            letterSpacing: '0.02em',
          }}>
            Scratch
          </span>
        </div>

        {/* Dot pad selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {pads.map((pad) => (
            <button
              key={pad.id}
              onClick={() => setActiveId(pad.id)}
              title={`Switch to pad ${pads.indexOf(pad) + 1}`}
              style={{
                width: pad.id === activeId ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: pad.id === activeId ? 'var(--accent2)' : 'var(--border2)',
                transition: 'all 0.2s',
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          {/* New pad button */}
          <button
            onClick={newPad}
            title="New pad (Cmd+T)"
            style={{
              marginLeft: 4,
              width: 18,
              height: 18,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: 'var(--text3)',
              transition: 'color 0.1s',
              border: 'none',
              cursor: 'pointer',
              background: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
          >+</button>
        </div>
      </div>

      {/* Editor */}
      <Scratchpad
        key={activeId}
        content={activePad.content}
        onChange={handleChange}
        onTimerStart={startTimer}
        onToggleLine={handleToggleLine}
      />

      <StatusBar
        charCount={activePad.content.length}
        lineCount={lineCount}
        lastSaved={lastSavedRef.current}
        padIndex={pads.findIndex(p => p.id === activeId)}
        padCount={pads.length}
      />

      {timer && (
        <TimerWidget timer={timer} onToggle={togglePause} onStop={stopTimer} />
      )}
    </div>
  );
}
