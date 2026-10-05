import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DeletePatientButton from '@/components/DeletePatientButton';
import { Users, AlertTriangle, Clock, Pill, Search, ChevronUp, ChevronDown, Info, Shield, Activity, CalendarDays, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useLocation, Link } from 'wouter';
import DoctorLayout from '@/layouts/DoctorLayout';
import { computeRisk, getInteractions } from '@/lib/interactions';
import { todayStr } from '@/lib/collab';
import { getAuditLog, ACTION_LABELS } from '@/lib/audit';

const RISK_COLORS = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
} as const;

export default function Dashboard() {
  const { patients, drugs, setAnalysisPatientId, user, appointments, messages } = useApp();
  const pendingAppts = appointments.filter(a => a.status === 'assigned').length;
  const todayAppts = appointments.filter(a => a.status === 'confirmed' && a.date === todayStr()).length;
  const unreadMsgs = messages.filter(m => m.from === 'patient' && !m.readByDoctor).length;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [location, setLocation] = useLocation();
  const getVisibleAuditLog = () => getAuditLog()
    .filter(event => !String(event.action || '').toLowerCase().includes('viewed patient'))
    .filter(event => event.action !== 'VIEW_PATIENT')
    .slice()
    .reverse()
    .slice(0, 10);
  const [auditLog, setAuditLog] = useState(() => getVisibleAuditLog());

  useEffect(() => {
    setAuditLog(getVisibleAuditLog());
  }, [location]);

  const patientsWithRisk = patients.map(p => ({
    ...p,
    computedRisk: computeRisk(p, drugs),
  }));

  const filtered = patientsWithRisk
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.conditions.join(' ').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let v = 0;
      if (sortKey === 'name') v = a.name.localeCompare(b.name);
      else if (sortKey === 'risk') {
        const r = { Low: 0, Medium: 1, High: 2, Critical: 3 };
        v = r[a.computedRisk] - r[b.computedRisk];
      } else if (sortKey === 'drugs') v = a.drugs.length - b.drugs.length;
      return sortAsc ? v : -v;
    });

  const avgDrugs = patients.reduce((s, p) => s + p.drugs.length, 0) / Math.max(patients.length, 1);
  const totalDrugs = patients.reduce((s, p) => s + p.drugs.length, 0);

  const highRisk = patientsWithRisk.filter(
    p => p.computedRisk === 'High' || p.computedRisk === 'Critical'
  ).length;

  const pendingReviews = patients.filter(p => {
    const interactions = getInteractions(p.drugs);
    return interactions.some(i => i.severity === 'severe');
  }).length;

  const chartData = [2, 3, 4, 5].map(n => ({
    drugs: `${n} drug${n > 1 ? 's' : ''}`,
    count: patients.filter(p => p.drugs.length === n).length,
    label: `${n} drugs`,
  }));

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const goToAnalysis = (id: string, patientName: string) => {
    setAnalysisPatientId(id);
    setLocation('/doctor/analysis');
  };

  return (
    <DoctorLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clinical Command Centre</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of all patients and risk alerts</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: patients.length, icon: Users, color: '#185FA5', bg: '#185FA512', tooltip: 'Total patients in the system' },
            { label: 'High Risk Combos', value: highRisk, icon: AlertTriangle, color: '#ef4444', bg: '#ef444412', pulse: true, tooltip: 'Patients computed as High or Critical risk' },
            { label: 'Severe DDI Alerts', value: pendingReviews, icon: Clock, color: '#f59e0b', bg: '#f59e0b12', tooltip: 'Patients with at least one severe drug-drug interaction' },
            { label: 'Avg Drugs / Patient', value: avgDrugs, icon: Pill, color: '#0F6E56', bg: '#0F6E5612', decimals: 1, tooltip: `Total prescriptions (${totalDrugs}) ÷ patients (${patients.length})` },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 overflow-hidden cursor-pointer"
              title={card.tooltip}
            >
              <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full" style={{ background: card.color }} initial={{ height: '40%' }} whileHover={{ height: '60%' }} transition={{ type: 'spring', stiffness: 300 }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-2 flex items-center gap-1">{card.label}<Info size={10} className="opacity-40" /></p>
                  <AnimatedNumber value={card.value} decimals={(card as { decimals?: number }).decimals ?? 0} className="text-3xl font-black text-foreground" />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  {card.pulse ? (
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 3, repeat: Infinity }}><card.icon size={18} style={{ color: card.color }} /></motion.div>
                  ) : (
                    <card.icon size={18} style={{ color: card.color }} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Care desk: appointments + chat shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/doctor/appointments">
            <motion.div whileHover={{ y: -3 }} className="cursor-pointer flex items-center gap-4 bg-card/80 border border-border rounded-2xl p-4" data-testid="card-pending-appts">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/15"><CalendarDays size={20} className="text-amber-500" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-foreground">{pendingAppts} pending appointment {pendingAppts === 1 ? 'request' : 'requests'}</p><p className="text-xs text-muted-foreground">{todayAppts} confirmed for today</p></div>
              <span className="text-xs font-semibold text-primary">Open →</span>
            </motion.div>
          </Link>
          <Link href="/doctor/messages">
            <motion.div whileHover={{ y: -3 }} className="cursor-pointer flex items-center gap-4 bg-card/80 border border-border rounded-2xl p-4" data-testid="card-unread-msgs">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-sky-500/15"><MessageSquare size={20} className="text-sky-500" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-foreground">{unreadMsgs} unread {unreadMsgs === 1 ? 'message' : 'messages'}</p><p className="text-xs text-muted-foreground">Replies from your patients</p></div>
              <span className="text-xs font-semibold text-primary">Open →</span>
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient watchlist */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Patient Watchlist</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 w-48" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[['name', 'Patient'], ['risk', 'Risk'], ['drugs', 'Drugs'], ['', 'Conditions'], ['', 'Actions']].map(([key, label]) => (
                      <th key={label} className={`text-left text-xs text-muted-foreground font-medium px-4 py-3 ${key ? 'cursor-pointer hover:text-foreground' : ''}`} onClick={() => key && handleSort(key)}>
                        <div className="flex items-center gap-1">
                          {label}
                          {key && sortKey === key && (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient, i) => (
                    <motion.tr key={patient.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #185FA5, #0F6E56)' }}>
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.age}{patient.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${RISK_COLORS[patient.computedRisk]}20`, color: RISK_COLORS[patient.computedRisk] }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLORS[patient.computedRisk] }} />
                          {patient.computedRisk}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{patient.drugs.length}/5</span>
                          {patient.drugs.length >= 4 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">Poly</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {patient.conditions.map(c => <span key={c} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{c}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goToAnalysis(patient.id, patient.name)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1" style={{ color: '#185FA5', background: 'rgba(24,95,165,0.1)' }}>
                          Analyse <motion.span whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}>→</motion.span>
                        </motion.button>
                        <DeletePatientButton patientId={patient.id} patientName={patient.name} />
                      </div></td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No patients yet. Patients appear here once they register, or add one from the Database page.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Attention Required */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Attention Required</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Patients with elevated risk combinations</p>
            </div>
            <div className="p-4 space-y-3">
              {patientsWithRisk.filter(p => p.computedRisk === 'High' || p.computedRisk === 'Critical').map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="flex items-start gap-2">
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-orange-700 mt-0.5">{p.drugs.length} drugs · {p.computedRisk} risk · {p.conditions.join(', ')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {patientsWithRisk.filter(p => p.computedRisk === 'Medium').slice(0, 2).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Scheduled monthly check-up</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Drug distribution chart */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-1">Drug Count Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">How many of your {patients.length} patients are on 2, 3, 4, or 5 drugs simultaneously.</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={42}>
              <XAxis dataKey="drugs" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }} formatter={(value: number, _name: string, props: { payload?: { label?: string } }) => [value, props.payload?.label ?? '']} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} animationBegin={400} animationDuration={1200}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.count > 0 ? '#185FA5' : '#185FA530'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* CY FEATURE: Security Status */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
            <Shield size={16} className="text-green-600" />
            Security Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { ok: true,  text: 'Role-based access control (RBAC) active' },
              { ok: true,  text: 'Session expiry enforced (8 hours)' },
              { ok: true,  text: 'Email + password authentication (salted SHA-256)' },
              { ok: true,  text: 'Patient data integrity monitoring (SHA-256)' },
              { ok: true,  text: 'Security audit log recording all actions' },
              { ok: true,  text: 'Risk computed dynamically — not client-stored' },
              { ok: false, text: 'API key in client bundle (demo limitation)' },
              { ok: false, text: 'No HTTPS enforcement (dev environment)' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${item.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                <span className="text-base">{item.ok ? '✅' : '⚠️'}</span>
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CY FEATURE: Audit Log */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-600" />
            Security Audit Log
            <span className="text-xs font-normal text-muted-foreground ml-auto">Last 10 events</span>
          </h2>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No events recorded yet. Actions will appear here as you use the app.</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map(event => (
                <div key={event.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 text-sm">
                  <span className="font-mono text-xs text-muted-foreground shrink-0 w-20">
                    {new Date(event.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="flex-1 text-foreground">
                    {ACTION_LABELS[event.action] ?? event.action}
                    {event.target && <span className="text-muted-foreground"> → {event.target}</span>}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${event.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {event.user}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </DoctorLayout>
  );
}
