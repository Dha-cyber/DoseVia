export interface AuditEvent {
  id: string;
  timestamp: string; // ISO string e.g. "2026-05-25T10:30:00.000Z"
  user: string; // doctor or patient name
  action: string; // "LOGIN" | "LOGOUT" | "EDIT_DRUG" | "ADD_PATIENT" | "DELETE_PATIENT"
  target?: string; // e.g. patient name, drug name
  role: "doctor" | "patient" | "admin";
}

const AUDIT_KEY = "DoseVia_audit";
const MAX_ENTRIES = 100; // keep last 100 events only

function isViewedPatientEvent(event: AuditEvent): boolean {
  const action = String(event.action || "").toLowerCase();
  const target = String(event.target || "").toLowerCase();

  return (
    action === "view_patient" ||
    action.includes("viewed patient") ||
    target.includes("viewed patient")
  );
}

function isDuplicateEvent(
  previous: AuditEvent | undefined,
  current: AuditEvent,
): boolean {
  if (!previous) return false;

  const sameUser = previous.user === current.user;
  const sameRole = previous.role === current.role;
  const sameAction = previous.action === current.action;
  const sameTarget = (previous.target || "") === (current.target || "");

  const previousTime = new Date(previous.timestamp).getTime();
  const currentTime = new Date(current.timestamp).getTime();
  const timeDifference = Math.abs(currentTime - previousTime);

  // Prevent repeated login/logout entries caused by double-clicks, reloads,
  // React StrictMode, or accidental repeated calls.
  return (
    sameUser && sameRole && sameAction && sameTarget && timeDifference < 10000
  );
}

function cleanAuditEvents(events: AuditEvent[]): AuditEvent[] {
  const cleaned: AuditEvent[] = [];

  for (const event of events) {
    if (isViewedPatientEvent(event)) continue;

    const previous = cleaned[cleaned.length - 1];
    if (isDuplicateEvent(previous, event)) continue;

    cleaned.push(event);
  }

  return cleaned.slice(-MAX_ENTRIES);
}

export function logAudit(
  user: string,
  role: "doctor" | "patient" | "admin",
  action: string,
  target?: string,
): void {
  try {
    // Do not create "Viewed patient" audit entries anymore.
    if (
      action === "VIEW_PATIENT" ||
      String(action || "")
        .toLowerCase()
        .includes("viewed patient") ||
      String(target || "")
        .toLowerCase()
        .includes("viewed patient")
    ) {
      return;
    }

    const existing: AuditEvent[] = cleanAuditEvents(
      JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"),
    );

    const newEvent: AuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      target,
      role,
    };

    const last = existing[existing.length - 1];
    if (isDuplicateEvent(last, newEvent)) return;

    const updated = cleanAuditEvents([...existing, newEvent]);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail — audit log must never crash the app
  }
}

export function getAuditLog(): AuditEvent[] {
  try {
    const existing: AuditEvent[] = JSON.parse(
      localStorage.getItem(AUDIT_KEY) || "[]",
    );
    const cleaned = cleanAuditEvents(existing);

    // Update localStorage once so old "Viewed patient" entries disappear permanently.
    if (cleaned.length !== existing.length) {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_KEY);
}

// Friendly labels shown in the UI
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: "🔑 Logged in",
  LOGOUT: "🚪 Logged out",
  ADD_PATIENT: "➕ Added patient",
  DELETE_PATIENT: "🗑️ Deleted patient",
  EDIT_PATIENT: "✏️ Edited patient",
  ADD_DRUG: "💊 Added drug",
  DELETE_DRUG: "🗑️ Deleted drug",
  VIEW_ANALYSIS: "🔬 Ran analysis",
  EXPORT_REPORT: "📄 Exported report",
  AI_CHAT: "🤖 Used AI assistant",
  REGISTER: "📝 Registered account",
  BOOK_APPOINTMENT: "📅 Requested appointment",
  APPOINTMENT_CONFIRMED: "✅ Confirmed appointment",
  APPOINTMENT_DECLINED: "❌ Declined appointment",
  APPOINTMENT_CANCELLED: "🚫 Cancelled appointment",
  APPOINTMENT_COMPLETED: "🏁 Completed appointment",
  APPOINTMENT_ACCEPTED: "✅ Doctor accepted appointment",
  FORWARD_APPOINTMENT: "📨 Forwarded appointment to doctor",
  REJECT_APPOINTMENT: "⛔ Rejected appointment request",
  ADD_DOCTOR: "🩺 Added doctor",
  REMOVE_DOCTOR: "🗑️ Removed doctor",
};
