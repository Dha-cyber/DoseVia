import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Info, ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react';
import { getPK } from '@/lib/pkData';

const DRUG_COLORS = ['#185FA5', '#0F6E56', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DrugPK {
  drugId: string;
  genericName: string;
  peakHours: number;
  halfLifeHours: number;
  optimalDoseHour: number;
  affectedOrgans: string[];
  adjustNote?: string;
}

interface AiVisData {
  pharmacokinetics: DrugPK[];
  clinicalNote: string;
}

// Build patient-specific PK from the offline table, adjusted for kidney/liver function
function buildVisData(
  patient: { name: string; kidneyFunction: number; liverFunction: number; drugs: string[] },
  allDrugs: { id: string; genericName: string; class: string }[],
): AiVisData {
  const list: DrugPK[] = allDrugs
    .filter(d => patient.drugs.includes(d.id))
    .map(d => {
      const pk = getPK(d.id, d.class);
      const k = Math.min(2.5, Math.max(1, 90 / Math.max(20, patient.kidneyFunction)));
      const l = Math.min(2.5, Math.max(1, 90 / Math.max(20, patient.liverFunction)));
      const factor = pk.clearance === 'renal' ? k : pk.clearance === 'hepatic' ? l : (k + l) / 2;
      const slowed = factor > 1.08;
      return {
        drugId: d.id,
        genericName: d.genericName,
        peakHours: pk.peakHours,
        halfLifeHours: Math.round(pk.halfLifeHours * factor * 10) / 10,
        optimalDoseHour: pk.optimalDoseHour,
        affectedOrgans: pk.affectedOrgans,
        adjustNote: slowed
          ? `t½ ×${factor.toFixed(1)} — ${pk.clearance === 'renal' ? `kidney ${patient.kidneyFunction}%` : pk.clearance === 'hepatic' ? `liver ${patient.liverFunction}%` : `kidney ${patient.kidneyFunction}% / liver ${patient.liverFunction}%`} slows clearance`
          : undefined,
      };
    });

  const notes: string[] = [];
  const adjusted = list.filter(d => d.adjustNote);
  if (adjusted.length) notes.push(`${patient.name}'s reduced organ function lengthens the half-life of ${adjusted.map(d => d.genericName).join(', ')}, so levels stay higher for longer.`);
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const shared = a.affectedOrgans.filter(o => b.affectedOrgans.includes(o));
    if (Math.abs(a.optimalDoseHour - b.optimalDoseHour) <= 1 && shared.length >= 2) {
      notes.push(`${a.genericName} and ${b.genericName} peak together and both load the ${shared.slice(0, 2).join(' & ').toLowerCase()} — consider spacing their doses.`);
      break;
    }
  }
  return { pharmacokinetics: list, clinicalNote: notes.join(' ') || 'No timing overlaps detected for this combination.' };
}

function generateTimeData(pkList: DrugPK[]) {
  const hours = Array.from({ length: 25 }, (_, h) => h);
  return hours.map(h => {
    const point: Record<string, number | string> = { hour: `${h}:00` };
    pkList.forEach(d => {
      const timeSinceDose = ((h - d.optimalDoseHour + 24) % 24);
      const level = timeSinceDose < d.peakHours
        ? (timeSinceDose / d.peakHours) * 100
        : Math.max(0, 100 * Math.exp(-0.693 * (timeSinceDose - d.peakHours) / d.halfLifeHours));
      point[d.genericName] = Math.round(level);
    });
    return point;
  });
}

