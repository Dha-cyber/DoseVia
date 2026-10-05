import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, UserPlus, X } from 'lucide-react';
import DeletePatientButton from '@/components/DeletePatientButton';
import { useApp } from '@/contexts/AppContext';
import { computeRisk } from '@/lib/interactions';
import { Drug, Patient, RiskLevel } from '@/lib/drugData';
import { useLocation } from 'wouter';
import DoctorLayout from '@/layouts/DoctorLayout';

const PREG_COLORS = { A: 'bg-green-100 text-green-700', B: 'bg-teal-100 text-teal-700', C: 'bg-amber-100 text-amber-700', D: 'bg-orange-100 text-orange-700', X: 'bg-red-100 text-red-700' } as const;
const RISK_COLORS = { Low: 'bg-green-100 text-green-700', Medium: 'bg-amber-100 text-amber-700', High: 'bg-orange-100 text-orange-700', Critical: 'bg-red-100 text-red-700' } as const;

interface NewPatientForm {
  name: string;
  age: string;
  gender: string;
  conditions: string;
  drugs: string[];
  kidneyFunction: string;
  liverFunction: string;
  allergies: string;
  pregnant: boolean;
}

const EMPTY_PATIENT: NewPatientForm = {
  name: '', age: '', gender: 'M', conditions: '', drugs: [],
  kidneyFunction: '90', liverFunction: '90', allergies: '', pregnant: false,
};

