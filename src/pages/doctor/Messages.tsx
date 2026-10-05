import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, CalendarPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import DoctorLayout from "@/layouts/DoctorLayout";
import ChatThread from "@/components/ChatThread";

const ACCENT = "#185FA5";
const OPEN_KEY = "DoseVia_chat_open";

export default function DoctorMessages() {
  const { patients, messages, appointments, user } = useApp();
  const doctorId = user?.doctorId ?? "";
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(() =>
    sessionStorage.getItem(OPEN_KEY),
  );

  useEffect(() => {
    sessionStorage.removeItem(OPEN_KEY);
  }, []);

  // `messages` / `appointments` already contain only this doctor's data; list just those patients
  const threadPatientIds = useMemo(
    () =>
      new Set([
        ...messages.map((m) => m.patientId),
        ...appointments.map((a) => a.patientId),
      ]),
    [messages, appointments],
  );
  const rows = useMemo(
    () =>
      patients
        .filter(
          (p) =>
            threadPatientIds.has(p.id) &&
            p.name.toLowerCase().includes(q.toLowerCase()),
        )
        .map((p) => {
          const t = messages.filter((m) => m.patientId === p.id);
          const last = t[t.length - 1];
          return {
            p,
            last,
            unread: t.filter((m) => m.from === "patient" && !m.readByDoctor)
              .length,
          };
        })
        .sort((a, b) => (b.last?.ts ?? 0) - (a.last?.ts ?? 0)),
    [patients, messages, q, threadPatientIds],
  );

  const current =
    patients.find((p) => p.id === active && threadPatientIds.has(p.id)) ?? null;

  return (
    <DoctorLayout>
      <div className="p-6 max-w-6xl mx-auto h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Patient Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Private chat — only patients who chose you appear here
          </p>
        </motion.div>

        <div className="flex-1 min-h-0 bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden flex">
          {/* patient list */}
          <div
            className={`w-full md:w-80 border-r border-border flex flex-col ${current ? "hidden md:flex" : "flex"}`}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search patients…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-xl focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rows.length === 0 && (
                <p className="p-6 text-sm text-center text-muted-foreground">
                  No messages yet. Patients who choose you for their problem
                  will appear here.
                </p>
              )}
              {rows.map(({ p, last, unread }) => (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  data-testid={`thread-${p.id}`}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border/40 hover:bg-primary/5 transition-colors ${p.id === active ? "bg-primary/10" : ""}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #185FA5, #0F6E56)",
                    }}
                  >
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.name}
                      </p>
                      {last && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(last.ts).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {last
                        ? `${last.from === "doctor" ? "You: " : ""}${last.text}`
                        : "No messages yet"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* conversation */}
          <div
            className={`flex-1 min-w-0 flex-col ${current ? "flex" : "hidden md:flex"}`}
          >
            {current ? (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <button
                    className="md:hidden p-1"
                    onClick={() => setActive(null)}
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {current.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {current.age}
                      {current.gender} ·{" "}
                      {current.conditions.join(", ") || "No conditions listed"}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/doctor/appointments")}
                    className="ml-auto text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold"
                    style={{ color: ACCENT, background: "rgba(24,95,165,0.1)" }}
                  >
                    <CalendarPlus size={13} /> Appointments
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatThread
                    key={current.id}
                    patientId={current.id}
                    doctorId={doctorId}
                    me="doctor"
                    accent={ACCENT}
                    quickReplies={[
                      "Please take your medicines on time.",
                      "Please book an appointment.",
                      "Any side effects today?",
                    ]}
                    emptyHint={`Start the conversation with ${current.name}.`}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a patient to open the chat
              </div>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
