import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { getAuditLog, ACTION_LABELS, AuditEvent } from '@/lib/audit';

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-teal-100 text-teal-700', doctor: 'bg-blue-100 text-blue-700', patient: 'bg-purple-100 text-purple-700',
};

export default function AdminActivity() {
  const [log, setLog] = useState<AuditEvent[]>([]);
  const [role, setRole] = useState<'all' | 'admin' | 'doctor' | 'patient'>('all');
  useEffect(() => { const r = () => setLog(getAuditLog().slice().reverse()); r(); const t = setInterval(r, 3000); return () => clearInterval(t); }, []);
  const shown = log.filter(e => role === 'all' || e.role === role);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">Who did what: logins, bookings, forwards, acceptances, doctor changes. Last 100 events.</p>
        </motion.div>
        <div className="flex gap-2">
          {(['all', 'admin', 'doctor', 'patient'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${role === r ? 'text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`} style={role === r ? { background: '#0F766E' } : undefined}>{r}</button>
          ))}
        </div>
        <div className="bg-card/80 border border-border rounded-2xl divide-y divide-border">
          {shown.length === 0 && <div className="text-center py-12 text-muted-foreground"><ScrollText className="mx-auto mb-2 opacity-50" size={28} /><p className="text-sm">No activity yet.</p></div>}
          {shown.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${ROLE_STYLE[e.role] ?? ''}`}>{e.role}</span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-medium truncate">{ACTION_LABELS[e.action] ?? e.action}</p>
                <p className="text-xs text-muted-foreground truncate">{e.user}{e.target ? ` · ${e.target}` : ''}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(e.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
