import type { ReactNode } from "react";

/** Illustrated 320x320 scenes — one per page. Pure SVG, no external assets. */
const Glow = ({ c }: { c: string }) => (
  <>
    <defs>
      <radialGradient id={`glow${c.slice(1)}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={c} stopOpacity="0.55" />
        <stop offset="100%" stopColor={c} stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="160" cy="160" r="150" fill={`url(#glow${c.slice(1)})`} />
    <circle
      cx="160"
      cy="160"
      r="128"
      fill="rgba(255,255,255,0.06)"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
    />
  </>
);

const Pill = ({
  x,
  y,
  r = 0,
  c1 = "#38bdf8",
  c2 = "#fff",
  w = 64,
}: {
  x: number;
  y: number;
  r?: number;
  c1?: string;
  c2?: string;
  w?: number;
}) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect
      x={-w / 2}
      y={-w * 0.21}
      width={w}
      height={w * 0.42}
      rx={w * 0.21}
      fill={c2}
    />
    <path
      d={`M${-w / 2 + w * 0.21} ${-w * 0.21} h${w * 0.29} v${w * 0.42} h${-w * 0.29} a${w * 0.21} ${w * 0.21} 0 0 1 0 ${-w * 0.42}z`}
      fill={c1}
    />
    <rect
      x={-w / 2 + 6}
      y={-w * 0.17}
      width={w - 12}
      height={w * 0.08}
      rx={w * 0.04}
      fill="#fff"
      opacity="0.35"
    />
  </g>
);

const Dashboard = () => (
  <g>
    <Glow c="#60a5fa" />
    <rect
      x="62"
      y="84"
      width="196"
      height="132"
      rx="16"
      fill="#0b1f3f"
      stroke="#60a5fa"
      strokeWidth="4"
    />
    <polyline
      points="76,160 112,160 124,128 142,190 158,110 176,176 190,160 244,160"
      fill="none"
      stroke="#34d399"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="132" y="216" width="56" height="14" fill="#60a5fa" />
    <rect x="108" y="230" width="104" height="10" rx="5" fill="#60a5fa" />
    <path
      d="M248 60 l22 8 v22 c0 16 -10 26 -22 32 c-12 -6 -22 -16 -22 -32 v-22z"
      fill="#34d399"
    />
    <path
      d="M238 90 l8 8 14 -16"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Pill x={74} y={72} r={-30} />
  </g>
);

const Analysis = () => (
  <g>
    <Glow c="#a78bfa" />
    <path
      d="M136 56 h48 v50 l52 92 c10 20 -2 42 -24 42 h-104 c-22 0 -34 -22 -24 -42 l52 -92z"
      fill="rgba(255,255,255,0.14)"
      stroke="#fff"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <path
      d="M110 172 c20 -10 36 10 56 0 s34 -8 48 2 l22 38 c8 16 -2 30 -20 30 h-92 c-18 0 -28 -14 -20 -30z"
      fill="#a78bfa"
    />
    <circle cx="150" cy="186" r="7" fill="#fff" opacity=".8" />
    <circle cx="184" cy="200" r="5" fill="#fff" opacity=".8" />
    <circle cx="162" cy="214" r="4" fill="#fff" opacity=".8" />
    <circle cx="158" cy="130" r="6" fill="#fff" opacity=".6" />
    <circle cx="170" cy="100" r="4" fill="#fff" opacity=".6" />
    <rect x="130" y="48" width="60" height="12" rx="6" fill="#fff" />
    <g transform="translate(236 70)">
      <circle
        r="28"
        fill="rgba(255,255,255,0.15)"
        stroke="#fbbf24"
        strokeWidth="6"
      />
      <line
        x1="20"
        y1="20"
        x2="44"
        y2="44"
        stroke="#fbbf24"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </g>
    <g stroke="#f472b6" strokeWidth="3">
      <line x1="68" y1="92" x2="92" y2="78" />
      <line x1="92" y1="78" x2="88" y2="54" />
    </g>
    <circle cx="68" cy="92" r="8" fill="#f472b6" />
    <circle cx="92" cy="78" r="6" fill="#f472b6" />
    <circle cx="88" cy="54" r="5" fill="#f472b6" />
  </g>
);

const Visualisations = () => (
  <g>
    <Glow c="#38bdf8" />
    <rect
      x="52"
      y="64"
      width="216"
      height="168"
      rx="16"
      fill="#0b1f3f"
      stroke="#38bdf8"
      strokeWidth="4"
    />
    {[
      [80, 150, "#38bdf8"],
      [118, 120, "#a78bfa"],
      [156, 168, "#f472b6"],
      [194, 100, "#34d399"],
      [232, 140, "#fbbf24"],
    ].map(([x, y, c], i) => (
      <rect
        key={i}
        x={Number(x) - 12}
        y={Number(y)}
        width="24"
        height={216 - Number(y)}
        rx="5"
        fill={String(c)}
      />
    ))}
    <polyline
      points="68,130 106,100 150,140 190,84 244,112"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {[
      [68, 130],
      [106, 100],
      [150, 140],
      [190, 84],
      [244, 112],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="5" fill="#fff" />
    ))}
    <g transform="translate(250 60)">
      <circle r="30" fill="#fbbf24" />
      <path d="M0 0 L0 -30 A30 30 0 0 1 26 15z" fill="#f472b6" />
    </g>
  </g>
);

