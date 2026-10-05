import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Video, Building2, Send, X, CalendarX2, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AdminLayout from '@/layouts/AdminLayout';
import { Appointment, STATUS_STYLE, apptDateTime, formatDateLong, formatTime12, isSlotTaken } from '@/lib/collab';

const ACCENT = '#0F766E';
type Tab = 'queue' | 'doctor' | 'confirmed' | 'all';

export default function AdminAppointments() {
  const { appointments, doctors, forwardAppointment, rejectAppointment } = useApp();
  const [tab, setTab] = useState<Tab>('queue');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<{ id: string; mode: 'forward' | 'reject' } | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const asc = (a: Appointment, b: Appointment) => apptDateTime(a).getTime() - apptDateTime(b).getTime();
  const lists = useMemo(() => ({
    queue: appointments.filter(a => a.status === 'requested' || a.status === 'declined').sort(asc),
    doctor: appointments.filter(a => a.status === 'assigned').sort(asc),
    confirmed: appointments.filter(a => a.status === 'confirmed').sort(asc),
    all: [...appointments].sort((a, b) => b.createdAt - a.createdAt),
  }), [appointments]);
  const needle = q.trim().toLowerCase();
  const list = lists[tab].filter(a => !needle || a.patientName.toLowerCase().includes(needle) || a.doctorName.toLowerCase().includes(needle) || a.reason.toLowerCase().includes(needle));

  const start = (a: Appointment, mode: 'forward' | 'reject') => {
    setOpen({ id: a.id, mode }); setDoctorId(a.status === 'declined' ? '' : a.doctorId); setNote(''); setError('');
  };
  const submit = (a: Appointment) => {
    if (!open) return;
    if (open.mode === 'reject') { rejectAppointment(a.id, note); setFlash('Request rejected - the patient has been notified.'); }
    else {
      const r = forwardAppointment(a.id, doctorId, note);
      if (!r.success) { setError(r.error ?? 'Could not forward'); return; }
      setFlash('Forwarded - the doctor has been notified and must accept.');
    }
    setOpen(null); setTimeout(() => setFlash(''), 4000);
  };

  const tabs: [Tab, string][] = [['queue', `New requests (${lists.queue.length})`], ['doctor', `With doctor (${lists.doctor.length})`], ['confirmed', `Confirmed (${lists.confirmed.length})`], ['all', 'All']];
  const empty: Record<Tab, string> = { queue: 'No new requests. Patient bookings appear here for you to forward.', doctor: 'Nothing is waiting on a doctor.', confirmed: 'No confirmed appointments.', all: 'No appointments yet.' };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Patients request a visit → you forward it to the right doctor → the doctor accepts → the patient is notified.</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 items-center">
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`admin-tab-${t}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`} style={tab === t ? { background: ACCENT } : undefined}>{label}</button>
          ))}
          <div className="relative ml-auto min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search patient, doctor, reason…" className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-xl focus:outline-none text-foreground" />
          </div>
        </div>

        {flash && <p className="text-xs rounded-lg px-3 py-2 bg-teal-500/10 text-teal-700 dark:text-teal-300">{flash}</p>}

        <div className="space-y-3">
          {list.length === 0 && (
            <div className="text-center py-14 text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
              <CalendarX2 className="mx-auto mb-2 opacity-50" size={30} /><p className="text-sm">{empty[tab]}</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {list.map(a => {
              const st = STATUS_STYLE[a.status];
              const canRoute = a.status === 'requested' || a.status === 'declined' || a.status === 'assigned';
              const isOpen = open?.id === a.id;
              return (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="bg-card/80 border border-border rounded-2xl p-4" data-testid={`admin-appt-${a.id}`}>
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="w-16 text-center rounded-xl py-2 shrink-0" style={{ background: `${ACCENT}1a` }}>
                      <p className="text-[11px] uppercase font-semibold" style={{ color: ACCENT }}>{new Date(`${a.date}T00:00`).toLocaleDateString('en-GB', { month: 'short' })}</p>
                      <p className="text-2xl font-black text-foreground leading-none">{new Date(`${a.date}T00:00`).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-48">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{a.patientName}</p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={12} />{formatDateLong(a.date)} · {formatTime12(a.time)}</span>
                        <span className="flex items-center gap-1">{a.mode === 'video' ? <Video size={12} /> : <Building2 size={12} />}{a.mode === 'video' ? 'Video call' : 'In person'}</span>
                      </p>
                      <p className="text-xs text-foreground mt-1.5">{a.status === 'requested' ? 'Patient asked for' : 'Doctor'}: <span className="font-semibold">{a.doctorName}</span> <span className="text-muted-foreground">({a.speciality})</span></p>
                      <p className="text-sm text-foreground mt-1.5 break-words">“{a.reason}”</p>
                      {a.doctorNote && <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">Doctor's note: {a.doctorNote}</p>}
                      {a.adminNote && <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">Your note: {a.adminNote}</p>}
                    </div>
                    {canRoute && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => start(a, 'forward')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: ACCENT }} data-testid={`forward-${a.id}`}>
                          {a.status === 'requested' ? <><Send size={13} />Forward to doctor</> : <><RefreshCw size={13} />{a.status === 'declined' ? 'Reassign' : 'Change doctor'}</>}
                        </button>
                        <button onClick={() => start(a, 'reject')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1.5" data-testid={`reject-${a.id}`}><X size={13} />Reject</button>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden">
                      {open.mode === 'forward' && (
                        <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setError(''); }} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" data-testid="forward-doctor">
                          <option value="">Select the doctor to notify…</option>
                          {doctors.map(d => {
                            const busy = isSlotTaken(appointments.filter(x => x.id !== a.id), a.date, a.time, d.id);
                            return <option key={d.id} value={d.id} disabled={busy}>{d.name} — {d.speciality}{d.id === a.doctorId && a.status === 'requested' ? ' (patient’s choice)' : ''}{busy ? ' · busy at this time' : ''}</option>;
                          })}
                        </select>
                      )}
                      <div className="flex gap-2 items-center flex-wrap">
                        <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit(a)}
                          placeholder={open.mode === 'forward' ? 'Optional note for the doctor' : 'Reason for rejecting (shown to the patient)'}
                          className="flex-1 min-w-48 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        <button onClick={() => submit(a)} disabled={open.mode === 'forward' && !doctorId} className={`px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 ${open.mode === 'reject' ? 'bg-red-600' : ''}`}
                          style={open.mode === 'forward' ? { background: ACCENT } : undefined} data-testid="admin-appt-submit">
                          {open.mode === 'forward' ? 'Send notification to doctor' : 'Reject request'}
                        </button>
                        <button onClick={() => setOpen(null)} className="px-3 py-2 text-xs text-muted-foreground">Back</button>
                      </div>
                      {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2"><AlertCircle size={14} />{error}</p>}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
