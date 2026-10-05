import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CalendarPlus, Video, Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PatientLayout from '@/layouts/PatientLayout';
import { ApptMode, SLOTS, STATUS_STYLE, apptDateTime, formatDateLong, formatTime12, isOpenAppt, isSlotPast, todayStr, timeAgo } from '@/lib/collab';
import { BOOK_DOCTOR_KEY, specialitiesOf } from '@/lib/doctors';
import { DoctorAvatar } from '@/components/DoctorCard';

const ACCENT = '#7C3AED';

export default function PatientAppointments() {
  const { user, appointments, bookAppointment, updateAppointment, isDoctorSlotTaken, doctors, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [specFilter, setSpecFilter] = useState('');
  const [doctorId, setDoctorId] = useState<string>(() => sessionStorage.getItem(BOOK_DOCTOR_KEY) ?? '');
  useEffect(() => { sessionStorage.removeItem(BOOK_DOCTOR_KEY); }, []);
  const doctor = doctors.find(d => d.id === doctorId);
  const doctorOptions = doctors.filter(d => !specFilter || d.speciality === specFilter);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<ApptMode>('in-person');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mine = useMemo(() => appointments.filter(a => a.patientId === user?.patientId)
    .sort((a, b) => apptDateTime(b).getTime() - apptDateTime(a).getTime()), [appointments, user]);
  const active = mine.filter(isOpenAppt).sort((a, b) => apptDateTime(a).getTime() - apptDateTime(b).getTime());
  const past = mine.filter(a => !isOpenAppt(a));
  const unread = notifications.filter(n => !n.read);

  const submit = () => {
    setError(''); setDone(false);
    const res = bookAppointment({ doctorId, date, time, mode, reason });
    if (!res.success) { setError(res.error ?? 'Could not book'); return; }
    setDone(true); setTime(''); setReason('');
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground">Appointments</h1>
          <p className="text-xs text-muted-foreground mt-1">Book a visit. The clinic admin forwards your request to the doctor, the doctor accepts it, and you see every step here.</p>
        </motion.div>

        {/* updates from the clinic */}
        {notifications.length > 0 && (
          <div className="bg-card/80 border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground flex items-center gap-2 text-sm"><Bell size={15} style={{ color: ACCENT }} />Updates{unread.length > 0 && <span className="text-[11px] font-bold px-1.5 rounded-full bg-red-500 text-white">{unread.length}</span>}</p>
              {unread.length > 0 && <button onClick={markAllNotificationsRead} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>}
            </div>
            {notifications.slice(0, 4).map(n => (
              <button key={n.id} onClick={() => markNotificationRead(n.id)} className={`w-full text-left rounded-xl px-3 py-2 text-xs transition-colors ${n.read ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/10 text-foreground'}`}>
                <span className="font-semibold">{n.title}</span> · <span className="opacity-70">{timeAgo(n.ts)}</span>
                <span className="block mt-0.5">{n.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* booking card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
          <p className="font-semibold text-foreground flex items-center gap-2"><CalendarPlus size={17} style={{ color: ACCENT }} />Book a new appointment</p>

          {/* step 1: choose doctor by speciality */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">1. Choose a doctor</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={specFilter} onChange={e => { setSpecFilter(e.target.value); if (doctor && e.target.value && doctor.speciality !== e.target.value) { setDoctorId(''); setTime(''); } }}
                className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" data-testid="appt-speciality">
                <option value="">All specialities</option>
                {specialitiesOf(doctors).map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
              <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setTime(''); }}
                className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" data-testid="appt-doctor">
                <option value="">Select doctor…</option>
                {doctorOptions.map(d => <option key={d.id} value={d.id}>{d.name} — {d.speciality}</option>)}
              </select>
            </div>
            {doctor && (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <DoctorAvatar d={doctor} size={40} />
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-foreground text-sm">{doctor.name} <span className="font-normal text-muted-foreground">· {doctor.speciality}</span></p>
                  <p className="text-muted-foreground">{doctor.qualification} · {doctor.experience} yrs · ₹{doctor.fee} · {doctor.hospital}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground -mb-2">2. Pick date, type and time</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">Date
              <input type="date" min={todayStr()} value={date} onChange={e => { setDate(e.target.value); setTime(''); }}
                className="mt-1 w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" data-testid="appt-date" />
            </label>
            <div className="text-xs text-muted-foreground">Visit type
              <div className="mt-1 flex bg-muted rounded-xl p-1">
                {([['in-person', 'In person', Building2], ['video', 'Video call', Video]] as [ApptMode, string, typeof Video][]).map(([m, label, Icon]) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${mode === m ? 'text-white' : 'text-muted-foreground'}`}
                    style={mode === m ? { background: ACCENT } : undefined}><Icon size={14} />{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{doctor ? `Available time slots with ${doctor.name}` : 'Choose a doctor to see available slots'}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SLOTS.map(s => {
                const disabled = !doctorId || !date || isSlotPast(date, s) || isDoctorSlotTaken(doctorId, date, s);
                const sel = time === s;
                return (
                  <button key={s} type="button" disabled={disabled} onClick={() => setTime(s)} data-testid={`slot-${s}`}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${disabled ? 'opacity-35 line-through cursor-not-allowed border-border' : sel ? 'text-white border-transparent shadow-md scale-105' : 'border-border hover:border-primary/60 text-foreground'}`}
                    style={sel ? { background: ACCENT } : undefined}>{formatTime12(s)}</button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Clinic hours 9:00 AM – 5:00 PM, lunch break 1:00 – 2:00 PM. Struck-out slots are taken (for this doctor) or already past.</p>
          </div>

          <label className="text-xs text-muted-foreground block">Reason for visit
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} maxLength={500} placeholder="e.g. Dizziness after starting the new BP tablet"
              className="mt-1 w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none" data-testid="appt-reason" />
          </label>

          {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2"><AlertCircle size={14} />{error}</p>}
          {done && <p className="text-xs text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2 flex items-center gap-2"><CheckCircle2 size={14} />Request sent to the clinic admin. You'll be notified when it reaches the doctor and when the doctor accepts.</p>}

          <motion.button whileTap={{ scale: 0.97 }} onClick={submit} className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: ACCENT }} data-testid="appt-submit">
            Request appointment
          </motion.button>
        </div>

        {/* my appointments */}
        <div className="space-y-3">
          <p className="font-semibold text-foreground">Upcoming &amp; pending</p>
          {active.length === 0 && <p className="text-sm text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl p-5 text-center">You have no upcoming appointments.</p>}
          <AnimatePresence initial={false}>
            {active.map(a => <ApptCard key={a.id} a={a} onCancel={() => updateAppointment(a.id, 'cancelled')} />)}
          </AnimatePresence>
        </div>

        {past.length > 0 && (
          <div className="space-y-3">
            <p className="font-semibold text-foreground">History</p>
            {past.map(a => <ApptCard key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

function ApptCard({ a, onCancel }: { a: ReturnType<typeof useApp>['appointments'][number]; onCancel?: () => void }) {
  const st = STATUS_STYLE[a.status];
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
      className="bg-card/80 border border-border rounded-2xl p-4 flex gap-4 items-start" data-testid={`my-appt-${a.id}`}>
      <div className="w-14 text-center rounded-xl py-2 shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }}>
        <p className="text-[11px] uppercase font-semibold" style={{ color: ACCENT }}>{new Date(`${a.date}T00:00`).toLocaleDateString('en-GB', { month: 'short' })}</p>
        <p className="text-xl font-black text-foreground leading-none">{new Date(`${a.date}T00:00`).getDate()}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />{formatDateLong(a.date)} · {formatTime12(a.time)}</span>
        </div>
        <p className="text-sm font-semibold text-foreground mt-1.5">{a.doctorName} <span className="font-normal text-xs text-muted-foreground">· {a.speciality}</span></p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">{a.mode === 'video' ? <Video size={12} /> : <Building2 size={12} />}{a.mode === 'video' ? 'Video call' : 'In person'}</p>
        <p className="text-sm text-foreground mt-1.5 break-words">{a.reason}</p>
        {a.doctorNote && <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">Doctor's note: {a.doctorNote}</p>}
        {a.adminNote && <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">Clinic note: {a.adminNote}</p>}
      </div>
      {onCancel && <button onClick={onCancel} className="text-xs text-red-500 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg shrink-0" data-testid={`cancel-${a.id}`}>Cancel</button>}
    </motion.div>
  );
}