const Database = () => (
  <g>
    <Glow c="#34d399" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(0 ${i * 46})`}>
        <path
          d="M80 92 v28 c0 14 36 24 80 24 s80 -10 80 -24 v-28"
          fill="#0f6e56"
          stroke="#34d399"
          strokeWidth="3"
        />
        <ellipse
          cx="160"
          cy="92"
          rx="80"
          ry="24"
          fill="#34d399"
          stroke="#a7f3d0"
          strokeWidth="3"
        />
        <circle cx="214" cy="118" r="5" fill="#a7f3d0" />
      </g>
    ))}
    <Pill x={78} y={70} r={-25} c1="#f472b6" />
    <Pill x={246} y={64} r={30} c1="#fbbf24" w={56} />
  </g>
);

const Report = () => (
  <g>
    <Glow c="#f472b6" />
    <rect x="86" y="46" width="148" height="196" rx="14" fill="#fff" />
    <rect x="102" y="64" width="60" height="10" rx="5" fill="#f472b6" />
    {[92, 112, 132, 152].map((y) => (
      <rect
        key={y}
        x="102"
        y={y}
        width={y === 152 ? 70 : 116}
        height="8"
        rx="4"
        fill="#cbd5e1"
      />
    ))}
    <rect
      x="102"
      y="176"
      width="116"
      height="44"
      rx="8"
      fill="#fdf2f8"
      stroke="#f472b6"
      strokeWidth="2"
    />
    <polyline
      points="110,208 130,194 150,202 172,184 210,196"
      fill="none"
      stroke="#db2777"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <g transform="translate(236 78)">
      <path
        d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7z"
        fill="#fbbf24"
      />
    </g>
    <g transform="translate(78 206)">
      <circle r="20" fill="#34d399" />
      <path
        d="M-9 0 l7 8 12 -15"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  </g>
);

const Heart = () => (
  <g>
    <Glow c="#f472b6" />
    <path
      d="M160 238 C70 176 66 112 110 96 c22 -8 42 4 50 22 c8 -18 28 -30 50 -22 c44 16 40 80 -50 142z"
      fill="#f43f5e"
      stroke="#fff"
      strokeWidth="4"
    />
    <path
      d="M100 130 c4 -16 16 -22 28 -20"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
      opacity=".6"
    />
    <polyline
      points="40,160 110,160 128,130 150,196 172,120 188,160 280,160"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

const Meds = () => (
  <g>
    <Glow c="#a78bfa" />
    <rect
      x="104"
      y="108"
      width="112"
      height="132"
      rx="18"
      fill="#f59e0b"
      stroke="#fff"
      strokeWidth="4"
    />
    <rect x="96" y="76" width="128" height="36" rx="10" fill="#fff" />
    <rect x="118" y="146" width="84" height="64" rx="8" fill="#fff" />
    <path
      d="M152 164 h16 v12 h12 v16 h-12 v12 h-16 v-12 h-12 v-16 h12z"
      fill="#f43f5e"
    />
    <Pill x={66} y={214} r={-25} c1="#38bdf8" w={70} />
    <Pill x={254} y={206} r={35} c1="#34d399" w={70} />
    <circle
      cx="256"
      cy="110"
      r="16"
      fill="#f472b6"
      stroke="#fff"
      strokeWidth="3"
    />
    <line x1="244" y1="110" x2="268" y2="110" stroke="#fff" strokeWidth="3" />
  </g>
);

const Lifestyle = () => (
  <g>
    <Glow c="#34d399" />
    <path
      d="M160 238 C70 200 70 110 150 66 c8 40 4 60 -4 78 c24 -20 52 -26 74 -22 c8 50 -20 100 -60 116z"
      fill="#22c55e"
      stroke="#fff"
      strokeWidth="4"
    />
    <path
      d="M150 74 C150 140 160 190 160 238"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      opacity=".7"
    />
    <g transform="translate(240 206)">
      <circle r="30" fill="#ef4444" stroke="#fff" strokeWidth="3" />
      <path
        d="M0 -28 c2 -12 10 -16 16 -16"
        fill="none"
        stroke="#16a34a"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
    <g transform="translate(78 218)">
      <rect x="-34" y="-5" width="68" height="10" rx="5" fill="#fff" />
      <rect x="-40" y="-18" width="14" height="36" rx="5" fill="#a78bfa" />
      <rect x="26" y="-18" width="14" height="36" rx="5" fill="#a78bfa" />
    </g>
  </g>
);

const Ask = () => (
  <g>
    <Glow c="#a78bfa" />
    <path
      d="M70 70 h140 a22 22 0 0 1 22 22 v64 a22 22 0 0 1 -22 22 h-80 l-34 28 v-28 h-26 a22 22 0 0 1 -22 -22 v-64 a22 22 0 0 1 22 -22z"
      fill="#a78bfa"
      stroke="#fff"
      strokeWidth="4"
    />
    <text
      x="140"
      y="148"
      textAnchor="middle"
      fontSize="70"
      fontWeight="900"
      fill="#fff"
      fontFamily="Outfit, sans-serif"
    >
      ?
    </text>
    <path
      d="M250 140 h20 a16 16 0 0 1 16 16 v36 a16 16 0 0 1 -16 16 h-10 v20 l-24 -20 h-36 a16 16 0 0 1 -16 -16 v-4"
      fill="#f472b6"
      stroke="#fff"
      strokeWidth="4"
    />
    <g fill="#fff">
      <circle cx="228" cy="176" r="5" />
      <circle cx="246" cy="176" r="5" />
      <circle cx="264" cy="176" r="5" />
    </g>
    <Pill x={90} y={236} r={-20} c1="#38bdf8" w={56} />
  </g>
);

const Emergency = () => (
  <g>
    <Glow c="#ef4444" />
    <circle
      cx="160"
      cy="160"
      r="96"
      fill="#ef4444"
      stroke="#fff"
      strokeWidth="6"
    />
    <path
      d="M140 100 h40 v40 h40 v40 h-40 v40 h-40 v-40 h-40 v-40 h40z"
      fill="#fff"
    />
    {[-60, -30, 0, 30, 60].map((a) => (
      <line
        key={a}
        x1="160"
        y1="38"
        x2="160"
        y2="14"
        stroke="#fbbf24"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${a} 160 160)`}
      />
    ))}
  </g>
);

