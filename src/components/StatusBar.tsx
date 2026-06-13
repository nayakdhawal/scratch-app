interface Props {
  charCount: number;
  lineCount: number;
  lastSaved: Date | null;
  padIndex: number;
  padCount: number;
}

export default function StatusBar({ charCount, lineCount, lastSaved, padIndex, padCount }: Props) {
  const saved = lastSaved
    ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '5px 20px',
      borderTop: '1px solid var(--border)',
      fontFamily: 'var(--mono)',
      fontSize: 11,
      color: 'var(--text3)',
      letterSpacing: '0.06em',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <span>{lineCount} ln</span>
      <span>{charCount} ch</span>
      {padCount > 1 && <span style={{ color: 'var(--text3)' }}>{padIndex + 1}/{padCount}</span>}
      <div style={{ flex: 1 }} />
      {saved && <span style={{ opacity: 0.6 }}>saved {saved}</span>}
      <span style={{ color: 'var(--text3)' }}>
        ⌘T new · ⌘[ ⌘] switch
      </span>
    </div>
  );
}
