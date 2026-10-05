import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import { SEED_DOCTORS, getAllDoctors } from "@/lib/doctors";

export type Role = "doctor" | "patient" | "admin";

// Built-in administrator (change here). Admin manages doctors + appointments.
export const ADMIN_EMAIL = "admin@DoseVia.com";
export const ADMIN_PASSWORD = "Admin@1234";

export interface Account {
  id: string;
  email: string; // always stored lower-case
  role: Role;
  name: string;
  salt: string;
  passwordHash: string; // SHA-256(salt + password)
  patientId?: string; // link to a Patient record (patients only)
  doctorId?: string; // link to a DoctorProfile (doctors only)
  createdAt: number;
}

const ACCOUNTS_KEY = "DoseVia_accounts";

async function sha256(data: string): Promise<string> {
  const buf = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const a = new Uint8Array(12);
  window.crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();
export const isValidEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function getAccounts(): Account[] {
  return getLocalStorage<Account[]>(ACCOUNTS_KEY) ?? [];
}
function saveAccounts(a: Account[]) {
  setLocalStorage(ACCOUNTS_KEY, a);
}

// Seeds the administrator + an account for every doctor currently in the directory.
// Doctors the admin has deleted are not in the directory, so they are never re-created.
let seeding: Promise<void> | null = null;
export function ensureDemoAccounts(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      const accounts = getAccounts();
      let changed = false;

      if (!accounts.some((a) => a.role === "admin")) {
        const salt = randomSalt();
        accounts.push({
          id: "acc_admin",
          email: ADMIN_EMAIL,
          role: "admin",
          name: "Clinic Admin",
          salt,
          passwordHash: await sha256(salt + ADMIN_PASSWORD),
          createdAt: Date.now(),
        });
        changed = true;
      }

      for (const d of getAllDoctors()) {
        const email = normaliseEmail(d.email);
        const existing = accounts.find((a) => a.email === email);
        if (existing) {
          if (existing.role === "doctor" && existing.doctorId !== d.id) {
            existing.doctorId = d.id;
            changed = true;
          }
          continue;
        }
        const seedPw = SEED_DOCTORS.find((x) => x.id === d.id)?.password;
        if (!seedPw) continue; // admin-added doctors get their account when they are created
        const salt = randomSalt();
        accounts.push({
          id: `acc_${d.id}`,
          email,
          role: "doctor",
          name: d.name,
          salt,
          passwordHash: await sha256(salt + seedPw),
          doctorId: d.id,
          createdAt: Date.now(),
        });
        changed = true;
      }
      if (changed) saveAccounts(accounts);
    })().finally(() => {
      seeding = null;
    });
  }
  return seeding;
}

// Admin-only action: create the login for a doctor the admin just added.
export async function createDoctorAccount(input: {
  doctorId: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const email = normaliseEmail(input.email);
  if (!isValidEmail(email))
    return { success: false, error: "Please enter a valid email address" };
  const pwErr = validatePassword(input.password);
  if (pwErr) return { success: false, error: pwErr };
  const accounts = getAccounts();
  if (accounts.some((a) => a.email === email))
    return {
      success: false,
      error: "An account with this email already exists",
    };
  const salt = randomSalt();
  saveAccounts([
    ...accounts,
    {
      id: `acc_${input.doctorId}`,
      email,
      role: "doctor",
      name: input.name,
      salt,
      passwordHash: await sha256(salt + input.password),
      doctorId: input.doctorId,
      createdAt: Date.now(),
    },
  ]);
  return { success: true };
}

export function removeAccountByDoctorId(doctorId: string): void {
  saveAccounts(getAccounts().filter((a) => a.doctorId !== doctorId));
}

export function emailInUse(email: string): boolean {
  const em = normaliseEmail(email);
  return getAccounts().some((a) => a.email === em);
}

export function removeAccountByPatientId(patientId: string): void {
  saveAccounts(getAccounts().filter((a) => a.patientId !== patientId));
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 6) return "Password must be at least 6 characters";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw))
    return "Password must contain letters and numbers";
  return null;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  patientId?: string;
  doctorId?: string;
}): Promise<{ success: boolean; error?: string; account?: Account }> {
  const email = normaliseEmail(input.email);
  if (!input.name.trim())
    return { success: false, error: "Please enter your full name" };
  if (!isValidEmail(email))
    return { success: false, error: "Please enter a valid email address" };
  const pwErr = validatePassword(input.password);
  if (pwErr) return { success: false, error: pwErr };

  const accounts = getAccounts();
  if (accounts.some((a) => a.email === email)) {
    return {
      success: false,
      error: "An account with this email already exists. Please sign in.",
    };
  }
  const salt = randomSalt();
  const account: Account = {
    id: `acc_${Date.now()}`,
    email,
    role: input.role,
    name: input.name.trim(),
    salt,
    passwordHash: await sha256(salt + input.password),
    patientId: input.patientId,
    doctorId: input.doctorId,
    createdAt: Date.now(),
  };
  saveAccounts([...accounts, account]);
  return { success: true, account };
}

export async function verifyCredentials(
  email: string,
  password: string,
  role: Role,
): Promise<{ success: boolean; error?: string; account?: Account }> {
  const em = normaliseEmail(email);
  if (!isValidEmail(em))
    return { success: false, error: "Please enter a valid email address" };
  const account = getAccounts().find((a) => a.email === em);
  if (!account)
    return {
      success: false,
      error: "No account found for this email. Please register first.",
    };
  const hash = await sha256(account.salt + password);
  if (hash !== account.passwordHash)
    return { success: false, error: "Incorrect password" };
  if (account.role !== role) {
    return {
      success: false,
      error: `This email is registered as a ${account.role}. Switch to "${account.role === "doctor" ? "Doctor" : account.role === "admin" ? "Admin" : "Patient"}" above.`,
    };
  }
  return { success: true, account };
}
