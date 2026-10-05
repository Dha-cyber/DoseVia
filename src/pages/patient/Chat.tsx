import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowLeft, CalendarPlus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import PatientLayout from '@/layouts/PatientLayout';
import ChatThread from '@/components/ChatThread';
import DoctorCard, { DoctorAvatar } from '@/components/DoctorCard';
import DoctorFinder, { useDoctorFilter } from '@/components/DoctorFinder';
import { BOOK_DOCTOR_KEY, CHAT_DOCTOR_KEY, getDoctor } from '@/lib/doctors';

const ACCENT = '#7C3AED';

export default function PatientChat() {
  const { user, messages } = useApp();
  const [, setLocation] = useLocation();
  const pid = user?.patientId;
  const [doctorId, setDoctorId] = useState<string | null>(() => sessionStorage.getItem(CHAT_DOCTOR_KEY));
  const f = useDoctorFilter();
  useEffect(() => { sessionStorage.removeItem(CHAT_DOCTOR_KEY); }, []);

  const doctor = getDoctor(doctorId);

  // doctors this patient already talks to
  const conversations = useMemo(() => {
    const ids = Array.from(new Set(messages.map(m => m.doctorId)));
    return ids.map(id => {
      const t = messages.filter(m => m.doctorId === id).sort((a, b) => a.ts - b.ts);
      return { d: getDoctor(id), last: t[t.length - 1], unread: t.filter(m => m.from === 'doctor' && !m.readByPatient).length };
    }).filter(c => c.d).sort((a, b) => b.last.ts - a.last.ts);
  }, [messages]);

  // ----- conversation with one chosen doctor -----
  if (doctor && pid) {
    return (
      <PatientLayout>
        <div className="p-4 md:p-6 max-w-3xl mx-auto h-[calc(100vh-80px)] md:h-screen flex flex-col">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-center gap-3">
            <button onClick={() => setDoctorId(null)} className="p-2 rounded-xl hover:bg-muted" aria-label="Choose another doctor" data-testid="chat-back"><ArrowLeft size={18} /></button>
            <DoctorAvatar d={doctor} size={44} />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-foreground truncate">{doctor.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{doctor.speciality} · only {doctor.name.split(' ')[1]} can read this chat</p>
            </div>
            <button onClick={() => { sessionStorage.setItem(BOOK_DOCTOR_KEY, doctor.id); setLocation('/patient/appointments'); }}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold shrink-0" style={{ color: ACCENT, background: 'rgba(124,58,237,0.1)' }}>
              <CalendarPlus size={13} />Book visit
            </button>
          </motion.div>
          <div className="flex-1 min-h-0 bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
            <ChatThread key={doctor.id} patientId={pid} doctorId={doctor.id} me="patient" accent={ACCENT}
              quickReplies={['I missed a dose', 'I have a side effect', 'Can I refill my medicines?']}
              emptyHint={`Ask ${doctor.name} (${doctor.speciality}) about your medicines or health. Only this doctor will receive your messages.`} />
          </div>
        </div>
      </PatientLayout>
    );
  }

  // ----- choose a doctor according to the problem -----
  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 pb-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#D4537E)' }}><Stethoscope size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Chat with a Doctor</h1>
            <p className="text-xs text-muted-foreground">Choose the doctor for your problem. Your messages go only to that doctor. Not for emergencies — use the Emergency tab.</p>
          </div>
        </motion.div>

        {conversations.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Your conversations</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {conversations.map(({ d, last, unread }) => d && (
                <button key={d.id} onClick={() => setDoctorId(d.id)} data-testid={`convo-${d.id}`}
                  className="text-left bg-card/80 border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                  <DoctorAvatar d={d} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{d.name} <span className="font-normal text-muted-foreground">· {d.speciality}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{last.from === 'patient' ? 'You: ' : ''}{last.text}</p>
                  </div>
                  {unread > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{unread}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
          <p className="font-semibold text-foreground text-sm mb-3">What do you need help with?</p>
          <DoctorFinder f={f} />
        </div>

        {f.doctors.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
            No doctor matches that. Try another word or <button className="underline" onClick={f.clear}>clear filters</button>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {f.doctors.map((d, i) => (
              <DoctorCard key={d.id} d={d} highlight={f.recommended.length > 0 && i === 0}
                unread={messages.filter(m => m.doctorId === d.id && m.from === 'doctor' && !m.readByPatient).length}
                onChat={() => setDoctorId(d.id)} />
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
