import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  Video,
  Building2,
  Check,
  X,
  CheckCheck,
  MessageSquare,
  CalendarX2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import DoctorLayout from "@/layouts/DoctorLayout";
import {
  Appointment,
  STATUS_STYLE,
  apptDateTime,
  formatDateLong,
  formatTime12,
  todayStr,
} from "@/lib/collab";

type Tab = "requests" | "upcoming" | "history";

export default function DoctorAppointments() {
  const { appointments, updateAppointment } = useApp();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("requests");
  const [noteFor, setNoteFor] = useState<{
    id: string;
    status: "confirmed" | "declined";
  } | null>(null);
  const [note, setNote] = useState("");

  const sortAsc = (a: Appointment, b: Appointment) =>
    apptDateTime(a).getTime() - apptDateTime(b).getTime();
  const requests = useMemo(
    () => appointments.filter((a) => a.status === "assigned").sort(sortAsc),
    [appointments],
  );
  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === "confirmed").sort(sortAsc),
    [appointments],
  );
  const history = useMemo(
    () =>
      appointments
        .filter((a) =>
          ["completed", "declined", "cancelled", "rejected"].includes(a.status),
        )
        .sort((a, b) => sortAsc(b, a)),
    [appointments],
  );
  const today = todayStr();
  const todayCount = upcoming.filter((a) => a.date === today).length;

  const list =
    tab === "requests" ? requests : tab === "upcoming" ? upcoming : history;

  const openChat = (patientId: string) => {
    sessionStorage.setItem("DoseVia_chat_open", patientId);
    setLocation("/doctor/messages");
  };
  const submitNote = () => {
    if (noteFor) {
      updateAppointment(noteFor.id, noteFor.status, note);
      setNoteFor(null);
      setNote("");
    }
  };

  return (
    <DoctorLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Requests the clinic admin has forwarded to you — accept or decline,
            then close completed visits
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Waiting for your acceptance",
              value: requests.length,
              color: "#f59e0b",
              icon: Clock,
            },
            {
              label: "Today",
              value: todayCount,
              color: "#185FA5",
              icon: CalendarCheck,
            },
            {
              label: "Upcoming confirmed",
              value: upcoming.length,
              color: "#0F6E56",
              icon: Check,
            },
          ].map((c) => (
            <motion.div
              key={c.label}
              whileHover={{ y: -3 }}
              className="bg-card/80 border border-border rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${c.color}1f` }}
              >
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground leading-none">
                  {c.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          {(
            [
              ["requests", `New from admin (${requests.length})`],
              ["upcoming", `Upcoming (${upcoming.length})`],
              ["history", "History"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`appt-tab-${t}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {list.length === 0 && (
            <div className="text-center py-14 text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
              <CalendarX2 className="mx-auto mb-2 opacity-50" size={30} />
              <p className="text-sm">
                {tab === "requests"
                  ? "Nothing waiting. New appointments forwarded by the admin appear here."
                  : tab === "upcoming"
                    ? "No confirmed appointments."
                    : "No past appointments yet."}
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {list.map((a) => {
              const st = STATUS_STYLE[a.status];
              const isPast = apptDateTime(a).getTime() < Date.now();
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4"
                  data-testid={`appt-${a.id}`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="w-16 text-center rounded-xl py-2 bg-primary/10 shrink-0">
                      <p className="text-[11px] uppercase text-primary font-semibold">
                        {new Date(`${a.date}T00:00`).toLocaleDateString(
                          "en-GB",
                          { month: "short" },
                        )}
                      </p>
                      <p className="text-2xl font-black text-foreground leading-none">
                        {new Date(`${a.date}T00:00`).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-48">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">
                          {a.patientName}
                        </p>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.fg }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateLong(a.date)} · {formatTime12(a.time)}
                        </span>
                        <span className="flex items-center gap-1">
                          {a.mode === "video" ? (
                            <Video size={12} />
                          ) : (
                            <Building2 size={12} />
                          )}
                          {a.mode === "video" ? "Video call" : "In person"}
                        </span>
                      </p>
                      <p className="text-sm text-foreground mt-2">
                        “{a.reason}”
                      </p>
                      {a.adminNote && (
                        <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Admin note: {a.adminNote}
                        </p>
                      )}
                      {a.doctorNote && (
                        <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
                          Your note: {a.doctorNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {a.status === "assigned" && (
                        <>
                          <button
                            onClick={() => {
                              setNoteFor({ id: a.id, status: "confirmed" });
                              setNote("");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                            data-testid={`confirm-${a.id}`}
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setNoteFor({ id: a.id, status: "declined" });
                              setNote("");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1.5"
                            data-testid={`decline-${a.id}`}
                          >
                            <X size={13} />
                            Decline
                          </button>
                        </>
                      )}
                      {a.status === "confirmed" && (
                        <>
                          <button
                            onClick={() => updateAppointment(a.id, "completed")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                            data-testid={`complete-${a.id}`}
                          >
                            <CheckCheck size={13} />
                            {isPast ? "Mark completed" : "Complete"}
                          </button>
                          <button
                            onClick={() => updateAppointment(a.id, "cancelled")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/70"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openChat(a.patientId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5"
                      >
                        <MessageSquare size={13} />
                        Message
                      </button>
                    </div>
                  </div>

                  {noteFor?.id === a.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-border flex gap-2 items-center flex-wrap"
                    >
                      <input
                        autoFocus
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitNote()}
                        placeholder={
                          noteFor.status === "confirmed"
                            ? "Optional note for the patient (e.g. bring your reports)"
                            : "Reason for declining (optional)"
                        }
                        className="flex-1 min-w-48 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                      <button
                        onClick={submitNote}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold text-white ${noteFor.status === "confirmed" ? "bg-emerald-600" : "bg-red-600"}`}
                        data-testid="appt-note-submit"
                      >
                        {noteFor.status === "confirmed"
                          ? "Accept appointment"
                          : "Decline appointment"}
                      </button>
                      <button
                        onClick={() => setNoteFor(null)}
                        className="px-3 py-2 text-xs text-muted-foreground"
                      >
                        Back
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </DoctorLayout>
  );
}