export default function Database() {
  const [tab, setTab] = useState<'drugs' | 'patients'>('drugs');
  const { drugs, setDrugs, patients, setPatients, setAnalysisPatientId } = useApp();
  const [drugSearch, setDrugSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [, setLocation] = useLocation();
  const [newDrug, setNewDrug] = useState({ name: '', genericName: '', class: '', cyp: '' });
  const [newPatient, setNewPatient] = useState<NewPatientForm>(EMPTY_PATIENT);
  const [patientError, setPatientError] = useState('');

  const filteredDrugs = drugs.filter(d =>
    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.genericName.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.class.toLowerCase().includes(drugSearch.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.conditions.join(' ').toLowerCase().includes(patientSearch.toLowerCase())
  );

  const deleteDrug = (id: string) => setDrugs(drugs.filter(d => d.id !== id));

  const addDrug = () => {
    const d: Drug = {
      id: `d${Date.now()}`,
      name: newDrug.name || 'New Drug',
      genericName: newDrug.genericName || 'Generic',
      class: newDrug.class || 'Unknown',
      cyp: newDrug.cyp ? newDrug.cyp.split(',').map(s => s.trim()) : [],
      pregnancyCategory: 'C',
    };
    setDrugs([d, ...drugs]);
    setNewDrug({ name: '', genericName: '', class: '', cyp: '' });
    setShowAddDrug(false);
  };

  const toggleDrugSelection = (drugId: string) => {
    setNewPatient(prev => ({
      ...prev,
      drugs: prev.drugs.includes(drugId)
        ? prev.drugs.filter(id => id !== drugId)
        : prev.drugs.length >= 5 ? prev.drugs : [...prev.drugs, drugId],
    }));
  };

  const addPatient = () => {
    setPatientError('');
    if (!newPatient.name.trim()) { setPatientError('Patient name is required'); return; }
    if (!newPatient.age || isNaN(Number(newPatient.age)) || Number(newPatient.age) < 1) { setPatientError('Valid age is required'); return; }

    const conditionsArr = newPatient.conditions.split(',').map(s => s.trim()).filter(Boolean);
    const allergiesArr = newPatient.allergies.split(',').map(s => s.trim()).filter(Boolean);

    const p: Patient = {
      id: `p${Date.now()}`,
      name: newPatient.name.trim(),
      age: Number(newPatient.age),
      gender: newPatient.gender,
      conditions: conditionsArr.length ? conditionsArr : ['General'],
      drugs: newPatient.drugs,
      kidneyFunction: Math.min(100, Math.max(0, Number(newPatient.kidneyFunction) || 90)),
      liverFunction: Math.min(100, Math.max(0, Number(newPatient.liverFunction) || 90)),
      allergies: allergiesArr,
      pregnant: newPatient.pregnant,
    };
    setPatients([p, ...patients]);
    setNewPatient(EMPTY_PATIENT);
    setShowAddPatient(false);
  };

  const goAnalysis = (id: string) => {
    setAnalysisPatientId(id);
    setLocation('/doctor/analysis');
  };

  return (
    <DoctorLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Databases</h1>
            <p className="text-muted-foreground text-sm mt-1">Drug and patient reference databases</p>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="relative flex bg-muted rounded-xl p-1 w-fit">
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-card shadow-sm"
            animate={{ left: tab === 'drugs' ? '4px' : 'calc(50% + 2px)', right: tab === 'drugs' ? 'calc(50% + 2px)' : '4px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          {(['drugs', 'patients'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${tab === t ? 'text-foreground' : 'text-muted-foreground'}`}
              data-testid={`tab-db-${t}`}>
              {t === 'drugs' ? 'Drug Database' : 'Patient Database'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'drugs' && (
            <motion.div key="drugs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={drugSearch} onChange={e => setDrugSearch(e.target.value)} placeholder="Search drugs..."
                    className="pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 w-52"
                    data-testid="input-drug-search" />
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setShowAddDrug(s => !s)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
                  data-testid="button-add-drug">
                  <Plus size={14} /> Add Drug
                </motion.button>
              </div>

              <AnimatePresence>
                {showAddDrug && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border bg-muted/30">
                    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[['name', 'Brand Name'], ['genericName', 'Generic Name'], ['class', 'Drug Class'], ['cyp', 'CYP Enzymes (comma-sep)']].map(([k, label]) => (
                        <input key={k} value={newDrug[k as keyof typeof newDrug]} onChange={e => setNewDrug(n => ({ ...n, [k]: e.target.value }))}
                          placeholder={label} className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      ))}
                      <motion.button whileTap={{ scale: 0.96 }} onClick={addDrug}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold col-span-2 md:col-span-4"
                        data-testid="button-save-drug">
                        Save Drug
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['Brand Name', 'Generic Name', 'Drug Class', 'CYP Enzymes', 'Pregnancy Cat.', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs text-muted-foreground font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrugs.map((drug, i) => (
                      <motion.tr key={drug.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-drug-${drug.id}`}>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{drug.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{drug.genericName}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{drug.class}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {drug.cyp.length === 0 ? <span className="text-xs text-muted-foreground">None</span> : drug.cyp.map(e => (
                              <span key={e} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{e}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PREG_COLORS[drug.pregnancyCategory]}`}>
                            {drug.pregnancyCategory === 'X' ? (
                              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>{drug.pregnancyCategory}</motion.span>
                            ) : drug.pregnancyCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => deleteDrug(drug.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            data-testid={`button-delete-drug-${drug.id}`}>
                            <Trash2 size={14} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'patients' && (
            <motion.div key="patients" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

              {/* Add Patient Button + Form */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search patients..."
                      className="pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 w-52"
                      data-testid="input-patient-db-search" />
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setShowAddPatient(s => !s); setPatientError(''); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
                    data-testid="button-add-patient">
                    {showAddPatient ? <X size={14} /> : <UserPlus size={14} />}
                    {showAddPatient ? 'Cancel' : 'Add Patient'}
                  </motion.button>
                </div>

                {/* Add Patient Form */}
                <AnimatePresence>
                  {showAddPatient && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-border bg-emerald-50/40 dark:bg-emerald-950/20">
                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <UserPlus size={16} className="text-emerald-600" />
                          <h3 className="font-bold text-foreground">Register New Patient</h3>
                          <span className="text-xs text-muted-foreground ml-1">· Patient will appear in login list immediately</span>
                        </div>

                        {/* Row 1: Name, Age, Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name *</label>
                            <input
                              value={newPatient.name}
                              onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Ramesh Verma"
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Age *</label>
                            <input
                              type="number" min="1" max="120"
                              value={newPatient.age}
                              onChange={e => setNewPatient(p => ({ ...p, age: e.target.value }))}
                              placeholder="e.g. 45"
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                            />
                          </div>
                        </div>

                        {/* Row 2: Gender, Risk, Pregnant */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Gender</label>
                            <select
                              value={newPatient.gender}
                              onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                              <option value="O">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Risk Level</label>
                          </div>
                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newPatient.pregnant}
                                onChange={e => setNewPatient(p => ({ ...p, pregnant: e.target.checked }))}
                                className="w-4 h-4 accent-emerald-600"
                              />
                              <span className="text-sm font-medium text-foreground">Pregnant</span>
                            </label>
                          </div>
                        </div>

                        {/* Row 3: Conditions, Allergies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Conditions (comma-separated)</label>
                            <input
                              value={newPatient.conditions}
                              onChange={e => setNewPatient(p => ({ ...p, conditions: e.target.value }))}
                              placeholder="e.g. Diabetes, Hypertension"
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Allergies (comma-separated)</label>
                            <input
                              value={newPatient.allergies}
                              onChange={e => setNewPatient(p => ({ ...p, allergies: e.target.value }))}
                              placeholder="e.g. Penicillin, Sulfa"
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                            />
                          </div>
                        </div>

                        {/* Row 4: Kidney & Liver Function */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                              Kidney Function: <span className="text-foreground font-bold">{newPatient.kidneyFunction}%</span>
                            </label>
                            <input
                              type="range" min="10" max="100" step="5"
                              value={newPatient.kidneyFunction}
                              onChange={e => setNewPatient(p => ({ ...p, kidneyFunction: e.target.value }))}
                              className="w-full accent-emerald-600"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                              <span>10%</span><span>Severe impairment &lt;30%</span><span>100%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                              Liver Function: <span className="text-foreground font-bold">{newPatient.liverFunction}%</span>
                            </label>
                            <input
                              type="range" min="10" max="100" step="5"
                              value={newPatient.liverFunction}
                              onChange={e => setNewPatient(p => ({ ...p, liverFunction: e.target.value }))}
                              className="w-full accent-emerald-600"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                              <span>10%</span><span>Moderate impairment &lt;60%</span><span>100%</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 5: Drug Selection */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-2">
                            Prescribed Drugs (select up to 5) &nbsp;
                            <span className="text-emerald-600 font-bold">{newPatient.drugs.length}/5 selected</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                            {drugs.map(drug => {
                              const selected = newPatient.drugs.includes(drug.id);
                              const disabled = !selected && newPatient.drugs.length >= 5;
                              return (
                                <motion.button
                                  key={drug.id}
                                  type="button"
                                  whileTap={{ scale: 0.96 }}
                                  disabled={disabled}
                                  onClick={() => toggleDrugSelection(drug.id)}
                                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all text-xs ${
                                    selected
                                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                                      : disabled
                                        ? 'border-border bg-muted/30 opacity-40 cursor-not-allowed'
                                        : 'border-border bg-card hover:bg-muted/40'
                                  }`}>
                                  <span className={`font-bold truncate w-full ${selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{drug.name}</span>
                                  <span className="text-muted-foreground truncate w-full">{drug.genericName}</span>
                                  <span className={`mt-1 px-1.5 py-0.5 rounded-full text-xs ${selected ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{drug.class}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {patientError && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium">
                            ⚠ {patientError}
                          </motion.p>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={addPatient}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                          data-testid="button-save-patient">
                          ✓ Register Patient — will appear in patient login list
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {['Patient', 'Age/Gender', 'Conditions', 'Drugs', 'Kidney', 'Liver', 'Risk', 'Actions'].map(h => (
                          <th key={h} className="text-left text-xs text-muted-foreground font-medium px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient, i) => (
                        <motion.tr key={patient.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          onClick={() => goAnalysis(patient.id)}
                          className="border-b border-border/50 hover:bg-primary/5 transition-colors cursor-pointer" data-testid={`row-patient-db-${patient.id}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 + 0.1, type: 'spring' }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-500 to-teal-600">
                                {patient.name.split(' ').map(n => n[0]).join('')}
                              </motion.div>
                              <span className="text-sm font-semibold text-foreground">{patient.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{patient.age}{patient.gender}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {patient.conditions.slice(0, 2).map(c => <span key={c} className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{c}</span>)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(patient.drugs.length / 5) * 100}%` }}
                                  transition={{ delay: 0.3, duration: 0.8 }} className="h-full bg-primary rounded-full" />
                              </div>
                              <span className="text-xs font-semibold text-foreground">{patient.drugs.length}/5</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${patient.kidneyFunction < 60 ? 'text-orange-600' : 'text-green-600'}`}>{patient.kidneyFunction}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${patient.liverFunction < 60 ? 'text-orange-600' : 'text-green-600'}`}>{patient.liverFunction}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${RISK_COLORS[computeRisk(patient, drugs)]}`}>{computeRisk(patient, drugs)}</span>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <DeletePatientButton patientId={patient.id} patientName={patient.name} />
                          </td>
                        </motion.tr>
                      ))}
                      {filteredPatients.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                            No patients found. Click <strong>Add Patient</strong> to register your first patient.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DoctorLayout>
  );
}
