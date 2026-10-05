import DeletePatientButton from '@/components/DeletePatientButton';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, PillBottle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import DoctorLayout from '@/layouts/DoctorLayout';
import { computeRisk } from '@/lib/interactions';

const RISK_COLORS: Record<string, string> = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

const CYP_INTERACTIONS: Record<string, { drugs: string[]; role: string }> = {
  CYP3A4: { drugs: ['d2', 'd7', 'd8', 'd14', 'd20'], role: 'Metabolises many drugs; overlap causes competition — one drug blocks another\'s breakdown, raising its blood level' },
  CYP2C9: { drugs: ['d3', 'd7', 'd15', 'd18', 'd19'], role: 'Warfarin\'s primary pathway. NSAIDs can displace warfarin here, dangerously raising its plasma level' },
  CYP2D6: { drugs: ['d9', 'd11'], role: 'Psychiatric & cardiac drug pathway. Sertraline inhibits this enzyme, slowing Metoprolol clearance' },
  CYP2C19: { drugs: ['d11', 'd12', 'd16'], role: 'PPIs and SSRIs share this path. Pantoprazole can reduce Sertraline metabolism' },
  CYP1A2: { drugs: ['d20'], role: 'Caffeine-sensitive pathway. Ciprofloxacin strongly inhibits CYP1A2' },
};

const DRUG_SIDE_EFFECTS: Record<string, string[]> = {
  Biguanide: ['Nausea', 'GI upset', 'Lactic acidosis (rare)'],
  CCB: ['Ankle swelling', 'Flushing', 'Headache'],
  NSAID: ['GI irritation', 'Renal strain', 'Increased bleeding risk'],
  Anticoagulant: ['Easy bruising', 'Prolonged bleeding', 'Haematuria'],
  Statin: ['Myalgia', 'Liver enzyme elevation', 'Rhabdomyolysis (rare)'],
  'Beta Blocker': ['Fatigue', 'Cold extremities', 'Bradycardia'],
  'ACE Inhibitor': ['Dry cough', 'Hyperkalaemia', 'Angioedema (rare)'],
  SSRI: ['Nausea', 'Insomnia', 'Serotonin syndrome risk'],
  PPI: ['Headache', 'Hypomagnesaemia long-term', 'C. diff risk'],
  ARB: ['Dizziness', 'Hyperkalaemia', 'Renal impairment'],
  Thyroid: ['Palpitations if overdosed', 'Insomnia', 'Weight changes'],
  Sulfonylurea: ['Hypoglycaemia', 'Weight gain', 'GI upset'],
  default: ['Monitor for unusual symptoms', 'Report any side effects promptly'],
};

function riskFromDrugs(drugIds: string[], allDrugs: { id: string; cyp: string[]; pregnancyCategory: string }[]) {
  if (drugIds.length < 2) return { score: 0, level: 'Insufficient', cyp: [] as string[] };
  const selected = allDrugs.filter(d => drugIds.includes(d.id));
  const allCyp = selected.flatMap(d => d.cyp);
  const counts: Record<string, number> = {};
  allCyp.forEach(c => { counts[c] = (counts[c] ?? 0) + 1; });
  const conflicts = Object.values(counts).filter(n => n > 1);
  const hasX = selected.some(d => d.pregnancyCategory === 'X');
  const score = Math.min(100, 18 + conflicts.reduce((s, c) => s + c * 18, 0) + (hasX ? 15 : 0) + (drugIds.length - 2) * 8);
  const conflictEnzymes = Object.entries(counts).filter(([, c]) => c > 1).map(([e]) => e);
  const level = score >= 70 ? 'Critical' : score >= 50 ? 'High' : score >= 30 ? 'Medium' : 'Low';
  return { score, level, cyp: conflictEnzymes };
}

