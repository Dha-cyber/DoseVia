// Doctor–patient chat + appointment booking: types & helpers.

export interface ChatMessage {
  id: string;
  patientId: string; // a conversation = one patient + one doctor
  doctorId: string; // the doctor this thread belongs to (only they can read it)
  from: "doctor" | "patient";
  senderName: string;
  text: string;
  ts: number;
  readByDoctor: boolean;
  readByPatient: boolean;
}

// Flow: patient books -> 'requested' (admin queue) -> admin forwards -> 'assigned' (doctor is notified)
//       -> doctor accepts -> 'confirmed' -> 'completed'.
// Doctor declines -> 'declined' (back to admin to reassign). Admin can 'reject' a request.
export type ApptStatus =
  | "requested"
  | "assigned"
  | "confirmed"
  | "declined"
  | "rejected"
  | "cancelled"
  | "completed";
export type ApptMode = "in-person" | "video";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  speciality: string;
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm (24h, local)
  mode: ApptMode;
  reason: string;
  status: ApptStatus;
  doctorNote?: string; // note from the doctor (accept / decline)
  adminNote?: string; // note from the admin (forward / reject)
  forwardedAt?: number; // when the admin sent it to the doctor
  createdAt: number;
  updatedAt: number;
}

export const MESSAGES_KEY = "DoseVia_messages";
export const APPOINTMENTS_KEY = "DoseVia_appointments";

// 30-min clinic slots, lunch break 13:00–14:00
export const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 17; h++)
    for (const m of [0, 30]) {
      if (h === 13) continue;
      out.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
    }
  return out;
})();

export const pad = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDateStr(new Date());
export const apptDateTime = (a: { date: string; time: string }) =>
  new Date(`${a.date}T${a.time}:00`);

export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
export function formatDateLong(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// holds a time slot with its doctor
export const isActiveAppt = (a: Appointment) =>
  a.status === "requested" ||
  a.status === "assigned" ||
  a.status === "confirmed";
// still needs something to happen (also includes 'declined' = waiting for the admin to reassign)
export const isOpenAppt = (a: Appointment) =>
  isActiveAppt(a) || a.status === "declined";
// A slot is only blocked for the same doctor - other doctors stay bookable.
export const isSlotTaken = (
  appts: Appointment[],
  date: string,
  time: string,
  doctorId: string,
) =>
  appts.some(
    (a) =>
      isActiveAppt(a) &&
      a.doctorId === doctorId &&
      a.date === date &&
      a.time === time,
  );
export const isSlotPast = (date: string, time: string) =>
  apptDateTime({ date, time }).getTime() <= Date.now();

export const STATUS_STYLE: Record<
  ApptStatus,
  { label: string; bg: string; fg: string }
> = {
  requested: { label: "Awaiting admin", bg: "#f59e0b22", fg: "#d97706" },
  assigned: { label: "Sent to doctor", bg: "#8b5cf622", fg: "#7c3aed" },
  confirmed: { label: "Confirmed", bg: "#10b98122", fg: "#059669" },
  declined: { label: "Doctor declined", bg: "#ef444422", fg: "#dc2626" },
  rejected: { label: "Rejected by clinic", bg: "#ef444422", fg: "#dc2626" },
  cancelled: { label: "Cancelled", bg: "#64748b22", fg: "#64748b" },
  completed: { label: "Completed", bg: "#3b82f622", fg: "#2563eb" },
};

// ---- Notifications (admin <-> doctor <-> patient) ----
export interface AppNotification {
  id: string;
  toRole: "admin" | "doctor" | "patient";
  toId?: string; // doctorId / patientId (none for admin)
  title: string;
  text: string;
  ts: number;
  read: boolean;
  apptId?: string;
  link?: string; // page to open when clicked
}
export const NOTIFICATIONS_KEY = "DoseVia_notifications";

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}
