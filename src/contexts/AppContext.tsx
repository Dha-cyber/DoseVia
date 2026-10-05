import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Patient,
  DRUGS_DATABASE,
  INITIAL_PATIENTS,
  Drug,
} from "@/lib/drugData";
import {
  getLocalStorage,
  setLocalStorage,
  saveWithIntegrity,
} from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import {
  ChatMessage,
  Appointment,
  ApptMode,
  ApptStatus,
  AppNotification,
  MESSAGES_KEY,
  APPOINTMENTS_KEY,
  NOTIFICATIONS_KEY,
  isSlotTaken,
  isSlotPast,
  isActiveAppt,
  isOpenAppt,
} from "@/lib/collab";
import {
  DoctorProfile,
  DOCTORS_KEY,
  DOCTOR_COLORS,
  getAllDoctors,
  saveDoctors,
  getDoctor,
} from "@/lib/doctors";
import {
  verifyCredentials,
  registerAccount,
  ensureDemoAccounts,
  removeAccountByPatientId,
  createDoctorAccount,
  removeAccountByDoctorId,
  emailInUse,
  isValidEmail,
  validatePassword,
  Account,
} from "@/lib/auth";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AppUser {
  role: "doctor" | "patient" | "admin";
  name: string;
  patientId?: string;
  doctorId?: string; // set for doctors: which of the 20 clinic doctors this is
  expiresAt: number; // NEW: Unix ms timestamp when session expires
}

interface AppContextType {
  user: AppUser | null;
  login: (
    email: string,
    password: string,
    role: "doctor" | "patient" | "admin",
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: "doctor" | "patient" | "admin";
    age?: number;
    gender?: string;
    conditions?: string[];
    speciality?: string;
    qualification?: string;
    experience?: number;
    hospital?: string;
    fee?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  removePatient: (id: string) => void;
  patients: Patient[];
  setPatients: (p: Patient[]) => void;
  addMedsToPatient: (
    patientId: string,
    drugIds: string[],
    mode?: "merge" | "replace",
  ) => { success: boolean; added: string[]; error?: string };
  drugs: Drug[];
  setDrugs: (d: Drug[]) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (p: Patient | null) => void;
  analysisPatientId: string | null;
  setAnalysisPatientId: (id: string | null) => void;
  isDark: boolean;
  toggleDark: () => void;
  // ---- chat ----
  messages: ChatMessage[];
  sendMessage: (patientId: string, doctorId: string, text: string) => void;
  markThreadRead: (patientId: string, doctorId: string) => void;
  // ---- appointments ----
  appointments: Appointment[];
  bookAppointment: (d: {
    doctorId: string;
    date: string;
    time: string;
    mode: ApptMode;
    reason: string;
  }) => { success: boolean; error?: string };
  updateAppointment: (
    id: string,
    status: ApptStatus,
    doctorNote?: string,
  ) => void;
  isDoctorSlotTaken: (doctorId: string, date: string, time: string) => boolean;
  // ---- admin: forward / reject patient requests ----
  forwardAppointment: (
    id: string,
    doctorId: string,
    adminNote?: string,
  ) => { success: boolean; error?: string };
  rejectAppointment: (id: string, adminNote?: string) => void;
  // ---- admin: manage doctors ----
  doctors: DoctorProfile[];
  addDoctor: (
    d: NewDoctorInput,
  ) => Promise<{ success: boolean; error?: string }>;
  removeDoctor: (id: string) => void;
  // ---- notifications ----
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export interface NewDoctorInput {
  name: string;
  email: string;
  password: string;
  speciality: string;
  qualification: string;
  experience: number;
  hospital: string;
  languages: string[];
  fee: number;
  about: string;
}

const AppContext = createContext<AppContextType | null>(null);

function isSessionValid(user: AppUser | null): boolean {
  if (!user) return false;
  return Date.now() < user.expiresAt;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = getLocalStorage<AppUser>("DoseVia_user");
    // Auto-expire session on load
    if (stored && !isSessionValid(stored)) {
      setLocalStorage("DoseVia_user", null);
      return null;
    }
    return stored;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = getLocalStorage<Patient[]>("DoseVia_patients");
    if (!stored) {
      setLocalStorage("DoseVia_patients", INITIAL_PATIENTS);
      saveWithIntegrity("DoseVia_patients", INITIAL_PATIENTS).catch(() => {});
      return INITIAL_PATIENTS;
    }
    saveWithIntegrity("DoseVia_patients", stored).catch(() => {});
    return stored;
  });