// SVG organ with animated fill from bottom to top
function OrganFill({ pct, label, organType, doAnimate }: { pct: number; label: string; organType: 'kidney' | 'liver'; doAnimate: boolean }) {
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  // Kidney: bean/concave shape | Liver: rounded triangular blob
  const kidneyPath = 'M50,6 C66,6 80,19 80,42 C80,64 68,87 50,93 C38,96 25,89 19,78 C14,69 15,58 18,48 C21,38 29,35 29,28 C29,18 20,13 22,8 C27,5 40,6 50,6 Z';
  const liverPath = 'M14,52 C8,35 18,10 40,8 C55,6 69,14 80,8 C93,2 103,19 100,40 C97,58 84,74 64,78 C43,82 20,76 12,63 C9,57 11,54 14,52 Z';
  const path = organType === 'kidney' ? kidneyPath : liverPath;
  const vb = organType === 'kidney' ? '0 0 100 100' : '0 0 110 88';
  const H = organType === 'kidney' ? 100 : 88;
  const W = organType === 'kidney' ? 100 : 110;
  const uid = `organ-${organType}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: organType === 'kidney' ? 80 : 100, height: organType === 'kidney' ? 88 : 70 }}>
        <svg width="100%" height="100%" viewBox={vb} overflow="visible">
          <defs>
            <clipPath id={uid}><path d={path} /></clipPath>
          </defs>
          {/* Background */}
          <path d={path} fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
          {/* Animated fill bar clipped to organ shape */}
          <motion.rect
            x="0" width={W}
            fill={color}
            clipPath={`url(#${uid})`}
            initial={{ y: H, height: 0 }}
            animate={doAnimate
              ? { y: H - (pct / 100) * H, height: (pct / 100) * H }
              : { y: H, height: 0 }}
            transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          />
          {/* Ripple at fill surface */}
          {doAnimate && (
            <motion.ellipse
              cx={W / 2}
              cy={H - (pct / 100) * H}
              rx={W * 0.25} ry="3"
              fill={color} fillOpacity="0.5"
              animate={{ scaleX: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
            />
          )}
          {/* Outline on top for crisp edge */}
          <path d={path} fill="none" stroke={pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'} strokeWidth="2" />
          {/* % label */}
          <text x={W / 2} y={H / 2 + 2} textAnchor="middle" dominantBaseline="middle"
            fontSize="15" fontWeight="800" fill={pct > 45 ? 'white' : '#374151'}>{pct}%</text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color }}>
          {pct >= 70 ? 'Normal' : pct >= 50 ? 'Reduced' : 'Impaired'}
        </p>
        <p className="text-xs text-muted-foreground">
          {organType === 'kidney' ? `eGFR ~${Math.round(pct * 1.2)} mL/min` : `ALT est. ${Math.round((100 - pct) * 0.5 + 12)} U/L`}
        </p>
      </div>
    </div>
  );
}

export default function Analysis() {
  const { patients, drugs: allDrugs, analysisPatientId, setAnalysisPatientId, addMedsToPatient } = useApp();
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string; canReplace?: boolean } | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(analysisPatientId ?? '');
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('cyp');

  const patient = patients.find(p => p.id === selectedPatientId) ?? null;

  useEffect(() => {
    if (patient) {
      setSelectedDrugs(patient.drugs.slice(0, 5));
      setAnalyzed(false);
      setAddMsg(null);
    }
  }, [selectedPatientId]);

  const { score, level, cyp } = riskFromDrugs(selectedDrugs, allDrugs);
  const dbSelected = allDrugs.filter(d => selectedDrugs.includes(d.id));
  const availableDrugs = allDrugs.filter(d => !selectedDrugs.includes(d.id));

  const cypConflicts = Object.entries(CYP_INTERACTIONS).map(([enzyme, data]) => {
    const involved = dbSelected.filter(d => data.drugs.includes(d.id));
    return { enzyme, involved, role: data.role, conflict: involved.length > 1 };
  }).filter(c => c.involved.length > 0);

  const allSideEffects = dbSelected.flatMap(d => {
    const fx = DRUG_SIDE_EFFECTS[d.class] ?? DRUG_SIDE_EFFECTS.default;
    return fx.map(f => ({ drug: d.genericName, effect: f, cls: d.class }));
  });

  const handleAddToMeds = (mode: 'merge' | 'replace' = 'merge') => {
    if (!patient) return;
    const res = addMedsToPatient(patient.id, selectedDrugs, mode);
    if (res.success) {
      const names = res.added.map(id => allDrugs.find(d => d.id === id)?.genericName ?? id).join(', ');
      setAddMsg({ ok: true, text: mode === 'replace'
        ? `${patient.name}'s My Meds now matches this combination.`
        : `Added to ${patient.name}'s My Meds: ${names}. They have been notified.` });
    } else {
      setAddMsg({ ok: false, text: res.error ?? 'Could not update', canReplace: !!res.error?.includes('at most 5') });
    }
  };

  const handleAnalyze = () => {
    if (selectedDrugs.length < 2) return;
    setAnalysisPatientId(selectedPatientId);
    setAnalyzed(true);
    setExpandedSection('cyp');
  };

  const riskColor = analyzed ? (RISK_COLORS[level] ?? '#9ca3af') : '#9ca3af';

  const removeDrug = (idx: number) => {
    setSelectedDrugs(prev => prev.filter((_, j) => j !== idx));
    setAnalyzed(false);
    setAddMsg(null);
  };

  return (
    <DoctorLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deep Interaction Analysis</h1>
            <p className="text-muted-foreground text-sm mt-1">Select a patient, adjust the drug combination, then run analysis</p>
            {patient && <div className="mt-3"><DeletePatientButton patientId={patient.id} patientName={patient.name} variant="full" /></div>}
          </div>
          {/* Patient picker */}
          <div className="relative">
            <button onClick={() => setShowPatientDropdown(d => !d)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/50 transition-colors min-w-52"
              data-testid="btn-select-patient">
              <span>{patient?.name ?? 'Select patient…'}</span>
              {showPatientDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showPatientDropdown && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 4, scale: 1 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full z-50 bg-card border border-border rounded-xl shadow-2xl min-w-60 overflow-hidden">
                  {patients.map(p => (
                    <button key={p.id}
                      onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/8 transition-colors border-b border-border/40 last:border-0 ${p.id === selectedPatientId ? 'bg-primary/5' : ''}`}
                      data-testid={`patient-opt-${p.id}`}>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.drugs.length} drugs · {computeRisk(p, allDrugs)} risk · {p.conditions.join(', ')}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Drug combination builder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-foreground">Drug Combination</h2>
              <p className="text-xs text-muted-foreground">Minimum 2 required · Maximum 5 · Core business rule</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedDrugs.length}/5</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full border ${i <= selectedDrugs.length ? 'bg-primary border-primary' : i <= 2 ? 'border-primary/60' : 'border-border'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[0, 1, 2, 3, 4].map(i => {
              const drug = selectedDrugs[i] ? allDrugs.find(d => d.id === selectedDrugs[i]) : null;
              const required = i < 2;
              return (
                <motion.div key={i}
                  animate={!drug && required ? { boxShadow: ['0 0 0 0 rgba(24,95,165,0)', '0 0 0 6px rgba(24,95,165,0.18)', '0 0 0 0 rgba(24,95,165,0)'] } : {}}
                  transition={!drug && required ? { duration: 2, repeat: Infinity } : {}}
                  className={`relative rounded-xl border-2 p-3 min-h-24 flex flex-col justify-between transition-colors ${drug ? 'bg-primary/5 border-primary/40' : required ? 'border-dashed border-primary/50' : 'border-dashed border-border'}`}>
                  {drug ? (
                    <>
                      <button onClick={() => removeDrug(i)}
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-500 transition-colors bg-muted/80">
                        <X size={10} />
                      </button>
                      <div>
                        <p className="text-xs font-bold text-primary leading-tight">{drug.name}</p>
                        <p className="text-xs text-muted-foreground">{drug.genericName}</p>
                      </div>
                      <div>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{drug.class}</span>
                        {drug.cyp.length > 0 && <p className="text-xs text-orange-500 mt-1 font-medium">{drug.cyp.join(', ')}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1 text-center py-2">
                      <span className="text-2xl">{required ? '💊' : '+'}</span>
                      <span className="text-xs text-muted-foreground">{required ? `Slot ${i + 1} (required)` : `Optional ${i - 1}`}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {selectedDrugs.length < 5 && (
            <select className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
              value="" onChange={e => { if (e.target.value) { setSelectedDrugs(p => [...p, e.target.value]); setAnalyzed(false); } }}
              data-testid="select-drug">
              <option value="">+ Add a drug to the combination…</option>
              {availableDrugs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.genericName}) — {d.class}</option>)}
            </select>
          )}

          <motion.button
            whileHover={{ scale: selectedDrugs.length >= 2 ? 1.02 : 1 }}
            whileTap={{ scale: selectedDrugs.length >= 2 ? 0.97 : 1 }}
            onClick={handleAnalyze}
            disabled={selectedDrugs.length < 2}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: selectedDrugs.length >= 2 ? 'linear-gradient(135deg, #185FA5, #0F6E56)' : '#9ca3af' }}
            data-testid="btn-analyze">
            <FlaskConical size={16} className="inline mr-2 mb-0.5" />
            {analyzed ? 'Re-run Analysis' : 'Analyse Drug Combination'}
            {selectedDrugs.length < 2 && <span className="ml-2 font-normal text-sm opacity-80">(need at least 2 drugs)</span>}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {analyzed && (
            <motion.div key="results" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">

              {/* Risk score */}
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-4">Overall Risk Score</h2>
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="42" fill="none" stroke={riskColor} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
                        transition={{ duration: 1.6, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black" style={{ color: riskColor }}>{score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black" style={{ color: riskColor }}>{level} Risk</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {level === 'Critical' ? 'Urgent review needed. Dangerous interaction detected — consider stopping or replacing one drug.' :
                        level === 'High' ? 'Close monitoring essential. Discuss alternatives and educate patient on warning signs.' :
                          level === 'Medium' ? 'Monitor regularly. Ensure patient knows signs of adverse reactions.' :
                            'Combination is generally safe with routine monitoring.'}
                    </p>
                    {patient && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Analysis for <span className="font-semibold text-foreground">{patient.name}</span> ·
                        {patient.age}{patient.gender} · {patient.conditions.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Add to patient's My Meds */}
              {patient && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="bg-card/80 backdrop-blur-sm border border-primary/30 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="font-bold text-foreground">Prescribe to {patient.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Adds this combination to the patient's <span className="font-semibold">My Meds</span> page and notifies them.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {dbSelected.map(d => {
                          const has = patient.drugs.includes(d.id);
                          return (
                            <span key={d.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${has ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                              {d.genericName}{has ? ' ✓ in My Meds' : ' · new'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={() => handleAddToMeds('merge')}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #185FA5, #0F6E56)' }}
                      data-testid="btn-add-to-patient">
                      <PillBottle size={15} className="inline mr-2 mb-0.5" />Add to patient's My Meds
                    </button>
                  </div>
                  {addMsg && (
                    <div className={`mt-3 p-3 rounded-xl text-xs border ${addMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      {addMsg.text}
                      {addMsg.canReplace && (
                        <button onClick={() => handleAddToMeds('replace')} className="ml-2 underline font-semibold">
                          Replace their current list with this combination
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Organ function with SVG fill animation */}
              {patient && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-foreground">Organ Function</h2>
                    <span className="text-xs text-muted-foreground italic">Fill animation = actual function level</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">
                    Kidney and liver function control how fast drugs are cleared from the body. Lower function → slower clearance → higher drug levels → increased toxicity risk.
                  </p>
                  <div className="flex items-start justify-around gap-6 flex-wrap">
                    <OrganFill pct={patient.kidneyFunction} label="Kidney Function" organType="kidney" doAnimate={analyzed} />
                    <OrganFill pct={patient.liverFunction} label="Liver Function" organType="liver" doAnimate={analyzed} />
                  </div>
                  {(patient.kidneyFunction < 60 || patient.liverFunction < 70) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                      className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle size={13} className="inline mr-1.5 text-amber-600" />
                      <span className="text-xs text-amber-700">
                        {patient.name}'s {patient.kidneyFunction < 60 ? `kidney function (${patient.kidneyFunction}%) is reduced — renally-cleared drugs like Metformin may accumulate. ` : ''}
                        {patient.liverFunction < 70 ? `Liver function (${patient.liverFunction}%) is reduced — hepatically-metabolised drugs process more slowly, raising plasma levels.` : ''}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* CYP450 Map */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedSection(s => s === 'cyp' ? null : 'cyp')}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                  <div className="text-left">
                    <h2 className="font-bold text-foreground">Liver Enzyme (CYP450) Conflict Map</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                      CYP450 enzymes are proteins in your liver that break down drugs. When two drugs use the same enzyme, they compete — one blocks the other's breakdown, causing unexpectedly high blood levels.
                    </p>
                  </div>
                  {expandedSection === 'cyp' ? <ChevronUp size={16} className="shrink-0 ml-3" /> : <ChevronDown size={16} className="shrink-0 ml-3" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'cyp' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <div className="px-5 pb-5 space-y-3">
                        {cypConflicts.length === 0 ? (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                            <CheckCircle size={15} /><span className="text-sm">No CYP450 enzyme conflicts in this combination</span>
                          </div>
                        ) : (
                          cypConflicts.map(({ enzyme, involved, role, conflict }) => (
                            <motion.div key={enzyme}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              className={`p-4 rounded-xl border ${conflict ? 'bg-red-50 border-red-200' : 'bg-muted/40 border-border'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm" style={{ color: conflict ? '#ef4444' : '#185FA5' }}>{enzyme}</span>
                                {conflict && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">CONFLICT</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{role}</p>
                              <div className="flex flex-wrap gap-2">
                                {involved.map(d => (
                                  <span key={d.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${conflict ? 'bg-red-100 text-red-700' : 'bg-muted text-foreground'}`}>
                                    {d.genericName}
                                  </span>
                                ))}
                              </div>
                              {conflict && (
                                <p className="text-xs text-red-600 mt-2 font-medium">
                                  <AlertTriangle size={11} className="inline mr-1" />
                                  {involved.map(d => d.genericName).join(' + ')} compete on {enzyme}. Consider dose reduction or alternative drug.
                                </p>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Side effects */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedSection(s => s === 'se' ? null : 'se')}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                  <div className="text-left">
                    <h2 className="font-bold text-foreground">Side Effect Probability</h2>
                    {patient && <p className="text-xs text-muted-foreground mt-0.5">Predicted for {patient.name} — adjusted for their kidney & liver function and detected CYP conflicts</p>}
                  </div>
                  {expandedSection === 'se' ? <ChevronUp size={16} className="shrink-0 ml-3" /> : <ChevronDown size={16} className="shrink-0 ml-3" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'se' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <div className="px-5 pb-5 space-y-3">
                        {allSideEffects.map(({ drug, effect, cls }, i) => {
                          const base = 14 + (i % 5) * 11;
                          const kMod = (patient && patient.kidneyFunction < 60 && ['Biguanide', 'Anticoagulant'].includes(cls)) ? 22 : 0;
                          const lMod = (patient && patient.liverFunction < 70 && ['Statin', 'Anticoagulant', 'SSRI'].includes(cls)) ? 18 : 0;
                          const cMod = cyp.length > 0 ? 12 : 0;
                          const prob = Math.min(90, base + kMod + lMod + cMod);
                          const barColor = prob >= 60 ? '#ef4444' : prob >= 38 ? '#f59e0b' : '#22c55e';
                          return (
                            <div key={`${drug}-${i}`} className="flex items-center gap-3">
                              <div className="w-22 text-xs text-muted-foreground truncate shrink-0 w-24">{drug}</div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-foreground">{effect}</span>
                                  <span className="text-xs font-bold shrink-0 ml-2" style={{ color: barColor }}>{prob}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${prob}%` }}
                                    transition={{ delay: i * 0.05 + 0.2, duration: 0.9, ease: 'easeOut' }}
                                    className="h-full rounded-full relative overflow-hidden"
                                    style={{ background: barColor }}>
                                    <motion.div
                                      animate={{ x: ['-100%', '250%'] }}
                                      transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                                      className="absolute inset-y-0 w-1/3 opacity-40"
                                      style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {patient && (
                          <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <Info size={12} className="inline mr-1.5 text-blue-600" />
                            <span className="text-xs text-blue-700">
                              Probabilities are specific to {patient.name} — factoring in kidney ({patient.kidneyFunction}%), liver ({patient.liverFunction}%), and {cyp.length > 0 ? `${cyp.length} CYP conflict(s) detected` : 'no CYP conflicts'}.
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DoctorLayout>
  );
}
