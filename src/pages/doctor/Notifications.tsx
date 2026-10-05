import { motion } from 'framer-motion';
import DoctorLayout from '@/layouts/DoctorLayout';
import NotificationList from '@/components/NotificationList';

export default function DoctorNotifications() {
  return (
    <DoctorLayout>
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Appointments the admin sends you, and updates when patients cancel. Tap one to open it.</p>
        </motion.div>
        <NotificationList accent="#185FA5" />
      </div>
    </DoctorLayout>
  );
}
