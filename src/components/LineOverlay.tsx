import { useMemo, CSSProperties } from 'react';
import { parseContent } from '../mathParser';

interface Props {
  content: string;
  lineHeight: number;
  paddingTop: number;
  fontSize: number;
  onTimerStart: (seconds: number, label: string) => void;
}

// Renders the result annotations that float to the right of each line
export default function LineOverlay({ content, lineHeight, paddingTop, fontSize, onTimerStart }: Props) {
  const lines = useMemo(() => parseContent(content), [content]);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      paddingTop,
      overflow: 'hidden',
    }}>
      {lines.map((line, i) => {
        const y = i * lineHeight;

        if (line.type === 'math' || line.type === 'math-error') {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: y,
                right: 24,
                height: lineHeight,
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'var(--mono)',
                fontSize: fontSize - 1,
                color: line.type === 'math' ? 'var(--result)' : 'var(--error)',
                opacity: 0.9,
                letterSpacing: '0.02em',
                userSelect: 'none',
                gap: 6,
              }}
            >
              <span style={{ color: line.type === 'math' ? 'var(--result2)' : 'var(--error)', opacity: 0.6, fontSize: fontSize - 3 }}>
                =
              </span>
              {line.result}
            </div>
          );
        }

        if (line.type === 'timer') {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: y,
                right: 24,
                height: lineHeight,
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'auto',
              }}
            >
              <button
                onClick={() => line.timerSeconds && onTimerStart(line.timerSeconds, line.timerLabel ?? 'Timer')}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: fontSize - 2,
                  color: 'var(--timer)',
                  background: 'rgba(122,155,201,0.08)',
                  border: '1px solid rgba(122,155,201,0.2)',
                  borderRadius: 4,
                  padding: '1px 8px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(122,155,201,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(122,155,201,0.08)')}
              >
                ▶ start
              </button>
            </div>
          );
        }

        if (line.type === 'section') {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: y + lineHeight - 1,
                left: 24,
                right: 24,
                height: 1,
                background: 'var(--border)',
                opacity: 0.6,
                pointerEvents: 'none',
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