const Chat = () => (
  <g>
    <Glow c="#38bdf8" />
    <path
      d="M62 74 h136 a22 22 0 0 1 22 22 v58 a22 22 0 0 1 -22 22 h-74 l-38 30 v-30 h-24 a22 22 0 0 1 -22 -22 v-58 a22 22 0 0 1 22 -22z"
      fill="#38bdf8"
      stroke="#fff"
      strokeWidth="4"
    />
    <g fill="#fff">
      <rect x="82" y="104" width="96" height="9" rx="4.5" />
      <rect x="82" y="124" width="64" height="9" rx="4.5" />
    </g>
    <path
      d="M258 148 h-30 a20 20 0 0 0 -20 20 v40 a20 20 0 0 0 20 20 h22 l30 24 v-24 a20 20 0 0 0 0 -80z"
      fill="#f472b6"
      stroke="#fff"
      strokeWidth="4"
      transform="translate(-10 0)"
    />
    <path
      d="M222 182 h40 M222 198 h26"
      stroke="#fff"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M232 62 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z"
      fill="#fbbf24"
    />
  </g>
);

const Calendar = () => (
  <g>
    <Glow c="#fbbf24" />
    <rect x="62" y="70" width="196" height="176" rx="18" fill="#fff" />
    <path
      d="M62 88 a18 18 0 0 1 18 -18 h160 a18 18 0 0 1 18 18 v34 h-196z"
      fill="#f43f5e"
    />
    <rect x="100" y="52" width="14" height="36" rx="7" fill="#1e293b" />
    <rect x="206" y="52" width="14" height="36" rx="7" fill="#1e293b" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
      <rect
        key={i}
        x={82 + (i % 4) * 44}
        y={138 + Math.floor(i / 4) * 34}
        width="30"
        height="22"
        rx="6"
        fill={i === 5 ? "#22c55e" : "#e2e8f0"}
      />
    ))}
    <path
      d="M165 160 l7 8 12 -14"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      transform="translate(-1 3)"
    />
    <circle
      cx="262"
      cy="222"
      r="30"
      fill="#38bdf8"
      stroke="#fff"
      strokeWidth="4"
    />
    <path
      d="M262 204 v18 l12 8"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

