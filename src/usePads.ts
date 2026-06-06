import { useState, useCallback, useEffect } from 'react';

export interface Pad {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'scratch-pads-v1';
const ACTIVE_KEY = 'scratch-active-v1';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadPads(): Pad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: uid(), content: '', createdAt: Date.now(), updatedAt: Date.now() }];
}

function savePads(pads: Pad[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pads));
}

export function usePads() {
  const [pads, setPads] = useState<Pad[]>(loadPads);
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    const loaded = loadPads();
    return (saved && loaded.find(p => p.id === saved)) ? saved : loaded[0].id;
  });

  useEffect(() => { savePads(pads); }, [pads]);
  useEffect(() => { localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);

  const activePad = pads.find(p => p.id === activeId) ?? pads[0];
  const activeIndex = pads.findIndex(p => p.id === activeId);

  const updateContent = useCallback((id: string, content: string) => {
    setPads(prev => prev.map(p => p.id === id ? { ...p, content, updatedAt: Date.now() } : p));
  }, []);

  const newPad = useCallback(() => {
    const pad: Pad = { id: uid(), content: '', createdAt: Date.now(), updatedAt: Date.now() };
    setPads(prev => [...prev, pad]);
    setActiveId(pad.id);
    return pad.id;
  }, []);

  const closePad = useCallback((id: string) => {
    setPads(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter(p => p.id !== id);
      if (id === activeId) {
        const idx = prev.findIndex(p => p.id === id);
        setActiveId(next[Math.max(0, idx - 1)].id);
      }
      return next;
    });
  }, [activeId]);

  const goNext = useCallback(() => {
    setActiveId(pads[(activeIndex + 1) % pads.length].id);
  }, [pads, activeIndex]);

  const goPrev = useCallback(() => {
    setActiveId(pads[(activeIndex - 1 + pads.length) % pads.length].id);
  }, [pads, activeIndex]);

  const goToIndex = useCallback((i: number) => {
    if (pads[i]) setActiveId(pads[i].id);
  }, [pads]);

  return { pads, activePad, activeId, activeIndex, setActiveId, updateContent, newPad, closePad, goNext, goPrev, goToIndex };
}
