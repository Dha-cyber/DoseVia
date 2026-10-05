import { motion } from 'framer-motion';
import { Capsule, Tablet, Molecule, Cross } from './DrugShapes';

// Floating pills / molecules drifting behind every page. Purely decorative.
const ITEMS = [
  { k: 'cap', x: 6,  y: 12, s: 70, r: 25,  d: 14, a: '#38bdf8', b: '#f8fafc' },
  { k: 'tab', x: 82, y: 8,  s: 38, r: 0,   d: 17, a: '#a78bfa' },
  { k: 'mol', x: 90, y: 42, s: 60, r: 0,   d: 20, a: '#38bdf8' },
  { k: 'cap', x: 72, y: 78, s: 84, r: -35, d: 16, a: '#f472b6', b: '#f8fafc' },
  { k: 'cross', x: 14, y: 70, s: 26, r: 0, d: 12, a: '#34d399' },
  { k: 'tab', x: 40, y: 88, s: 30, r: 0,   d: 15, a: '#fbbf24' },
  { k: 'mol', x: 28, y: 6,  s: 48, r: 0,   d: 18, a: '#818cf8' },
  { k: 'cap', x: 55, y: 30, s: 52, r: 60,  d: 19, a: '#34d399', b: '#f8fafc' },
] as const;

export default function DrugBackdrop({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ opacity }} aria-hidden>
      {ITEMS.map((it, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${it.x}%`, top: `${it.y}%`, rotate: it.r }}
          animate={{ y: [0, -22, 10, 0], x: [0, 12, -10, 0], rotate: [it.r, it.r + 14, it.r - 10, it.r] }}
          transition={{ duration: it.d, repeat: Infinity, ease: 'easeInOut' }}
        >
          {it.k === 'cap' && <Capsule size={it.s} c1={it.a} c2={'b' in it ? it.b : '#fff'} />}
          {it.k === 'tab' && <Tablet size={it.s} c1={it.a} />}
          {it.k === 'mol' && <Molecule size={it.s} c1={it.a} />}
          {it.k === 'cross' && <Cross size={it.s} c1={it.a} />}
        </motion.div>
      ))}
    </div>
  );
}
