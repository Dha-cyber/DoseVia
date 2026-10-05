import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PatientLayout from '@/layouts/PatientLayout';
import DoctorCard from '@/components/DoctorCard';
import DoctorFinder, { useDoctorFilter } from '@/components/DoctorFinder';
import { BOOK_DOCTOR_KEY, CHAT_DOCTOR_KEY } from '@/lib/doctors';

export default function PatientDoctors() {
  const { messages } = useApp();
  const [, setLocation] = useLocation();
  const f = useDoctorFilter();

  const unreadFor = (id: string) => messages.filter(m => m.doctorId === id && m.from === 'doctor' && !m.readByPatient).length;
  const chat = (id: string) => { sessionStorage.setItem(CHAT_DOCTOR_KEY, id); setLocation('/patient/chat'); };
  const book = (id: string) => { sessionStorage.setItem(BOOK_DOCTOR_KEY, id); setLocation('/patient/appointments'); };

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 pb-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#D4537E)' }}><Users size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Our Doctors</h1>
            <p className="text-xs text-muted-foreground">{f.allDoctors.length} specialists. Choose the one who fits your problem, then chat or book a visit.</p>
          </div>
        </motion.div>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
          <DoctorFinder f={f} />
        </div>

        <p className="text-xs text-muted-foreground">Showing {f.doctors.length} of {f.allDoctors.length} doctors</p>
        {f.doctors.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
            No doctor matches that. Try a different word or <button className="underline" onClick={f.clear}>clear filters</button>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {f.doctors.map(d => (
              <DoctorCard key={d.id} d={d} unread={unreadFor(d.id)} onChat={() => chat(d.id)} onBook={() => book(d.id)} />
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