function BodyMap({ pkList, patientName }: { pkList: DrugPK[]; patientName: string }) {
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);

  const activeDrugOrgans = pkList.flatMap(d => d.affectedOrgans);

  const organs = [
    { id: 'Brain', cx: 160, cy: 52, rx: 28, ry: 22, label: 'Brain' },
    { id: 'Lungs', cx: 160, cy: 118, rx: 36, ry: 22, label: 'Lungs' },
    { id: 'Heart', cx: 144, cy: 124, rx: 14, ry: 14, label: '♥' },
    { id: 'Liver', cx: 178, cy: 148, rx: 22, ry: 16, label: 'Liver' },
    { id: 'Stomach', cx: 152, cy: 155, rx: 14, ry: 12, label: '' },
    { id: 'Kidneys', cx: 160, cy: 180, rx: 30, ry: 12, label: 'Kidneys' },
    { id: 'Blood', cx: 160, cy: 210, rx: 18, ry: 18, label: 'Blood' },
    { id: 'Thyroid', cx: 160, cy: 82, rx: 12, ry: 9, label: '' },
  ];

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-muted-foreground mb-2 text-center">AI-mapped drug effects on {patientName}'s body — highlighted = affected organ</p>
      <svg width="320" height="340" viewBox="0 0 320 340" className="mx-auto">
        <ellipse cx="160" cy="52" rx="30" ry="28" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
        <rect x="128" y="78" width="64" height="2" fill="#d1d5db" rx="1" />
        <rect x="118" y="80" width="84" height="140" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" rx="28" />
        <rect x="90" y="82" width="28" height="100" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" rx="14" />
        <rect x="202" y="82" width="28" height="100" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" rx="14" />
        <rect x="126" y="218" width="32" height="110" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" rx="14" />
        <rect x="162" y="218" width="32" height="110" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" rx="14" />

        {organs.map(org => {
          const isActive = activeDrugOrgans.includes(org.id);
          const isHovered = hoveredOrgan === org.id;
          return (
            <g key={org.id}
              onMouseEnter={() => setHoveredOrgan(org.id)}
              onMouseLeave={() => setHoveredOrgan(null)}
              style={{ cursor: isActive ? 'pointer' : 'default' }}>
              <motion.ellipse
                cx={org.cx} cy={org.cy} rx={org.rx} ry={org.ry}
                fill={isActive ? '#185FA5' : '#e5e7eb'}
                fillOpacity={isActive ? (isHovered ? 0.95 : 0.75) : 0.5}
                stroke={isActive ? '#185FA5' : '#d1d5db'}
                strokeWidth={isActive ? 2 : 1}
                animate={isActive ? {
                  fillOpacity: [0.65, 0.9, 0.65],
                  scale: isHovered ? 1.08 : 1,
                } : { scale: 1 }}
                transition={isActive ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                style={{ transformOrigin: `${org.cx}px ${org.cy}px` }}
              />
              {org.label && (
                <text x={org.cx} y={org.cy + 5} textAnchor="middle" fontSize={org.label === '♥' ? 14 : 9}
                  fontWeight="600" fill={isActive ? 'white' : '#9ca3af'}>
                  {org.label}
                </text>
              )}
            </g>
          );
        })}

        {hoveredOrgan && (
          <g>
            <rect x="10" y="295" width="200" height="36" rx="8" fill="#185FA5" fillOpacity="0.95" />
            <text x="110" y="309" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">{hoveredOrgan}</text>
            <text x="110" y="323" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.8)">
              {pkList.filter(d => d.affectedOrgans.includes(hoveredOrgan!)).map(d => d.genericName).join(', ') || 'Not affected by current drugs'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function Visualisations() {
  const { patients, drugs: allDrugs, analysisPatientId } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState(analysisPatientId ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('levels');
  const aiLoading = false;

  const patient = patients.find(p => p.id === selectedPatientId) ?? patients[0] ?? null;
  const patientName = patient?.name ?? 'Selected Patient';

  useEffect(() => {
    if (analysisPatientId) setSelectedPatientId(analysisPatientId);
  }, [analysisPatientId]);

  const aiData = useMemo<AiVisData | null>(
    () => (patient && patient.drugs.length > 0 ? buildVisData(patient, allDrugs) : null),
    [patient?.id, patient?.drugs?.join(','), patient?.kidneyFunction, patient?.liverFunction, allDrugs],
  );

  const pkList = aiData?.pharmacokinetics ?? [];
  const timeData = pkList.length > 0 ? generateTimeData(pkList) : [];
  const clockDrugs = pkList.map((d, i) => {
    const angle = (d.optimalDoseHour / 24) * 360 - 90;
    return { ...d, color: DRUG_COLORS[i] ?? '#185FA5', angle };
  });

  const sectionToggle = (s: string) => setExpandedSection(prev => prev === s ? '' : s);

  return (
    <DoctorLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Smart Visualisations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {patient ? `Showing ${patientName}'s current My Meds (${patient.drugs.length}) · kidney ${patient.kidneyFunction}% · liver ${patient.liverFunction}%` : 'Select a patient to link visualisations'}
            </p>
          </div>
          <div className="relative">
            <button onClick={() => setShowDropdown(d => !d)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/50 transition-colors min-w-48">
              <span>{patient?.name ?? 'Select patient…'}</span>
              {showDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 4 }} exit={{ opacity: 0 }}
                  className="absolute right-0 top-full z-50 bg-card border border-border rounded-xl shadow-2xl min-w-56 overflow-hidden">
                  {patients.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setShowDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/8 border-b border-border/40 last:border-0 ${p.id === selectedPatientId ? 'bg-primary/5 font-semibold' : ''}`}>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.drugs.length} drugs · {p.conditions.join(', ')}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Drug levels chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
          <button onClick={() => sectionToggle('levels')} className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">Drug Levels in {patientName}'s Blood Over 24 Hours</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Patient data</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Plasma concentration curves from reference pharmacokinetic data, adjusted for this patient's kidney & liver function</p>
            </div>
            {expandedSection === 'levels' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {expandedSection === 'levels' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="px-5 pb-5">
                  {aiLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Generating AI pharmacokinetic data…
                    </div>
                  ) : pkList.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                          <defs>
                            {pkList.map((d, i) => (
                              <linearGradient key={d.drugId} id={`grad-${d.drugId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={DRUG_COLORS[i]} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={DRUG_COLORS[i]} stopOpacity={0.02} />
                              </linearGradient>
                            ))}
                          </defs>
                          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={3} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }}
                            formatter={(v: number, name: string) => [`${v}%`, name]} />
                          {pkList.map((d, i) => (
                            <Area key={d.drugId} type="monotone" dataKey={d.genericName}
                              stroke={DRUG_COLORS[i]} strokeWidth={2}
                              fill={`url(#grad-${d.drugId})`}
                              dot={false} animationDuration={1200} animationBegin={i * 200} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {pkList.map((d, i) => (
                          <div key={d.drugId} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: DRUG_COLORS[i] }} />
                            <span className="text-xs text-muted-foreground">{d.genericName} — peak {d.peakHours}h, t½ {d.halfLifeHours}h{d.adjustNote ? ` (${d.adjustNote})` : ''}</span>
                          </div>
                        ))}
                      </div>
                      {aiData?.clinicalNote && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <Info size={12} className="inline mr-1.5 text-blue-600" />
                          <span className="text-xs text-blue-700">{aiData.clinicalNote}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No medicines in this patient's My Meds yet — add a combination from the Analysis page</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Body map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
          <button onClick={() => sectionToggle('body')} className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">{patientName}'s Body Map</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Patient data</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Organs highlighted in blue are affected based on AI pharmacological mapping</p>
            </div>
            {expandedSection === 'body' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {expandedSection === 'body' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="px-5 pb-5">
                  {aiLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Generating AI organ impact map…
                    </div>
                  ) : pkList.length > 0 ? (
                    <>
                      <BodyMap pkList={pkList} patientName={patientName} />
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {pkList.map((d, i) => (
                          <span key={d.drugId} className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                            style={{ background: DRUG_COLORS[i] }}>
                            {d.genericName} → {d.affectedOrgans.join(', ')}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No medicines in this patient's My Meds yet</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Chronopharmacology clock */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
          <button onClick={() => sectionToggle('clock')} className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">Chronopharmacology Clock — {patientName}</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Patient data</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock size={11} />
                AI-recommended optimal dosing windows based on each drug's pharmacokinetics
              </p>
            </div>
            {expandedSection === 'clock' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {expandedSection === 'clock' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="px-5 pb-5 flex flex-col items-center gap-4">
                  <p className="text-xs text-muted-foreground text-center max-w-md">
                    Chronopharmacology studies how the time of day affects how your body processes drugs. Each drug has an AI-recommended optimal dose window when it works best and causes fewest side effects.
                  </p>
                  {aiLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Generating AI dosing schedule…
                    </div>
                  ) : clockDrugs.length > 0 ? (
                    <>
                      <svg width="280" height="280" viewBox="0 0 280 280">
                        <circle cx="140" cy="140" r="120" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
                        <circle cx="140" cy="140" r="100" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
                        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
                          const angle = (h / 24) * 360 - 90;
                          const r = 108;
                          const x1 = 140 + Math.cos((angle * Math.PI) / 180) * r;
                          const y1 = 140 + Math.sin((angle * Math.PI) / 180) * r;
                          const x2 = 140 + Math.cos((angle * Math.PI) / 180) * (r - 10);
                          const y2 = 140 + Math.sin((angle * Math.PI) / 180) * (r - 10);
                          const lx = 140 + Math.cos((angle * Math.PI) / 180) * 125;
                          const ly = 140 + Math.sin((angle * Math.PI) / 180) * 125;
                          return (
                            <g key={h}>
                              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted-foreground)" strokeWidth="1.5" />
                              <text x={lx} y={ly + 4} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{h}h</text>
                            </g>
                          );
                        })}
                        {clockDrugs.map((d, i) => {
                          const r = 65 + i * 12;
                          const startAngle = d.angle;
                          const span = Math.min(80, 30 + d.halfLifeHours * 2);
                          const endAngle = startAngle + span;
                          const x1 = 140 + Math.cos((startAngle * Math.PI) / 180) * r;
                          const y1 = 140 + Math.sin((startAngle * Math.PI) / 180) * r;
                          const x2 = 140 + Math.cos((endAngle * Math.PI) / 180) * r;
                          const y2 = 140 + Math.sin((endAngle * Math.PI) / 180) * r;
                          const large = span > 180 ? 1 : 0;
                          return (
                            <g key={d.drugId}>
                              <motion.path
                                d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                                fill="none" stroke={d.color} strokeWidth="8" strokeLinecap="round"
                                opacity="0.7"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, delay: i * 0.2 }}
                              />
                              <circle cx={x1} cy={y1} r="5" fill={d.color} />
                              <text x={x1 + (x1 > 140 ? 8 : -8)} y={y1 + 4} textAnchor={x1 > 140 ? 'start' : 'end'}
                                fontSize="8" fontWeight="600" fill={d.color}>{d.genericName.slice(0, 8)}</text>
                            </g>
                          );
                        })}
                        <circle cx="140" cy="140" r="8" fill="var(--primary)" />
                        {(() => {
                          const nowH = new Date().getHours() + new Date().getMinutes() / 60;
                          const ang = (nowH / 24) * 360 - 90;
                          const ex = 140 + Math.cos((ang * Math.PI) / 180) * 95;
                          const ey = 140 + Math.sin((ang * Math.PI) / 180) * 95;
                          return <line x1="140" y1="140" x2={ex} y2={ey} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />;
                        })()}
                        <text x="140" y="250" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">Red hand = current time</text>
                      </svg>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {clockDrugs.map((d, i) => (
                          <div key={d.drugId} className="flex items-center gap-1.5 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                            <span className="text-muted-foreground">{d.genericName} — optimal dose at {d.optimalDoseHour}:00</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl w-full">
                        <Info size={12} className="inline mr-1.5 text-blue-600" />
                        <span className="text-xs text-blue-700">
                          Arc = active drug window (AI-calculated). Longer arc = longer half-life. Overlapping arcs at same enzyme pathway = risk of interaction.
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No medicines in this patient's My Meds yet</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DoctorLayout>
  );
}
