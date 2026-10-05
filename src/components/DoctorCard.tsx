import { motion } from 'framer-motion';
import { Star, Briefcase, Building2, Languages, MessageSquare, CalendarPlus } from 'lucide-react';
import { DoctorProfile, doctorInitials } from '@/lib/doctors';

export function DoctorAvatar({ d, size = 48 }: { d: DoctorProfile; size?: number }) {
  return (
    <div className="rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.34, background: `linear-gradient(135deg, ${d.color}, ${d.color}aa)` }}>
      {doctorInitials(d.name)}
    </div>
  );
}

export default function DoctorCard({ d, onChat, onBook, unread = 0, highlight = false }: {
  d: DoctorProfile; onChat?: () => void; onBook?: () => void; unread?: number; highlight?: boolean;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
      className={`bg-card/80 backdrop-blur-sm border rounded-2xl p-4 flex flex-col gap-3 ${highlight ? 'border-primary/60 shadow-md' : 'border-border'}`}
      data-testid={`doctor-${d.id}`}>
      <div className="flex gap-3">
        <DoctorAvatar d={d} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{d.name}</p>
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5" style={{ background: `${d.color}22`, color: d.color }}>{d.speciality}</span>
          <p className="text-[11px] text-muted-foreground mt-1">{d.qualification}</p>
        </div>
        <span className="text-xs font-semibold flex items-start gap-1 text-amber-500 shrink-0"><Star size={12} className="mt-0.5 fill-amber-400" />{d.rating}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{d.about}</p>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="flex items-center gap-1.5"><Briefcase size={11} />{d.experience} yrs experience · ₹{d.fee} consultation</p>
        <p className="flex items-center gap-1.5"><Building2 size={11} />{d.hospital}</p>
        <p className="flex items-center gap-1.5"><Languages size={11} />{d.languages.join(', ')}</p>
      </div>
      {(onChat || onBook) && (
        <div className="flex gap-2 mt-auto pt-1">
          {onChat && (
            <button onClick={onChat} data-testid={`chat-${d.id}`}
              className="relative flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: '#7C3AED' }}>
              <MessageSquare size={13} />Chat
              {unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
          )}
          {onBook && (
            <button onClick={onBook} data-testid={`book-${d.id}`}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-primary/10" style={{ color: '#7C3AED' }}>
              <CalendarPlus size={13} />Book visit
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
