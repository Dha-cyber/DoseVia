import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capsule, Tablet, Cross } from "./DrugShapes";

const COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
];

/**
 * Opening animation: a medicine capsule drops through the screen,
 * hits the centre and BLASTS into pills + particles, then the DoseVia logo
 * appears and the screen dissolves into the login page.
 */
export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"fall" | "blast" | "logo">("fall");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("blast"), 1250);
    const t2 = setTimeout(() => setPhase("logo"), 1900);
    const t3 = setTimeout(() => setLeaving(true), 4100);
    const t4 = setTimeout(onDone, 4700);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const particles = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const ang = (i / 44) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 160 + ((i * 53) % 240);
        return {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist,
          c: COLORS[i % COLORS.length],
          s: 5 + (i % 5) * 3,
          kind: i % 4,
          rot: (i * 47) % 360,
        };
      }),
    [],
  );

  const skip = () => {
    setLeaving(true);
    setTimeout(onDone, 350);
  };

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #0d2045 0%, #060d1f 70%)",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.6 }}
          onClick={skip}
        >
          {/* starfield */}
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 2,
                height: 2,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 61) % 100}%`,
              }}
              animate={{ opacity: [0.1, 0.8, 0.1] }}
              transition={{
                duration: 2 + (i % 4),
                repeat: Infinity,
                delay: (i % 7) * 0.2,
              }}
            />
          ))}

          {/* falling capsule */}
          {phase === "fall" && (
            <motion.div
              className="absolute"
              initial={{ y: "-60vh", rotate: -40, scale: 1.2 }}
              animate={{ y: 0, rotate: 320, scale: 1 }}
              transition={{ duration: 1.25, ease: [0.5, 0, 0.9, 0.6] }}
            >
              <div
                style={{ filter: "drop-shadow(0 0 24px rgba(96,165,250,0.9))" }}
              >
                <Capsule size={150} c1="#38bdf8" c2="#f8fafc" />
              </div>
            </motion.div>
          )}

          {/* blast */}
          {phase !== "fall" && (
            <>
              <motion.div
                className="absolute rounded-full bg-white"
                initial={{ width: 20, height: 20, opacity: 1 }}
                animate={{ width: 1400, height: 1400, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ border: `3px solid ${COLORS[i]}` }}
                  initial={{ width: 30, height: 30, opacity: 0.9 }}
                  animate={{
                    width: 700 + i * 220,
                    height: 700 + i * 220,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.3,
                    delay: i * 0.12,
                    ease: "easeOut",
                  }}
                />
              ))}
              {particles.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: 0 }}
                  animate={{
                    x: p.x,
                    y: p.y + 60,
                    opacity: 0,
                    scale: 1,
                    rotate: p.rot * 3,
                  }}
                  transition={{ duration: 1.6, ease: [0.1, 0.7, 0.3, 1] }}
                >
                  {p.kind === 0 && (
                    <Capsule size={p.s * 4} c1={p.c} c2="#f8fafc" />
                  )}
                  {p.kind === 1 && <Tablet size={p.s * 2.2} c1={p.c} />}
                  {p.kind === 2 && <Cross size={p.s * 1.6} c1={p.c} />}
                  {p.kind === 3 && (
                    <div
                      className="rounded-full"
                      style={{
                        width: p.s,
                        height: p.s,
                        background: p.c,
                        boxShadow: `0 0 12px ${p.c}`,
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </>
          )}

          {/* logo reveal */}
          {phase === "logo" && (
            <motion.div
              className="relative z-10 text-center px-6"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
            >
              <motion.div
                className="mx-auto mb-4 flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <svg width="74" height="74" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="8"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2"
                  />
                  {[
                    [20, 8],
                    [20, 32],
                    [8, 20],
                    [32, 20],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="4" fill="#60a5fa" />
                  ))}
                  <line
                    x1="20"
                    y1="12"
                    x2="20"
                    y2="28"
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="12"
                    y1="20"
                    x2="28"
                    y2="20"
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                  />
                </svg>
              </motion.div>
              <h1
                className="text-6xl sm:text-7xl font-black tracking-tight"
                style={{
                  background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                DoseVia
              </h1>
              <motion.p
                className="text-white/60 mt-3 tracking-[0.3em] text-xs sm:text-sm uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Smart Drug Interaction Safety
              </motion.p>
            </motion.div>
          )}

          <span className="absolute bottom-6 text-white/30 text-xs">
            Tap to skip
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
