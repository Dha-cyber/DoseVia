import { useEffect, useState } from "react";

// ---- Original functions (unchanged) ----

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export function getLocalStorage<T>(key: string): T | null {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

// ---- NEW: SHA-256 integrity functions ----

// Compute SHA-256 hash of any string, returns hex string
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Save data AND its hash together
// Call this instead of setLocalStorage for sensitive patient data
export async function saveWithIntegrity<T>(
  key: string,
  value: T,
): Promise<void> {
  const json = JSON.stringify(value);
  const hash = await sha256(json);
  localStorage.setItem(key, json);
  localStorage.setItem(`${key}_integrity_hash`, hash);
}

// Load data and verify its hash
// Returns: { data, tampered: false } if OK
// Returns: { data, tampered: true }  if someone modified data in DevTools
export async function loadWithIntegrityCheck<T>(
  key: string,
): Promise<{ data: T | null; tampered: boolean }> {
  try {
    const json = localStorage.getItem(key);
    const storedHash = localStorage.getItem(`${key}_integrity_hash`);

    if (!json) return { data: null, tampered: false };

    // If no hash stored yet (old data before this feature), just return data
    if (!storedHash) return { data: JSON.parse(json), tampered: false };

    const currentHash = await sha256(json);
    const tampered = currentHash !== storedHash;

    return { data: JSON.parse(json) as T, tampered };
  } catch {
    return { data: null, tampered: false };
  }
}

// Check just the patient data integrity (main thing to protect)
export async function checkPatientIntegrity(): Promise<boolean> {
  const result = await loadWithIntegrityCheck("DoseVia_patients");
  return result.tampered;
}

// ---- Fresh-database migration ----
// Bump DB_VERSION to wipe all old doctors / patients / accounts / logs on next load.
const DB_VERSION = "3-fresh";
export function runFreshDatabaseMigration(): void {
  try {
    if (localStorage.getItem("DoseVia_db_version") === DB_VERSION) return;
    [
      "DoseVia_patients",
      "DoseVia_patients_integrity_hash",
      "DoseVia_accounts",
      "DoseVia_demo_seeded",
      "DoseVia_user",
      "DoseVia_audit",
      "DoseVia_analysis_history",
      "DoseVia_messages",
      "DoseVia_appointments",
    ].forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("DoseVia_intro_seen");
    localStorage.setItem("DoseVia_db_version", DB_VERSION);
  } catch (e) {
    console.error(e);
  }
}
