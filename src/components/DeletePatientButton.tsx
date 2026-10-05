import { motion } from 'framer-motion';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Doctor-only button: removes a patient record once the patient's problem is solved.
 * Asks for confirmation first. Also removes the patient's login account.
 */
export default function DeletePatientButton({
  patientId, patientName, variant = 'icon',
}: { patientId: string; patientName: string; variant?: 'icon' | 'full' }) {
  const { user, removePatient } = useApp();
  if (user?.role !== 'doctor') return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === 'icon' ? (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Problem solved – remove patient"
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            data-testid={`button-delete-patient-${patientId}`}>
            <Trash2 size={14} />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            data-testid={`button-resolve-patient-${patientId}`}>
            <CheckCircle2 size={15} /> Problem solved – remove patient
          </motion.button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {patientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Use this when the patient's problem is solved. Their record, medicines and login account will be
            permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removePatient(patientId)}>
            Yes, remove patient
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
