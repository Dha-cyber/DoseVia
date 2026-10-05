import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Stethoscope, Users, Inbox, Send, CalendarCheck, CalendarClock, ArrowRight, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AdminLayout from '@/layouts/AdminLayout';
import { STATUS_STYLE, ApptStatus, apptDateTime, formatDateLong, formatTime12, todayStr } from '@/lib/collab';
import { getAuditLog, ACTION_LABELS, AuditEvent } from '@/lib/audit';

const ACCENT = '#0F766E';

export default function AdminDashboard() {
  const { appointments, doctors, patients, forwardAppointment } = useApp();
  const [, setLocation] = useLocation();
  const [log, setLog] = useState<AuditEvent[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => { const r = () => setLog(getAuditLog().slice(-8).reverse()); r(); const t = setInterval(r, 4000); return () => clearInterval(t); }, []);

  const today = todayStr();
  const sortAsc = (a: { date: string; time: string }, b: { date: string; time: string }) => apptDateTime(a).getTime() - apptDateTime(b).getTime();
  const needsAction = useMemo(() => appointments.filter(a => a.status === 'requested' || a.status === 'declined').sort(sortAsc), [appointments]);
  const withDoctor = appointments.filter(a => a.status === 'assigned').length;
  const confirmedUpcoming = appointments.filter(a => a.status === 'confirmed').length;
  const todayCount = appointments.filter(a => a.date === today && (a.status === 'confirmed' || a.status === 'assigned')).length;

  const byStatus = (Object.keys(STATUS_STYLE) as ApptStatus[]).map(k => ({ k, n: appointments.filter(a => a.status === k).length }));
  const maxStatus = Math.max(1, ...byStatus.map(s => s.n));

  const workload = useMemo(() => doctors.map(d => ({
    d, open: appointments.filter(a => a.doctorId === d.id && (a.status === 'assigned' || a.status === 'confirmed')).length,
    waiting: appointments.filter(a => a.doctorId === d.id && a.status === 'assigned').length,
  })).sort((a, b) => b.open - a.open).slice(0, 6), [doctors, appointments]);
  const maxLoad = Math.max(1, ...workload.map(w => w.open));

  const quickForward = (id: string, doctorId: string) => {
    const r = forwardAppointment(id, doctorId);
    setMsg(r.success ? 'Forwarded - the doctor has been notified.' : (r.error ?? 'Could not forward'));
    setTimeout(() => setMsg(''), 3500);
  };

  const cards = [
    { label: 'Doctors', value: doctors.length, color: ACCENT, icon: Stethoscope, to: '/admin/doctors' },
    { label: 'Patients', value: patients.length, color: '#7C3AED', icon: Users, to: '/admin/patients' },
    { label: 'Need your action', value: needsAction.length, color: '#f59e0b', icon: Inbox, to: '/admin/appointments' },
    { label: 'Waiting for doctor', value: withDoctor, color: '#8b5cf6', icon: Send, to: '/admin/appointments' },
    { label: 'Confirmed', value: confirmedUpcoming, color: '#059669', icon: CalendarCheck, to: '/admin/appointments' },
    { label: 'Visits today', value: todayCount, color: '#0891b2', icon: CalendarClock, to: '/admin/appointments' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Run the clinic: manage doctors, route patient appointment requests to the right doctor, and keep track of everything.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c, i) => (
            <motion.button key={c.label} onClick={() => setLocation(c.to)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
              className="text-left bg-card/80 border border-border rounded-2xl p-4" data-testid={`stat-${c.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color}1f` }}><c.icon size={17} style={{ color: c.color }} /></div>
              <p className="text-2xl font-black text-foreground leading-none">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </motion.button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* action queue */}
          <div className="lg:col-span-3 bg-card/80 border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground">Needs your action</p>
              <button onClick={() => setLocation('/admin/appointments')} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT }}>Open queue <ArrowRight size={12} /></button>
            </div>
            {msg && <p className="text-xs rounded-lg px-3 py-2 mb-3 bg-teal-500/10 text-teal-700 dark:text-teal-300">{msg}</p>}
            {needsAction.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nothing waiting. New patient requests will show up here.</p>
            ) : (
              <div className="space-y-2">
                {needsAction.slice(0, 5).map(a => {
                  const st = STATUS_STYLE[a.status];
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{a.patientName} <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: st.bg, color: st.fg }}>{a.status === 'declined' ? 'Needs new doctor' : 'New request'}</span></p>
                        <p className="text-xs text-muted-foreground truncate">{formatDateLong(a.date)} · {formatTime12(a.time)} · {a.doctorName} ({a.speciality})</p>
                      </div>
                      {a.status === 'requested' && (
                        <button onClick={() => quickForward(a.id, a.doctorId)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shrink-0" style={{ background: ACCENT }} data-testid={`quick-forward-${a.id}`}>
                          <Check size={13} />Forward
                        </button>
                      )}
                      {a.status === 'declined' && (
                        <button onClick={() => setLocation('/admin/appointments')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 shrink-0">Reassign</button>
                      )}
                    </div>
                  );
                })}
                {needsAction.length > 5 && <p className="text-xs text-muted-foreground text-center pt-1">+ {needsAction.length - 5} more in the queue</p>}
              </div>
            )}
          </div>

          {/* status breakdown */}
          <div className="lg:col-span-2 bg-card/80 border border-border rounded-2xl p-5">
            <p className="font-semibold text-foreground mb-3">Appointments by status</p>
            {appointments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No appointments yet.</p> : (
              <div className="space-y-2.5">
                {byStatus.map(s => (
                  <div key={s.k}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-foreground">{STATUS_STYLE[s.k].label}</span><span className="text-muted-foreground font-semibold">{s.n}</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: STATUS_STYLE[s.k].fg }} initial={{ width: 0 }} animate={{ width: `${(s.n / maxStatus) * 100}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-card/80 border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground">Doctor workload</p>
              <button onClick={() => setLocation('/admin/doctors')} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT }}>Manage <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-2.5">
              {workload.map(w => (
                <div key={w.d.id}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-foreground truncate">{w.d.name} <span className="text-muted-foreground">· {w.d.speciality}</span></span><span className="text-muted-foreground shrink-0">{w.open} open{w.waiting ? ` (${w.waiting} to accept)` : ''}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(w.open / maxLoad) * 100}%`, background: w.d.color }} /></div>
                </div>
              ))}
              {workload.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No doctors yet. Add one in the Doctors page.</p>}
            </div>
          </div>

          <div className="bg-card/80 border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground">Recent activity</p>
              <button onClick={() => setLocation('/admin/activity')} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT }}>Full log <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-2">
              {log.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>}
              {log.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="text-foreground font-medium truncate">{ACTION_LABELS[e.action] ?? e.action}</span>
                  <span className="text-muted-foreground truncate">{e.user}{e.target ? ` · ${e.target}` : ''}</span>
                  <span className="ml-auto text-muted-foreground shrink-0">{new Date(e.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
