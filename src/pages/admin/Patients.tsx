import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, Pill, CalendarDays } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AdminLayout from '@/layouts/AdminLayout';
import { Patient } from '@/lib/drugData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminPatients() {
  const { patients, appointments, removePatient } = useApp();
  const [q, setQ] = useState('');
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const list = patients.filter(p => !q.trim() || `${p.name} ${p.conditions.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()));
  const apptCount = (id: string) => appointments.filter(a => a.patientId === id).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground text-sm mt-1">{patients.length} registered patients. Medical details are managed by doctors; here you can see who is registered and remove an account.</p>
        </motion.div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or condition…" className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none text-foreground" />
        </div>
        {list.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">No patients found.</div>}
        <div className="space-y-2">
          {list.map(p => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/80 border border-border rounded-2xl p-4 flex items-center gap-4" data-testid={`admin-patient-${p.id}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#0F766E,#0891b2)' }}>
                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{p.name} <span className="text-xs font-normal text-muted-foreground">· {p.age} yrs · {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : p.gender}</span></p>
                <p className="text-xs text-muted-foreground truncate">{p.conditions.length ? p.conditions.join(', ') : 'No conditions recorded'}</p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><Pill size={12} />{p.drugs.length}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><CalendarDays size={12} />{apptCount(p.id)}</span>
              <button onClick={() => setToDelete(p)} className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 shrink-0" aria-label={`Remove ${p.name}`}><Trash2 size={15} /></button>
            </motion.div>
          ))}
        </div>
      </div>
      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Their login, chats and appointments will be deleted. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (toDelete) removePatient(toDelete.id); setToDelete(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
