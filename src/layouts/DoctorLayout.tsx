import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  Database,
  FileText,
  ChevronLeft,
  Moon,
  Sun,
  LogOut,
  Wifi,
  MessageSquare,
  CalendarDays,
  Bell,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import DrugBackdrop from "@/components/graphics/DrugBackdrop";

const NAV_ITEMS = [
  { path: "/doctor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/doctor/analysis", icon: FlaskConical, label: "Analysis" },
  { path: "/doctor/visualisations", icon: BarChart3, label: "Visualisations" },
  { path: "/doctor/database", icon: Database, label: "Database" },
  { path: "/doctor/messages", icon: MessageSquare, label: "Messages" },
  { path: "/doctor/appointments", icon: CalendarDays, label: "Appointments" },
  { path: "/doctor/notifications", icon: Bell, label: "Notifications" },
  { path: "/doctor/report", icon: FileText, label: "AI Report" },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { isDark, toggleDark, logout, user } = useApp();
  const [, setLocation] = useLocation();
  const { messages, appointments, notifications } = useApp();
  const badges: Record<string, number> = {
    "/doctor/messages": messages.filter(
      (m) => m.from === "patient" && !m.readByDoctor,
    ).length,
    "/doctor/appointments": appointments.filter((a) => a.status === "assigned")
      .length,
    "/doctor/notifications": notifications.filter((n) => !n.read).length,
  };
  const activeIndex = NAV_ITEMS.findIndex((n) => location.startsWith(n.path));

  const doctorName = user?.name ?? "Doctor";
  const initials = doctorName
    .split(" ")
    .filter((w) => w.replace(/\./g, "").length > 0)
    .map((w) => w.replace(/\./g, "")[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(160deg, #0f172a 0%, #0d1e36 60%, #0a192e 100%)"
          : "linear-gradient(160deg, #f0f7ff 0%, #e8f2fe 40%, #dbeafe 70%, #e0f5fe 100%)",
      }}
    >
      <DrugBackdrop opacity={isDark ? 0.18 : 0.22} />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-20 flex flex-col overflow-hidden shrink-0 shadow-xl"
        style={{
          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          borderRight: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(24,95,165,0.12)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(24,95,165,0.1)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #185FA5, #0F6E56)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="white" strokeWidth="1.5" />
              <circle cx="8" cy="2" r="1.5" fill="white" />
              <circle cx="8" cy="14" r="1.5" fill="white" />
              <circle cx="2" cy="8" r="1.5" fill="white" />
              <circle cx="14" cy="8" r="1.5" fill="white" />
            </svg>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-xl tracking-tight"
                style={{ color: "#185FA5" }}
              >
                DoseVia
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 relative">
          {activeIndex >= 0 && (
            <motion.div
              className="absolute left-2 right-2 h-10 rounded-xl"
              style={{ background: "rgba(24,95,165,0.1)" }}
              animate={{ top: `${16 + activeIndex * 44}px` }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {NAV_ITEMS.map((item, i) => {
            const active = location.startsWith(item.path);
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={item.path}>
                  <div
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <motion.div
                      whileHover={{ rotate: -8, scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="shrink-0"
                    >
                      <item.icon
                        size={18}
                        style={active ? { color: "#185FA5" } : undefined}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {badges[item.path] > 0 && (
                      <span
                        className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                        data-testid={`badge-${item.label.toLowerCase()}`}
                      >
                        {badges[item.path]}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="activeBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                        style={{ background: "#185FA5" }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 35,
                        }}
                      />
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="px-2 pb-4 pt-4 space-y-1"
          style={{
            borderTop: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(24,95,165,0.1)",
          }}
        >
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <motion.div whileHover={{ rotate: 20 }} className="shrink-0">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm"
                >
                  {isDark ? "Light mode" : "Dark mode"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => {
              logout();
              setLocation("/");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Doctor avatar */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, #185FA5, #0F6E56)",
              }}
            >
              {initials || "DR"}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <p className="text-xs font-semibold text-foreground truncate">
                    {doctorName}
                  </p>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-green-500"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Online
                    </span>
                    <Wifi size={10} className="text-green-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-30"
          style={{
            background: isDark ? "#1e293b" : "white",
            border: isDark
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid #e2e8f0",
          }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronLeft size={12} />
          </motion.div>
        </button>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10">{children}</main>
    </div>
  );
}
