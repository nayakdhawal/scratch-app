import { useEffect, useRef } from 'react';
import { Pad } from '../usePads';

interface Props {
  pads: Pad[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

function padLabel(pad: Pad, index: number): string {
  const firstLine = pad.content.split('\n').find(l => l.trim().length > 0);
  if (!firstLine) return `pad ${index + 1}`;
  const clean = firstLine.replace(/^#+\s*/, '').trim();
  return clean.length > 18 ? clean.slice(0, 18) + '…' : clean || `pad ${index + 1}`;
}

export default function PadTabs({ pads, activeId, onSelect, onClose, onNew }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      paddingLeft: 8,
      paddingRight: 8,
      flexShrink: 0,
      minHeight: 34,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {pads.map((pad, i) => {
        const isActive = pad.id === activeId;
        return (
          <div
            key={pad.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 2px 0 10px',
              borderRight: '1px solid var(--border)',
              height: 34,
              flexShrink: 0,
              background: isActive ? '#1a1a16' : 'transparent',
              borderBottom: isActive ? '1px solid #1a1a16' : '1px solid transparent',
              marginBottom: isActive ? -1 : 0,
              position: 'relative',
              transition: 'background 0.1s',
            }}
          >
            <button
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(pad.id)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.04em',
                color: isActive ? 'var(--text)' : 'var(--text3)',
                padding: '0 2px',
                whiteSpace: 'nowrap',
                transition: 'color 0.1s',
              }}
            >
              {padLabel(pad, i)}
            </button>
            {pads.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(pad.id); }}
                style={{
                  width: 16, height: 16,
                  borderRadius: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9,
                  color: 'var(--text3)',
                  opacity: 0,
                  transition: 'opacity 0.1s, background 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--border2)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
                title="Close pad"
              >✕</button>
            )}
          </div>
        );
      })}

      {/* New pad button */}
      <button
        onClick={onNew}
        title="New pad (Cmd+T)"
        style={{
          width: 28, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text3)',
          fontSize: 16,
          flexShrink: 0,
          transition: 'color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
      >+</button>

      {/* Dot indicators for when tabs overflow */}
      <div data-tauri-drag-region style={{ flex: 1, height: '100%' }} />
      <div style={{ display: 'flex', gap: 4, padding: '0 8px', alignItems: 'center' }}>
        {pads.length > 1 && pads.map((pad) => (
          <button
            key={pad.id}
            onClick={() => onSelect(pad.id)}
            style={{
              width: pad.id === activeId ? 16 : 5,
              height: 5,
              borderRadius: 3,
              background: pad.id === activeId ? 'var(--accent2)' : 'var(--border2)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