  const [drugs, setDrugs] = useState<Drug[]>(() => {
    const stored = getLocalStorage<Drug[]>("DoseVia_drugs");
    if (!stored) {
      setLocalStorage("DoseVia_drugs", DRUGS_DATABASE);
      return DRUGS_DATABASE;
    }
    return stored;
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    const u = getLocalStorage<AppUser>("DoseVia_user");
    if (u?.role === "patient" && u.patientId && isSessionValid(u)) {
      const pts =
        getLocalStorage<Patient[]>("DoseVia_patients") ?? INITIAL_PATIENTS;
      return pts.find((p) => p.id === u.patientId) ?? null;
    }
    return null;
  });

  const [analysisPatientId, setAnalysisPatientId] = useState<string | null>(
    null,
  );
  const [isDark, setIsDark] = useState(
    () => getLocalStorage<boolean>("DoseVia_dark") ?? false,
  );

  useEffect(() => {
    if (user) document.body.setAttribute("data-role", user.role);
    else document.body.removeAttribute("data-role");
  }, [user]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setLocalStorage("DoseVia_dark", isDark);
  }, [isDark]);

  // Keep selectedPatient in sync when patients list changes
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p.id === selectedPatient.id);
      if (
        updated &&
        JSON.stringify(updated) !== JSON.stringify(selectedPatient)
      ) {
        setSelectedPatient(updated);
      }
    }
  }, [patients]);

  useEffect(() => {
    ensureDemoAccounts().catch(() => {});
  }, []);

  // If a doctor removed this patient while they were signed in, end their session
  useEffect(() => {
    if (
      user?.role === "patient" &&
      user.patientId &&
      !patients.some((p) => p.id === user.patientId)
    ) {
      setUser(null);
      setSelectedPatient(null);
      setLocalStorage("DoseVia_user", null);
      document.body.removeAttribute("data-role");
    }
  }, [patients, user]);

  const startSession = (account: Account) => {
    const u: AppUser = {
      role: account.role,
      name: account.name,
      patientId: account.patientId,
      doctorId: account.doctorId,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    setUser(u);
    setLocalStorage("DoseVia_user", u);
    document.body.setAttribute("data-role", account.role);
    if (account.role === "patient" && account.patientId) {
      const pts = getLocalStorage<Patient[]>("DoseVia_patients") ?? patients;
      setSelectedPatient(pts.find((p) => p.id === account.patientId) ?? null);
    }
    logAudit(
      account.name,
      account.role,
      "LOGIN",
      account.role === "admin"
        ? "Admin portal"
        : account.role === "doctor"
          ? "Doctor portal"
          : "Patient portal",
    );
  };

  // Single-step login: email + password only.
  const login: AppContextType["login"] = async (email, password, role) => {
    await ensureDemoAccounts();
    const res = await verifyCredentials(email, password, role);
    if (!res.success || !res.account)
      return { success: false, error: res.error };
    startSession(res.account);
    return { success: true };
  };

  // Registration: creates the account only. The user must then sign in.
  const register: AppContextType["register"] = async (data) => {
    await ensureDemoAccounts();
    let patientId: string | undefined;
    let newPatient: Patient | undefined;
    if (data.role === "patient") {
      patientId = `p_${Date.now()}`;
      newPatient = {
        id: patientId,
        name: data.name.trim(),
        age: data.age && data.age > 0 ? data.age : 30,
        gender: data.gender || "M",
        conditions: data.conditions ?? [],
        drugs: [],
        kidneyFunction: 90,
        liverFunction: 90,
        allergies: [],
        pregnant: false,
      };
    }
    let doctorProfile: DoctorProfile | undefined;
    if (data.role === "doctor") {
      if (!data.speciality?.trim())
        return {
          success: false,
          error: "Please choose or type your speciality",
        };
      const clean = data.name.trim().replace(/^dr\.?\s*/i, "");
      if (!clean)
        return { success: false, error: "Please enter your full name" };
      const existing = getAllDoctors();
      doctorProfile = {
        id: `doc_${Date.now().toString(36)}`,
        name: `Dr. ${clean}`,
        email: data.email.trim().toLowerCase(),
        speciality: data.speciality.trim(),
        qualification: data.qualification?.trim() || "MBBS",
        experience: Math.max(0, Math.round(data.experience ?? 0)),
        hospital: data.hospital?.trim() || "DoseVia Clinic",
        languages: ["English"],
        fee: Math.max(0, Math.round(data.fee ?? 0)),
        rating: 4.5,
        about: `${data.speciality.trim()} at DoseVia.`,
        color: DOCTOR_COLORS[existing.length % DOCTOR_COLORS.length],
      };
    }
    const res = await registerAccount({
      name: doctorProfile ? doctorProfile.name : data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      patientId,
      doctorId: doctorProfile?.id,
    });
    if (!res.success) return { success: false, error: res.error };
    if (newPatient) handleSetPatients([...patients, newPatient]);
    if (doctorProfile) {
      const next = [...getAllDoctors(), doctorProfile];
      saveDoctors(next);
      setDoctors(next);
    }
    logAudit(data.name.trim(), data.role, "REGISTER", data.email);
    return { success: true };
  };

  const logout = () => {
    if (user) {
      logAudit(user.name, user.role, "LOGOUT");
    }
    setUser(null);
    setSelectedPatient(null);
    setLocalStorage("DoseVia_user", null);
    document.body.removeAttribute("data-role");
  };

  const handleSetPatients = (p: Patient[]) => {
    setPatients(p);
    setLocalStorage("DoseVia_patients", p);
    // Also save with integrity hash (CY feature from Step 2)
    saveWithIntegrity("DoseVia_patients", p).catch(() => {});
    if (user?.role === "patient" && user.patientId) {
      const updated = p.find((pt) => pt.id === user.patientId);
      if (updated) setSelectedPatient(updated);
    }
  };

  // ---------------- Doctor directory (admin-managed) ----------------
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() =>
    getAllDoctors(),
  );
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(
    () => getLocalStorage<AppNotification[]>(NOTIFICATIONS_KEY) ?? [],
  );

  // ---------------- Chat + appointments (stored locally, synced across tabs) ----------------
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => getLocalStorage<ChatMessage[]>(MESSAGES_KEY) ?? [],
  );
  const [appointments, setAppointments] = useState<Appointment[]>(
    () => getLocalStorage<Appointment[]>(APPOINTMENTS_KEY) ?? [],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MESSAGES_KEY)
        setMessages(getLocalStorage<ChatMessage[]>(MESSAGES_KEY) ?? []);
      if (e.key === APPOINTMENTS_KEY)
        setAppointments(getLocalStorage<Appointment[]>(APPOINTMENTS_KEY) ?? []);
      if (e.key === NOTIFICATIONS_KEY)
        setAllNotifications(
          getLocalStorage<AppNotification[]>(NOTIFICATIONS_KEY) ?? [],
        );
      if (e.key === DOCTORS_KEY) setDoctors(getAllDoctors());
      if (e.key === "DoseVia_patients") {
        const fresh = getLocalStorage<Patient[]>("DoseVia_patients");
        if (fresh) setPatients(fresh);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const writeMessages = (next: ChatMessage[]) => {
    setLocalStorage(MESSAGES_KEY, next);
    setMessages(next);
  };
  const writeAppointments = (next: Appointment[]) => {
    setLocalStorage(APPOINTMENTS_KEY, next);
    setAppointments(next);
  };
  const latestMessages = () =>
    getLocalStorage<ChatMessage[]>(MESSAGES_KEY) ?? [];
  const latestAppointments = () =>
    getLocalStorage<Appointment[]>(APPOINTMENTS_KEY) ?? [];
  const latestNotifications = () =>
    getLocalStorage<AppNotification[]>(NOTIFICATIONS_KEY) ?? [];
  const writeNotifications = (next: AppNotification[]) => {
    const trimmed = next.slice(-300);
    setLocalStorage(NOTIFICATIONS_KEY, trimmed);
    setAllNotifications(trimmed);
  };
  const notify = (n: Omit<AppNotification, "id" | "ts" | "read">) =>
    writeNotifications([
      ...latestNotifications(),
      {
        ...n,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
        read: false,
      },
    ]);
  const writeDoctors = (next: DoctorProfile[]) => {
    saveDoctors(next);
    setDoctors(next);
  };

  // A doctor removed by the admin while signed in is signed out
  useEffect(() => {
    if (
      user?.role === "doctor" &&
      user.doctorId &&
      !doctors.some((d) => d.id === user.doctorId)
    ) {
      setUser(null);
      setLocalStorage("DoseVia_user", null);
      document.body.removeAttribute("data-role");
    }
  }, [doctors, user]);

  const sendMessage = (patientId: string, doctorId: string, text: string) => {
    const clean = text.trim();
    if (!user || user.role === "admin" || !clean || !getDoctor(doctorId))
      return; // admin never sees or writes private chats
    // patients can only write as themselves; doctors can only write in their OWN threads
    if (user.role === "patient" && user.patientId !== patientId) return;
    if (user.role === "doctor" && user.doctorId !== doctorId) return;
    const msg: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      patientId,
      doctorId,
      from: user.role,
      senderName: user.name,
      text: clean.slice(0, 2000),
      ts: Date.now(),
      readByDoctor: user.role === "doctor",
      readByPatient: user.role === "patient",
    };
    writeMessages([...latestMessages(), msg]);
  };

  const markThreadRead = (patientId: string, doctorId: string) => {
    if (!user || user.role === "admin") return;
    if (user.role === "doctor" && user.doctorId !== doctorId) return;
    if (user.role === "patient" && user.patientId !== patientId) return;
    const cur = latestMessages();
    const field = user.role === "doctor" ? "readByDoctor" : "readByPatient";
    const inThread = (m: ChatMessage) =>
      m.patientId === patientId && m.doctorId === doctorId;
    if (!cur.some((m) => inThread(m) && !m[field])) return;
    writeMessages(
      cur.map((m) => (inThread(m) && !m[field] ? { ...m, [field]: true } : m)),
    );
  };

  const bookAppointment: AppContextType["bookAppointment"] = ({
    doctorId,
    date,
    time,
    mode,
    reason,
  }) => {
    const doc = getDoctor(doctorId);
    if (user?.role !== "patient" || !user.patientId)
      return { success: false, error: "Only patients can book appointments" };
    if (!doc) return { success: false, error: "Please choose a doctor" };
    if (!date || !time)
      return { success: false, error: "Please choose a date and a time slot" };
    if (!reason.trim())
      return {
        success: false,
        error: "Please tell the doctor the reason for your visit",
      };
    if (isSlotPast(date, time))
      return {
        success: false,
        error: "That time has already passed. Pick a later slot.",
      };
    const cur = latestAppointments();
    if (isSlotTaken(cur, date, time, doc.id))
      return {
        success: false,
        error: "That slot was just taken. Please choose another.",
      };
    const appt: Appointment = {
      id: `a_${Date.now()}`,
      patientId: user.patientId,
      patientName: user.name,
      doctorId: doc.id,
      doctorName: doc.name,
      speciality: doc.speciality,
      date,
      time,
      mode,
      reason: reason.trim().slice(0, 500),
      status: "requested",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    writeAppointments([...cur, appt]);
    logAudit(
      user.name,
      "patient",
      "BOOK_APPOINTMENT",
      `${doc.name} ${date} ${time}`,
    );
    notify({
      toRole: "admin",
      apptId: appt.id,
      link: "/admin/appointments",
      title: "New appointment request",
      text: `${user.name} asked for ${doc.name} (${doc.speciality}) on ${date} at ${time}. Forward it to the doctor.`,
    });
    return { success: true };
  };

  // Doctor: accept / decline what the admin forwarded, then complete / cancel.
  // Patient: cancel their own open appointment.
  const updateAppointment: AppContextType["updateAppointment"] = (
    id,
    status,
    doctorNote,
  ) => {
    if (!user || user.role === "admin") return;
    const cur = latestAppointments();
    const target = cur.find((a) => a.id === id);
    if (!target) return;
    if (user.role === "doctor") {
      if (target.doctorId !== user.doctorId) return;
      const allowed: Partial<Record<ApptStatus, ApptStatus[]>> = {
        assigned: ["confirmed", "declined"],
        confirmed: ["completed", "cancelled"],
      };
      if (!allowed[target.status]?.includes(status)) return;
    }
    if (user.role === "patient") {
      // patients may only cancel their own open appointments
      if (
        target.patientId !== user.patientId ||
        status !== "cancelled" ||
        !isOpenAppt(target)
      )
        return;
    }
    writeAppointments(
      cur.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              doctorNote: doctorNote?.trim() ? doctorNote.trim() : a.doctorNote,
              updatedAt: Date.now(),
            }
          : a,
      ),
    );
    const who = `${target.patientName} ${target.date} ${target.time}`;
    logAudit(
      user.name,
      user.role,
      status === "confirmed"
        ? "APPOINTMENT_ACCEPTED"
        : `APPOINTMENT_${status.toUpperCase()}`,
      who,
    );

    const when = `${target.date} at ${target.time}`;
    if (user.role === "doctor") {
      if (status === "confirmed") {
        notify({
          toRole: "admin",
          apptId: id,
          link: "/admin/appointments",
          title: "Doctor accepted",
          text: `${target.doctorName} accepted ${target.patientName}'s appointment on ${when}.`,
        });
        notify({
          toRole: "patient",
          toId: target.patientId,
          apptId: id,
          link: "/patient/appointments",
          title: "Appointment confirmed",
          text: `${target.doctorName} confirmed your visit on ${when}.`,
        });
      } else if (status === "declined") {
        notify({
          toRole: "admin",
          apptId: id,
          link: "/admin/appointments",
          title: "Doctor declined - reassign needed",
          text: `${target.doctorName} could not take ${target.patientName}'s appointment on ${when}. Please forward it to another doctor.`,
        });
        notify({
          toRole: "patient",
          toId: target.patientId,
          apptId: id,
          link: "/patient/appointments",
          title: "Doctor unavailable",
          text: `${target.doctorName} could not take your visit on ${when}. The clinic will arrange another doctor.`,
        });
      } else if (status === "cancelled") {
        notify({
          toRole: "admin",
          apptId: id,
          link: "/admin/appointments",
          title: "Doctor cancelled",
          text: `${target.doctorName} cancelled ${target.patientName}'s appointment on ${when}.`,
        });
        notify({
          toRole: "patient",
          toId: target.patientId,
          apptId: id,
          link: "/patient/appointments",
          title: "Appointment cancelled",
          text: `${target.doctorName} cancelled your visit on ${when}.`,
        });
      } else if (status === "completed") {
        notify({
          toRole: "patient",
          toId: target.patientId,
          apptId: id,
          link: "/patient/appointments",
          title: "Visit completed",
          text: `Your visit with ${target.doctorName} on ${when} is marked completed.`,
        });
      }
    } else {
      notify({
        toRole: "admin",
        apptId: id,
        link: "/admin/appointments",
        title: "Patient cancelled",
        text: `${target.patientName} cancelled the appointment on ${when}.`,
      });
      if (target.forwardedAt)
        notify({
          toRole: "doctor",
          toId: target.doctorId,
          apptId: id,
          link: "/doctor/appointments",
          title: "Appointment cancelled",
          text: `${target.patientName} cancelled the visit on ${when}.`,
        });
    }
  };

  // Admin: send a patient's request to a specific doctor (the one the patient chose, or another).
  const forwardAppointment: AppContextType["forwardAppointment"] = (
    id,
    doctorId,
    adminNote,
  ) => {
    if (user?.role !== "admin")
      return {
        success: false,
        error: "Only the admin can forward appointments",
      };
    const cur = latestAppointments();
    const target = cur.find((a) => a.id === id);
    const doc = getDoctor(doctorId);
    if (!target) return { success: false, error: "Appointment not found" };
    if (!doc) return { success: false, error: "Please choose a doctor" };
    if (!["requested", "declined", "assigned"].includes(target.status))
      return {
        success: false,
        error: "This appointment can no longer be forwarded",
      };
    if (isSlotPast(target.date, target.time))
      return {
        success: false,
        error:
          "That appointment time has already passed. Reject it or ask the patient to rebook.",
      };
    if (
      isSlotTaken(
        cur.filter((a) => a.id !== id),
        target.date,
        target.time,
        doc.id,
      )
    )
      return {
        success: false,
        error: `${doc.name} already has a visit at that time. Choose another doctor.`,
      };
    const prev = target.doctorId;
    const wasAssigned = target.status === "assigned";
    writeAppointments(
      cur.map((a) =>
        a.id === id
          ? {
              ...a,
              doctorId: doc.id,
              doctorName: doc.name,
              speciality: doc.speciality,
              status: "assigned" as ApptStatus,
              adminNote: adminNote?.trim() ? adminNote.trim() : a.adminNote,
              forwardedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : a,
      ),
    );
    const when = `${target.date} at ${target.time}`;
    logAudit(
      user.name,
      "admin",
      "FORWARD_APPOINTMENT",
      `${target.patientName} -> ${doc.name}`,
    );
    notify({
      toRole: "doctor",
      toId: doc.id,
      apptId: id,
      link: "/doctor/appointments",
      title: "New appointment - please accept",
      text: `${target.patientName} (${target.mode === "video" ? "video call" : "in person"}) on ${when}. Reason: ${target.reason}`,
    });
    notify({
      toRole: "patient",
      toId: target.patientId,
      apptId: id,
      link: "/patient/appointments",
      title: "Request sent to doctor",
      text: `The clinic forwarded your request to ${doc.name}. You'll be notified when the doctor accepts.`,
    });
    if (wasAssigned && prev !== doc.id)
      notify({
        toRole: "doctor",
        toId: prev,
        apptId: id,
        link: "/doctor/appointments",
        title: "Appointment withdrawn",
        text: `${target.patientName}'s request for ${when} was moved to another doctor.`,
      });
    return { success: true };
  };

  const rejectAppointment: AppContextType["rejectAppointment"] = (
    id,
    adminNote,
  ) => {
    if (user?.role !== "admin") return;
    const cur = latestAppointments();
    const target = cur.find((a) => a.id === id);
    if (
      !target ||
      !["requested", "declined", "assigned"].includes(target.status)
    )
      return;
    writeAppointments(
      cur.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "rejected" as ApptStatus,
              adminNote: adminNote?.trim() ? adminNote.trim() : a.adminNote,
              updatedAt: Date.now(),
            }
          : a,
      ),
    );
    logAudit(
      user.name,
      "admin",
      "REJECT_APPOINTMENT",
      `${target.patientName} ${target.date} ${target.time}`,
    );
    notify({
      toRole: "patient",
      toId: target.patientId,
      apptId: id,
      link: "/patient/appointments",
      title: "Request not accepted",
      text: `The clinic could not arrange your visit on ${target.date} at ${target.time}.${adminNote?.trim() ? " Note: " + adminNote.trim() : " Please book another time."}`,
    });
    if (target.status === "assigned")
      notify({
        toRole: "doctor",
        toId: target.doctorId,
        apptId: id,
        link: "/doctor/appointments",
        title: "Appointment withdrawn",
        text: `${target.patientName}'s request for ${target.date} at ${target.time} was withdrawn by the admin.`,
      });
  };

  // Admin: add a doctor (creates the doctor's login too)
  const addDoctor: AppContextType["addDoctor"] = async (d) => {
    if (user?.role !== "admin")
      return { success: false, error: "Only the admin can add doctors" };
    const name = d.name.trim().replace(/^dr\.?\s*/i, "");
    if (!name)
      return { success: false, error: "Please enter the doctor's name" };
    if (!isValidEmail(d.email))
      return { success: false, error: "Please enter a valid email address" };
    if (emailInUse(d.email))
      return {
        success: false,
        error: "An account with this email already exists",
      };
    const pwErr = validatePassword(d.password);
    if (pwErr) return { success: false, error: pwErr };
    if (!d.speciality.trim())
      return { success: false, error: "Please choose or type a speciality" };
    const id = `doc_${Date.now().toString(36)}`;
    const profile: DoctorProfile = {
      id,
      name: `Dr. ${name}`,
      email: d.email.trim().toLowerCase(),
      speciality: d.speciality.trim(),
      qualification: d.qualification.trim() || "MBBS",
      experience: Math.max(0, Math.round(d.experience) || 0),
      hospital: d.hospital.trim() || "DoseVia Clinic",
      languages: d.languages.length ? d.languages : ["English"],
      fee: Math.max(0, Math.round(d.fee) || 0),
      rating: 4.5,
      about: d.about.trim() || `${d.speciality.trim()} at DoseVia.`,
      color: DOCTOR_COLORS[doctors.length % DOCTOR_COLORS.length],
    };
    const acc = await createDoctorAccount({
      doctorId: id,
      name: profile.name,
      email: profile.email,
      password: d.password,
    });
    if (!acc.success) return acc;
    writeDoctors([...getAllDoctors(), profile]);
    logAudit(user.name, "admin", "ADD_DOCTOR", profile.name);
    return { success: true };
  };

  // Admin: remove a doctor. Login + chats go; open appointments return to the admin queue.
  const removeDoctor: AppContextType["removeDoctor"] = (id) => {
    if (user?.role !== "admin") return;
    const doc = getDoctor(id);
    if (!doc) return;
    writeDoctors(getAllDoctors().filter((d) => d.id !== id));
    removeAccountByDoctorId(id);
    writeMessages(latestMessages().filter((m) => m.doctorId !== id));
    const cur = latestAppointments();
    const affected = cur.filter(
      (a) =>
        a.doctorId === id &&
        (a.status === "assigned" ||
          a.status === "confirmed" ||
          a.status === "requested"),
    );
    writeAppointments(
      cur.map((a) =>
        affected.some((x) => x.id === a.id)
          ? {
              ...a,
              status: "declined" as ApptStatus,
              doctorNote: "Doctor is no longer available",
              updatedAt: Date.now(),
            }
          : a,
      ),
    );
    affected.forEach((a) =>
      notify({
        toRole: "patient",
        toId: a.patientId,
        apptId: a.id,
        link: "/patient/appointments",
        title: "Doctor unavailable",
        text: `${doc.name} is no longer available for your visit on ${a.date} at ${a.time}. The clinic will arrange another doctor.`,
      }),
    );
    if (affected.length)
      notify({
        toRole: "admin",
        link: "/admin/appointments",
        title: "Reassign needed",
        text: `${affected.length} appointment(s) of ${doc.name} need a new doctor.`,
      });
    logAudit(user.name, "admin", "REMOVE_DOCTOR", doc.name);
  };

  const markNotificationRead = (nid: string) => {
    const cur = latestNotifications();
    if (!cur.some((n) => n.id === nid && !n.read)) return;
    writeNotifications(
      cur.map((n) => (n.id === nid ? { ...n, read: true } : n)),
    );
  };
  const markAllNotificationsRead = () => {
    const mine = new Set(
      visibleNotifications.filter((n) => !n.read).map((n) => n.id),
    );
    if (!mine.size) return;
    writeNotifications(
      latestNotifications().map((n) =>
        mine.has(n.id) ? { ...n, read: true } : n,
      ),
    );
  };

  // Doctor: push an analysed drug combination into a patient's "My Meds"
  const addMedsToPatient: AppContextType["addMedsToPatient"] = (
    patientId,
    drugIds,
    mode = "merge",
  ) => {
    if (user?.role !== "doctor")
      return { success: false, added: [], error: "Only doctors can do this" };
    const current = getLocalStorage<Patient[]>("DoseVia_patients") ?? patients;
    const target = current.find((p) => p.id === patientId);
    if (!target)
      return { success: false, added: [], error: "Patient not found" };
    const unique = Array.from(new Set(drugIds));
    let nextDrugs: string[];
    let added: string[];
    if (mode === "replace") {
      nextDrugs = unique.slice(0, 5);
      added = nextDrugs.filter((id) => !target.drugs.includes(id));
    } else {
      added = unique.filter((id) => !target.drugs.includes(id));
      nextDrugs = [...target.drugs, ...added];
      if (nextDrugs.length > 5)
        return {
          success: false,
          added: [],
          error: `A patient can have at most 5 medicines (${target.name} has ${target.drugs.length}). Replace the current list instead.`,
        };
    }
    if (mode === "merge" && added.length === 0)
      return {
        success: false,
        added: [],
        error: "All these medicines are already in the patient's My Meds",
      };
    handleSetPatients(
      current.map((p) => (p.id === patientId ? { ...p, drugs: nextDrugs } : p)),
    );
    const names = nextDrugs
      .map((id) => drugs.find((d) => d.id === id)?.genericName ?? id)
      .join(", ");
    notify({
      toRole: "patient",
      toId: patientId,
      title: "Your medicines were updated",
      text: `${user.name} updated your My Meds: ${names}.`,
      link: "/patient/meds",
    });
    logAudit(user.name, "doctor", "UPDATE_MEDS", `${target.name}: ${names}`);
    return { success: true, added };
  };

  // Doctor-only: remove a patient whose case is resolved (also deletes their login account)
  const removePatient = (id: string) => {
    if (user?.role !== "doctor" && user?.role !== "admin") return;
    const target = patients.find((p) => p.id === id);
    handleSetPatients(patients.filter((p) => p.id !== id));
    removeAccountByPatientId(id);
    writeMessages(latestMessages().filter((m) => m.patientId !== id));
    writeAppointments(latestAppointments().filter((a) => a.patientId !== id));
    if (analysisPatientId === id) setAnalysisPatientId(null);
    logAudit(user.name, user.role, "DELETE_PATIENT", target?.name ?? id);
  };

  const handleSetDrugs = (d: Drug[]) => {
    setDrugs(d);
    setLocalStorage("DoseVia_drugs", d);
  };

  // Privacy: each person only ever receives their own data.
  //  - Admin: every appointment (to run the queue) but NO private chats.
  //  - Doctor: only appointments the admin forwarded to them, and only their own chats.
  //  - Patient: only their own.
  const visibleMessages = messages.filter(
    (m) =>
      !!m.doctorId &&
      (user?.role === "doctor"
        ? m.doctorId === user.doctorId
        : user?.role === "patient"
          ? m.patientId === user.patientId
          : false),
  );
  const visibleAppointments = appointments.filter((a) => {
    if (user?.role === "admin") return true;
    if (!a.doctorId) return false;
    if (user?.role === "doctor")
      return (
        a.doctorId === user.doctorId &&
        (!!a.forwardedAt ||
          a.status === "confirmed" ||
          a.status === "completed")
      );
    if (user?.role === "patient") return a.patientId === user.patientId;
    return false;
  });
  const visibleNotifications = allNotifications
    .filter((n) =>
      user?.role === "admin"
        ? n.toRole === "admin"
        : user?.role === "doctor"
          ? n.toRole === "doctor" && n.toId === user.doctorId
          : user?.role === "patient"
            ? n.toRole === "patient" && n.toId === user.patientId
            : false,
    )
    .sort((a, b) => b.ts - a.ts);
  const isDoctorSlotTaken = (doctorId: string, date: string, time: string) =>
    isSlotTaken(appointments, date, time, doctorId);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        removePatient,
        patients,
        setPatients: handleSetPatients,
        addMedsToPatient,
        drugs,
        setDrugs: handleSetDrugs,
        selectedPatient,
        setSelectedPatient,
        analysisPatientId,
        setAnalysisPatientId,
        isDark,
        toggleDark: () => setIsDark((d) => !d),
        messages: visibleMessages,
        sendMessage,
        markThreadRead,
        appointments: visibleAppointments,
        bookAppointment,
        updateAppointment,
        isDoctorSlotTaken,
        forwardAppointment,
        rejectAppointment,
        doctors,
        addDoctor,
        removeDoctor,
        notifications: visibleNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
