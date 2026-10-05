import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Pill,
  Leaf,
  MessageCircle,
  AlertTriangle,
  Moon,
  Sun,
  LogOut,
  MessagesSquare,
  CalendarDays,
  Users,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import DrugBackdrop from "@/components/graphics/DrugBackdrop";

const TABS = [
  { path: "/patient/home", icon: Home, label: "Home" },
  { path: "/patient/meds", icon: Pill, label: "My Meds" },
  { path: "/patient/lifestyle", icon: Leaf, label: "Lifestyle" },
  { path: "/patient/ask", icon: MessageCircle, label: "Ask AI" },
  { path: "/patient/doctors", icon: Users, label: "Doctors" },
  { path: "/patient/chat", icon: MessagesSquare, label: "Chat" },
  { path: "/patient/appointments", icon: CalendarDays, label: "Visits" },
  { path: "/patient/emergency", icon: AlertTriangle, label: "Emergency" },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const { isDark, toggleDark, logout, user, selectedPatient } = useApp();
  const [, setLocation] = useLocation();
  const { messages: allMsgs } = useApp();
  const unreadChat = allMsgs.filter(
    (m) =>
      m.patientId === user?.patientId &&
      m.from === "doctor" &&
      !m.readByPatient,
  ).length;
  const activeIndex = TABS.findIndex((t) => location.startsWith(t.path));

  const patientName = selectedPatient?.name ?? user?.name ?? "Patient";
  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bgStyle = isDark
    ? {
        background:
          "linear-gradient(160deg, #1a0a2e 0%, #1e0d35 50%, #1a0a2a 100%)",
      }
    : {
        background:
          "linear-gradient(160deg, #faf5ff 0%, #f0ebff 40%, #ede9fe 70%, #fce7f3 100%)",
      };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={bgStyle}>
      <DrugBackdrop opacity={isDark ? 0.18 : 0.22} />

      {/* Desktop layout */}
      <div className="hidden md:flex h-screen">
        <aside
          className="w-56 flex flex-col shrink-0 z-20 relative shadow-xl"
          style={{
            background: isDark
              ? "rgba(26,10,46,0.95)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            borderRight: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(124,58,237,0.12)",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{
              borderBottom: isDark
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(124,58,237,0.1)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #D4537E)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke="white" strokeWidth="1.5" />
                <circle cx="8" cy="2" r="1.5" fill="white" />
                <circle cx="8" cy="14" r="1.5" fill="white" />
                <circle cx="2" cy="8" r="1.5" fill="white" />
                <circle cx="14" cy="8" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="font-black text-xl" style={{ color: "#7C3AED" }}>
              DoseVia
            </span>
          </div>

          <nav className="flex-1 py-4 px-2 relative">
            {activeIndex >= 0 && (
              <motion.div
                className="absolute left-2 right-2 h-10 rounded-xl"
                style={{ background: "rgba(124,58,237,0.1)" }}
                animate={{ top: `${16 + activeIndex * 44}px` }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            {TABS.map((tab, i) => {
              const active = location.startsWith(tab.path);
              return (
                <motion.div
                  key={tab.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={tab.path}>
                    <div
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition-colors ${active ? "" : "text-muted-foreground hover:text-foreground"}`}
                      style={active ? { color: "#7C3AED" } : undefined}
                      data-testid={`nav-patient-${tab.label.toLowerCase().replace(" ", "-")}`}
                    >
                      <tab.icon size={18} className="shrink-0" />
                      <span className="text-sm font-medium">{tab.label}</span>
                      {tab.path === "/patient/chat" && unreadChat > 0 && (
                        <span
                          className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                          data-testid="badge-chat"
                        >
                          {unreadChat}
                        </span>
                      )}
                      {active && (
                        <motion.div
                          layoutId="activePatientBar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                          style={{ background: "#7C3AED" }}
                        />
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div
            className="px-2 pb-4 pt-4 space-y-1"
            style={{
              borderTop: isDark
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(124,58,237,0.1)",
            }}
          >
            <button
              onClick={toggleDark}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm">{isDark ? "Light" : "Dark"} mode</span>
            </button>
            <button
              onClick={() => {
                logout();
                setLocation("/");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign out</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #D4537E)",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {patientName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPatient?.conditions?.[0] ?? "Patient"}
                </p>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto relative z-10">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        <main className="flex-1 overflow-auto relative z-10">{children}</main>
        <motion.nav
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.3,
          }}
          className="relative z-20 flex items-center px-2 pt-2 shrink-0"
          style={{
            background: isDark
              ? "rgba(26,10,46,0.95)"
              : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(124,58,237,0.12)",
            paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          }}
        >
          <motion.div
            className="absolute bottom-2 h-12 rounded-2xl"
            style={{
              background: "rgba(124,58,237,0.1)",
              width: `calc(${100 / TABS.length}% - 8px)`,
            }}
            animate={{
              left: `calc(${activeIndex * (100 / TABS.length)}% + 4px)`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          {TABS.map((tab, i) => {
            const active = location.startsWith(tab.path);
            return (
              <Link key={tab.path} href={tab.path}>
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="relative z-10 flex flex-col items-center gap-0.5 py-1 cursor-pointer"
                  style={{ minWidth: `${100 / TABS.length}vw` }}
                  data-testid={`tab-${tab.label.toLowerCase().replace(" ", "-")}`}
                >
                  <motion.div
                    animate={
                      active ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }
                    }
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <tab.icon
                      size={20}
                      style={{ color: active ? "#7C3AED" : undefined }}
                      className={active ? "" : "text-muted-foreground"}
                    />
                  </motion.div>
                  <span
                    className="text-xs"
                    style={{
                      color: active ? "#7C3AED" : undefined,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {tab.label}
                  </span>
                  {tab.path === "/patient/chat" && unreadChat > 0 && (
                    <span className="absolute top-0 right-3 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadChat}
                    </span>
                  )}
                  {tab.path === "/patient/emergency" && (
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
}
