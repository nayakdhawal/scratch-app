import { useMemo } from 'react';
import { parseContent } from '../mathParser';

interface Props {
  content: string;
  lineHeight: number;
  paddingTop: number;
  fontSize: number;
  onTimerStart: (seconds: number, label: string) => void;
  onToggleLine: (lineIndex: number) => void;
}

// Renders the result annotations that float to the right of each line
export default function LineOverlay({ content, lineHeight, paddingTop, fontSize, onTimerStart, onToggleLine }: Props) {
  const { lines } = useMemo(() => parseContent(content), [content]);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {lines.map((line, i) => {
        const y = paddingTop + i * lineHeight;

        if (line.type === 'list-item') {
          return (
            <div key={i} style={{ position: 'absolute', top: y, left: 0, right: 0, height: lineHeight, pointerEvents: 'none' }}>
              <button
                onClick={() => onToggleLine(i)}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 0,
                  height: lineHeight,
                  width: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: fontSize + 1,
                  color: line.checked ? 'var(--accent2)' : 'var(--text3)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'color 0.15s',
                  padding: 0,
                  lineHeight: 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent2)')}
                onMouseLeave={e => (e.currentTarget.style.color = line.checked ? 'var(--accent2)' : 'var(--text3)')}
              >
                {line.checked ? '●' : '○'}
              </button>
              {line.checked && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 24,
                  right: 24,
                  height: 1,
                  background: 'var(--text3)',
                  opacity: 0.35,
                  pointerEvents: 'none',
                }} />
              )}
            </div>
          );
        }

        if (line.type === 'list-comment') {
          return (
            <div key={i} style={{
              position: 'absolute', top: y, left: 24, height: lineHeight,
              display: 'flex', alignItems: 'center',
              fontFamily: 'var(--mono)', fontSize: fontSize - 1,
              color: 'var(--text3)', fontStyle: 'italic',
              pointerEvents: 'none', userSelect: 'none',
            }} />
          );
        }

        if (line.type === 'date') {
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
                color: 'var(--timer)',
                opacity: 0.9,
                letterSpacing: '0.02em',
                userSelect: 'none',
                gap: 6,
              }}
            >
              <span style={{ opacity: 0.5, fontSize: fontSize - 3 }}>→</span>
              {line.result}
            </div>
          );
        }

        if (line.type === 'math' || line.type === 'math-error' || line.type === 'var-assign') {
          const isError = line.type === 'math-error';
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
                color: isError ? 'var(--error)' : 'var(--result)',
                opacity: 0.9,
                letterSpacing: '0.02em',
                userSelect: 'none',
                gap: 6,
              }}
            >
              {line.type === 'var-assign' && (
                <span style={{ color: 'var(--accent2)', fontSize: fontSize - 3, opacity: 0.7 }}>
                  {line.varName}
                </span>
              )}
              <span style={{ color: isError ? 'var(--error)' : 'var(--result2)', opacity: 0.6, fontSize: fontSize - 3 }}>
                =
              </span>
              {line.result}
              {line.resultUnit && (
                <span style={{ color: 'var(--text2)', fontSize: fontSize - 3, opacity: 0.6 }}>
                  {line.resultUnit}
                </span>
              )}
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
