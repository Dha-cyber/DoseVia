import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';
import NotificationList from '@/components/NotificationList';

export default function AdminNotifications() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">New patient requests, doctor replies and cancellations. Tap one to open it.</p>
        </motion.div>
        <NotificationList accent="#0F766E" />
      </div>
    </AdminLayout>
  );
}