export const SCENES: Record<
  string,
  { node: ReactNode; title: string; sub: string }
> = {
  "/doctor/dashboard": {
    node: <Dashboard />,
    title: "Dashboard",
    sub: "Live overview of every patient",
  },
  "/doctor/analysis": {
    node: <Analysis />,
    title: "Interaction Analysis",
    sub: "Testing drug combinations",
  },
  "/doctor/visualisations": {
    node: <Visualisations />,
    title: "Visualisations",
    sub: "Turning data into insight",
  },
  "/doctor/database": {
    node: <Database />,
    title: "Drug & Patient Database",
    sub: "Records, safely stored",
  },
  "/doctor/messages": {
    node: <Chat />,
    title: "Patient Messages",
    sub: "Secure doctor-patient chat",
  },
  "/doctor/appointments": {
    node: <Calendar />,
    title: "Appointments",
    sub: "Your schedule at a glance",
  },
  "/doctor/report": {
    node: <Report />,
    title: "AI Report",
    sub: "Generating clinical summary",
  },
  "/patient/home": {
    node: <Heart />,
    title: "My Health",
    sub: "Your safety at a glance",
  },
  "/patient/meds": {
    node: <Meds />,
    title: "My Medicines",
    sub: "Your daily prescriptions",
  },
  "/patient/lifestyle": {
    node: <Lifestyle />,
    title: "Lifestyle",
    sub: "Food, habits & wellness",
  },
  "/patient/ask": {
    node: <Ask />,
    title: "Ask DoseVia",
    sub: "Questions about your medicines",
  },
  "/patient/chat": {
    node: <Chat />,
    title: "Chat with Doctor",
    sub: "Your care team, one tap away",
  },
  "/patient/appointments": {
    node: <Calendar />,
    title: "Appointments",
    sub: "Book & track your visits",
  },
  "/patient/emergency": {
    node: <Emergency />,
    title: "Emergency",
    sub: "Help when it matters",
  },
};
