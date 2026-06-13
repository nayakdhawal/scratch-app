import { useRef, useEffect, useCallback } from 'react';
import LineOverlay from './LineOverlay';

const FONT_SIZE = 12;
const LINE_HEIGHT = 20;
const PAD_TOP = 28;
const PAD_LEFT = 24;
const PAD_RIGHT = 140; // space for result annotations

interface Props {
  content: string;
  onChange: (v: string) => void;
  onTimerStart: (seconds: number, label: string) => void;
  onToggleLine: (lineIndex: number) => void;
}

export default function Scratchpad({ content, onChange, onTimerStart, onToggleLine }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab → insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart, selectionEnd, value } = el;
      const newVal = value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd);
      onChange(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
      return;
    }

  }, [onChange]);

  const sharedStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: `${PAD_TOP}px ${PAD_RIGHT}px 80px ${PAD_LEFT}px`,
    fontSize: FONT_SIZE,
    lineHeight: `${LINE_HEIGHT}px`,
    fontFamily: 'var(--mono)',
    fontWeight: 300,
    letterSpacing: '0.01em',
  };

  const placeholderLines = [
    'Start typing…',
    '',
    'Try:  1200 * 3.5',
    '      timer pomo',
    '      # Section heading',
  ];

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      {/* Custom placeholder — shown when empty */}
      {content === '' && (
        <div style={{
          ...sharedStyle,
          zIndex: 0,
          pointerEvents: 'none',
          color: 'var(--text3)',
          whiteSpace: 'pre',
        }}>
          {placeholderLines.map((line, i) => (
            <div key={i} style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Textarea — where the user types */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          ...sharedStyle,
          width: '100%',
          height: '100%',
          color: 'var(--text)',
          caretColor: 'var(--accent)',
          resize: 'none',
          zIndex: 1,
          background: 'transparent',
          overflowY: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      />

      {/* Overlay — renders math results, timer buttons, section lines */}
      <div style={{ ...sharedStyle, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        <LineOverlay
          content={content}
          lineHeight={LINE_HEIGHT}
          paddingTop={PAD_TOP}
          fontSize={FONT_SIZE}
          onTimerStart={onTimerStart}
          onToggleLine={onToggleLine}
        />
      </div>
    </div>
  );
}
