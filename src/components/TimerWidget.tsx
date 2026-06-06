import { TimerState } from '../useTimer';

interface Props {
  timer: TimerState;
  onToggle: () => void;
  onStop: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimerWidget({ timer, onToggle, onStop }: Props) {
  const pct = 1 - timer.remaining / timer.totalSeconds;
  const circumference = 2 * Math.PI * 18;
  const dash = circumference * pct;

  const isUrgent = timer.remaining <= 60 && timer.remaining > 0;
  const isDone = timer.remaining === 0;
  const color = isDone ? 'var(--result)' : isUrgent ? 'var(--error)' : 'var(--timer)';

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: '#1a1a18',
      border: '1px solid var(--border2)',
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      minWidth: 200,
    }}>
      {/* Ring progress */}
      <svg width="44" height="44" style={{ flexShrink: 0 }}>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="2"/>
        <circle
          cx="22" cy="22" r="18"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s linear, stroke 0.3s' }}
        />
        <text
          x="22" y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="9"
          fontFamily="var(--mono)"
          style={{ transition: 'fill 0.3s' }}
        >
          {isDone ? '✓' : timer.running ? '▶' : '⏸'}
        </text>
      </svg>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 22,
          fontWeight: 300,
          color,
          letterSpacing: '0.04em',
          lineHeight: 1,
          transition: 'color 0.3s',
        }}>
          {formatTime(timer.remaining)}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text2)',
          marginTop: 3,
          fontFamily: 'var(--mono)',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {timer.label}
          {timer.isPomo && (
            <span style={{ color: 'var(--text3)' }}>
              #{timer.cycle} · {timer.phase}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={onToggle}
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            background: 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
            color: 'var(--text2)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
          title={timer.running ? 'Pause' : 'Resume'}
        >
          {timer.running ? '⏸' : '▶'}
        </button>
        <button
          onClick={onStop}
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            background: 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10,
            color: 'var(--text3)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
          title="Stop"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
