import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PatientLayout from '@/layouts/PatientLayout';

const DRUG_PLAIN_LANGUAGE: Record<string, {
  plain: string; takeWith: string; avoid: string; emoji: string;
  missedAdvice: string; doNotDouble: boolean; maxHoursLate: number;
}> = {
  d1: { plain: 'Controls blood sugar — helps your body use insulin better', takeWith: 'Food or right after a meal', avoid: 'Alcohol, skipping meals', emoji: '🩸', missedAdvice: 'Take it now if it\'s within 4 hours of the scheduled time. Skip it if almost time for the next dose. Never double up.', doNotDouble: true, maxHoursLate: 4 },
  d2: { plain: 'Relaxes blood vessel walls to lower your blood pressure', takeWith: 'Any time, with or without food', avoid: 'Grapefruit juice — it raises the drug\'s level in your blood', emoji: '💓', missedAdvice: 'Take it as soon as you remember the same day. If it\'s the next day, skip the missed dose. Do not take two doses at once.', doNotDouble: true, maxHoursLate: 12 },
  d3: { plain: 'Reduces pain, fever, and helps prevent blood clots', takeWith: 'Food or milk to protect your stomach', avoid: 'Alcohol, other NSAIDs like Ibuprofen at the same time', emoji: '🛡️', missedAdvice: 'Low-dose Aspirin: take it as soon as you remember today. If it\'s the next day, just continue your normal schedule.', doNotDouble: false, maxHoursLate: 12 },
  d4: { plain: 'Replaces the thyroid hormone your body doesn\'t make enough of', takeWith: 'Empty stomach — 30–60 minutes before eating', avoid: 'Iron supplements, antacids, soy, calcium — they block absorption', emoji: '🦋', missedAdvice: 'Take it immediately if you remember within a few hours on the same day. If it\'s nearly the next day, skip this dose and take it again tomorrow morning.', doNotDouble: true, maxHoursLate: 6 },
  d5: { plain: 'Provides iron to treat or prevent iron-deficiency anaemia', takeWith: 'Empty stomach or with Vitamin C (orange juice) for better absorption', avoid: 'Milk, antacids, tea, coffee — they reduce absorption significantly', emoji: '🔴', missedAdvice: 'Take it as soon as you remember. If it\'s almost time for the next dose, skip the missed one. Do not double up.', doNotDouble: true, maxHoursLate: 8 },
  d6: { plain: 'Provides folic acid essential for cell growth and preventing birth defects', takeWith: 'With or without food', avoid: 'Nothing specific, but consistency is important', emoji: '🌿', missedAdvice: 'Take it as soon as you remember. If it\'s the next day, just take today\'s dose normally.', doNotDouble: false, maxHoursLate: 24 },
  d7: { plain: 'Prevents dangerous blood clots — requires very careful dosing', takeWith: 'At the same time every day', avoid: 'Leafy greens in large quantities (affect levels), alcohol, aspirin without doctor guidance', emoji: '⚠️', missedAdvice: '⚠️ WARFARIN SPECIAL RULE: Take the missed dose the same day you remember. If you miss a whole day, contact your doctor or anticoagulation clinic before taking the next dose. Do NOT double up.', doNotDouble: true, maxHoursLate: 6 },
  d8: { plain: 'Lowers your cholesterol to protect your heart', takeWith: 'Evening or at bedtime — the body makes most cholesterol at night', avoid: 'Grapefruit juice, large amounts of alcohol', emoji: '💊', missedAdvice: 'Take it in the evening. If you miss it, skip and take the next dose at the regular evening time. Never double up.', doNotDouble: true, maxHoursLate: 12 },
  d9: { plain: 'Slows your heart rate and lowers blood pressure', takeWith: 'With food to reduce nausea', avoid: 'Suddenly stopping — this can be dangerous; always taper with doctor guidance', emoji: '💙', missedAdvice: 'Take it as soon as you remember. If it\'s nearly time for the next dose, skip this one. Never double up. Do not stop this medicine suddenly.', doNotDouble: true, maxHoursLate: 4 },
  d10: { plain: 'Relaxes blood vessels to lower blood pressure and protect kidneys', takeWith: 'Any time, with or without food', avoid: 'Salt substitutes with potassium, NSAIDs', emoji: '🫀', missedAdvice: 'Take it as soon as you remember today. If it\'s nearly the next day, skip it and resume normally.', doNotDouble: true, maxHoursLate: 12 },
  d11: { plain: 'Balances brain chemicals to reduce depression and anxiety', takeWith: 'Morning, with breakfast', avoid: 'Alcohol, St. John\'s Wort, other antidepressants', emoji: '🧠', missedAdvice: 'Take it as soon as you remember on the same day. If it\'s the next morning, just take your regular morning dose. Do not double up. Some people feel dizziness if they miss a dose.', doNotDouble: true, maxHoursLate: 12 },
  d12: { plain: 'Reduces stomach acid to prevent or treat ulcers and reflux', takeWith: '30 minutes before breakfast', avoid: 'Nothing specific, but timing matters for effectiveness', emoji: '🤢', missedAdvice: 'Take it if you remember before eating. If you\'ve already eaten, skip this dose and take tomorrow\'s dose before breakfast.', doNotDouble: false, maxHoursLate: 4 },
};

