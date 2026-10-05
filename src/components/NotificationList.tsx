import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { timeAgo } from '@/lib/collab';

/** Inbox used by the Admin and Doctor "Notifications" pages. */
export default function NotificationList({ accent = '#185FA5' }: { accent?: string }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [, setLocation] = useLocation();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread > 0 ? `${unread} unread` : 'You are all caught up'}</p>
        {unread > 0 && (
          <button onClick={markAllNotificationsRead} className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground" data-testid="mark-all-read">
            <CheckCheck size={13} />Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 && (
        <div className="text-center py-14 text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
          <BellOff className="mx-auto mb-2 opacity-50" size={30} />
          <p className="text-sm">No notifications yet.</p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {notifications.map(n => (
          <motion.button key={n.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => { markNotificationRead(n.id); if (n.link) setLocation(n.link); }}
            className={`w-full text-left flex gap-3 items-start rounded-2xl border p-4 transition-colors ${n.read ? 'bg-card/60 border-border' : 'bg-card border-primary/40 shadow-sm'}`}
            data-testid={`notif-${n.id}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}1f` }}>
              <Bell size={16} style={{ color: accent }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">{n.title}{!n.read && <span className="w-2 h-2 rounded-full bg-red-500" />}</p>
              <p className="text-xs text-muted-foreground mt-0.5 break-words">{n.text}</p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(n.ts)}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
