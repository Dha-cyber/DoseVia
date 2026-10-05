import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENES } from './PageScenes';

const COLS = 6, ROWS = 6, SIZE = 300;           // scene is cut into 36 shards
const TILE = SIZE / COLS;

/**
 * Page-opening effect:
 *  1. the page's own illustration (analysis = flask, database = cylinders, ...) assembles from shards
 *  2. it holds for a moment, title appears
 *  3. it SHATTERS into flying pieces while the backdrop sweeps open to reveal the page
 */
export default function PageTransition({ path, accent = '#185FA5' }: { path: string; accent?: string }) {
  const scene = SCENES[path];
  const k = typeof window === 'undefined' ? 1 : Math.min(1, (window.innerWidth * 0.86) / SIZE);
  const [phase, setPhase] = useState<'in' | 'hold' | 'break' | 'done'>('in');

  useEffect(() => {
    if (!scene) return;
    const t = [
      setTimeout(() => setPhase('hold'), 650),
      setTimeout(() => setPhase('break'), 1350),
      setTimeout(() => setPhase('done'), 2150),
    ];
    return () => t.forEach(clearTimeout);
  }, [scene]);

  const shards = useMemo(() => Array.from({ length: COLS * ROWS }, (_, i) => {
    const r = (n: number) => { const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
    return {
      c: i % COLS, row: Math.floor(i / COLS),
      sx: (r(1) - 0.5) * 900, sy: (r(2) - 0.5) * 700, sr: (r(3) - 0.5) * 540,   // start offsets
      ex: (r(4) - 0.5) * 1300, ey: (r(5) - 0.2) * 900, er: (r(6) - 0.5) * 720,  // end (break) offsets
      d: r(7) * 0.18,
    };
  }), []);

  if (!scene || phase === 'done') return null;
  const breaking = phase === 'break';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
      onClick={() => setPhase('done')} style={{ pointerEvents: breaking ? 'none' : 'auto' }}>
      {/* backdrop that sweeps open */}
      <motion.div className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 45%, ${accent} 0%, #0a1430 75%)` }}
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: breaking ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)', opacity: breaking ? 0.2 : 1 }}
        transition={{ duration: breaking ? 0.7 : 0.45, ease: 'easeInOut' }} />

      {/* ambient sparkles */}
      {!breaking && Array.from({ length: 18 }).map((_, i) => (
        <motion.span key={i} className="absolute rounded-full bg-white"
          style={{ width: 3, height: 3, left: `${(i * 53) % 100}%`, top: `${(i * 29) % 100}%` }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.6, 0.5] }} transition={{ duration: 1.4, repeat: Infinity, delay: (i % 6) * 0.15 }} />
      ))}

      <div className="relative" style={{ width: SIZE, height: SIZE, transform: `scale(${k})` }}>
        {/* shattering illustration */}
        <div className="absolute inset-0">
          {shards.map((s, i) => (
            <motion.div key={i} className="absolute overflow-hidden"
              style={{ left: s.c * TILE, top: s.row * TILE, width: TILE + 0.5, height: TILE + 0.5, willChange: 'transform' }}
              initial={{ x: s.sx, y: s.sy, rotate: s.sr, opacity: 0, scale: 0.4 }}
              animate={breaking
                ? { x: s.ex, y: s.ey, rotate: s.er, opacity: 0, scale: 0.6 }
                : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
              transition={breaking
                ? { duration: 0.8, delay: s.d, ease: [0.2, 0.7, 0.3, 1] }
                : { type: 'spring', stiffness: 120, damping: 16, delay: s.d }}>
              <svg width={SIZE} height={SIZE} viewBox="0 0 320 320"
                style={{ position: 'absolute', left: -s.c * TILE, top: -s.row * TILE, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}>
                {scene.node}
              </svg>
            </motion.div>
          ))}
        </div>

        {/* title */}
        <AnimatePresence>
          {!breaking && phase !== 'in' && (
            <motion.div className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
              style={{ top: SIZE + 14 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <p className="text-white text-2xl font-black tracking-tight">{scene.title}</p>
              <p className="text-white/60 text-xs tracking-[0.25em] uppercase mt-1">{scene.sub}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