const DEFAULT_DRUG_INFO = {
  plain: 'Follow your doctor\'s exact instructions for this medicine',
  takeWith: 'As directed by your doctor',
  avoid: 'Ask your doctor about specific restrictions',
  emoji: '💊',
  missedAdvice: 'Contact your doctor or pharmacist for specific advice on missed doses.',
  doNotDouble: true,
  maxHoursLate: 6,
};

const DRUG_DOSE_TIMES: Record<string, { time: string; hour: number }> = {
  d1: { time: '08:00', hour: 8 }, d2: { time: '09:00', hour: 9 }, d3: { time: '13:00', hour: 13 },
  d4: { time: '07:00', hour: 7 }, d5: { time: '09:00', hour: 9 }, d6: { time: '10:00', hour: 10 },
  d7: { time: '18:00', hour: 18 }, d8: { time: '21:00', hour: 21 }, d9: { time: '08:00', hour: 8 },
  d10: { time: '08:00', hour: 8 }, d11: { time: '09:00', hour: 9 }, d12: { time: '07:30', hour: 7.5 },
};

export default function Meds() {
  const { selectedPatient, drugs: allDrugs } = useApp();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [missedDrug, setMissedDrug] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('cards');

  const patientDrugIds = selectedPatient?.drugs ?? [];
  const meds = patientDrugIds.map(id => {
    const drug = allDrugs.find(d => d.id === id);
    const info = DRUG_PLAIN_LANGUAGE[id] ?? DEFAULT_DRUG_INFO;
    const schedule = DRUG_DOSE_TIMES[id] ?? { time: '08:00', hour: 8 };
    return { id, name: drug?.name ?? id, genericName: drug?.genericName ?? id, class: drug?.class ?? '', info, schedule };
  });

  const currentHour = new Date().getHours();


  const missedDrugData = missedDrug ? meds.find(m => m.id === missedDrug) : null;
  const hoursSinceDue = missedDrug ? Math.max(0, currentHour - (DRUG_DOSE_TIMES[missedDrug]?.hour ?? 8)) : 0;

  const sectionToggle = (s: string) => setExpandedSection(prev => prev === s ? '' : s);

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-foreground">My Medicines</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Flip each card to understand your medications · {meds.length} prescribed</p>
        </motion.div>

        {/* 3D flip drug cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden">
          <button onClick={() => sectionToggle('cards')} className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
            <div className="text-left">
              <h2 className="font-bold text-foreground">My Drug Cards</h2>
              <p className="text-xs text-muted-foreground">Tap a card to flip it — see what each medicine does in plain language</p>
            </div>
            {expandedSection === 'cards' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {expandedSection === 'cards' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="px-4 pb-4 grid grid-cols-1 gap-3">
                  {meds.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No medicines in your profile yet. Your doctor will add them.</p>
                  )}
                  {meds.map((med, i) => {
                    const isFlipped = flippedCard === med.id;
                    return (
                      <motion.div key={med.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        data-testid={`card-${med.id}`}>
                        <div style={{ perspective: '1000px', height: 120 }} onClick={() => setFlippedCard(isFlipped ? null : med.id)}>
                          <motion.div style={{ transformStyle: 'preserve-3d', height: '100%', cursor: 'pointer' }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}>
                            {/* Front */}
                            <div className="rounded-2xl p-4 flex items-center gap-4"
                              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(212,83,126,0.08))', border: '1px solid rgba(124,58,237,0.2)', backfaceVisibility: 'hidden', position: 'absolute', inset: 0 } as React.CSSProperties}>
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                style={{ background: 'rgba(124,58,237,0.1)' }}>
                                {med.info.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground">{med.genericName}</p>
                                <p className="text-xs text-muted-foreground">{med.name} · {med.class}</p>
                                <p className="text-xs mt-1" style={{ color: '#7C3AED' }}>Tap to flip and learn more →</p>
                              </div>
                            </div>
                            {/* Back */}
                            <div className="rounded-2xl p-4 overflow-y-auto"
                              style={{ background: 'linear-gradient(135deg, #7C3AED, #D4537E)', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 } as React.CSSProperties}>
                              <p className="text-white font-bold text-sm mb-1">{med.genericName}</p>
                              <p className="text-white/90 text-xs leading-relaxed mb-2">{med.info.plain}</p>
                              <div className="flex gap-3">
                                <div>
                                  <p className="text-white/60 text-xs">Take with</p>
                                  <p className="text-white text-xs font-medium">{med.info.takeWith}</p>
                                </div>
                                <div>
                                  <p className="text-white/60 text-xs">Avoid</p>
                                  <p className="text-white text-xs font-medium">{med.info.avoid}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>


        {/* Missed dose helper — realistic */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden">
          <button onClick={() => sectionToggle('missed')} className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
            <div className="text-left">
              <h2 className="font-bold text-foreground">Forgot a Dose?</h2>
              <p className="text-xs text-muted-foreground">Tell me which medicine — I'll give you safe guidance</p>
            </div>
            {expandedSection === 'missed' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {expandedSection === 'missed' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {meds.map(med => (
                      <button key={med.id}
                        onClick={() => setMissedDrug(missedDrug === med.id ? null : med.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${missedDrug === med.id ? 'border-amber-400 bg-amber-50' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
                        data-testid={`missed-${med.id}`}>
                        <p className="text-xs font-bold text-foreground truncate">{med.genericName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={10} className="text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{DRUG_DOSE_TIMES[med.id]?.time ?? '08:00'}</p>
                        </div>
                      </button>
                    ))}
                    {meds.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-3">No medicines in your profile yet.</p>}
                  </div>

                  <AnimatePresence>
                    {missedDrug && missedDrugData && (
                      <motion.div key={missedDrug}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="rounded-2xl overflow-hidden border border-amber-200">
                        {/* Header */}
                        <div className="p-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
                              {missedDrugData.info.emoji}
                            </div>
                            <div>
                              <p className="font-bold text-white">{missedDrugData.genericName}</p>
                              <p className="text-white/80 text-xs">Scheduled: {DRUG_DOSE_TIMES[missedDrug]?.time ?? '08:00'} · {hoursSinceDue.toFixed(0)} hrs ago</p>
                            </div>
                          </div>
                        </div>

                        {/* Timeline visual */}
                        <div className="p-4 bg-amber-50 border-b border-amber-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <div className="flex-1 h-0.5 bg-gray-200" />
                            <div className={`w-3 h-3 rounded-full ${hoursSinceDue > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 h-0.5 bg-gray-200" />
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Previous dose</span>
                            <span className="font-semibold text-amber-600">Missed dose ({DRUG_DOSE_TIMES[missedDrug]?.time ?? '–'})</span>
                            <span>Next dose</span>
                          </div>
                        </div>

                        {/* Advice */}
                        <div className="p-4 space-y-3 bg-white">
                          <div className={`p-3 rounded-xl border ${missedDrugData.info.doNotDouble ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {missedDrugData.info.doNotDouble
                                ? <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                : <CheckCircle size={14} className="text-green-500 shrink-0" />}
                              <p className={`text-xs font-bold ${missedDrugData.info.doNotDouble ? 'text-red-700' : 'text-green-700'}`}>
                                {missedDrugData.info.doNotDouble ? 'DO NOT take a double dose' : 'Can catch up if not too late'}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                              <span>🩺</span> What to do:
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">{missedDrugData.info.missedAdvice}</p>
                          </div>

                          {hoursSinceDue <= missedDrugData.info.maxHoursLate ? (
                            <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                              <p className="text-xs font-semibold text-green-700 mb-0.5">✅ Within safe catch-up window</p>
                              <p className="text-xs text-green-600">
                                It's been ~{hoursSinceDue.toFixed(0)} hours. Taking it now is likely safe for {missedDrugData.genericName}. But if unsure, call your doctor.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                              <p className="text-xs font-semibold text-red-700 mb-0.5">⚠ Catch-up window passed</p>
                              <p className="text-xs text-red-600">
                                It's been ~{hoursSinceDue.toFixed(0)} hours — skip this dose and resume your regular schedule. If you're unsure, call your doctor before taking it.
                              </p>
                            </div>
                          )}

                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-xs text-blue-700">
                              📞 <strong>When in doubt, always call your doctor or pharmacist.</strong> They can give specific advice based on your full medical situation.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
