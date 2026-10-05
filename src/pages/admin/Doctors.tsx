import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Trash2,
  Search,
  Star,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AdminLayout from "@/layouts/AdminLayout";
import { DoctorAvatar } from "@/components/DoctorCard";
import {
  COMMON_SPECIALITIES,
  specialitiesOf,
  DoctorProfile,
} from "@/lib/doctors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ACCENT = "#0F766E";
const EMPTY = {
  name: "",
  email: "",
  password: "",
  speciality: "",
  qualification: "",
  experience: "",
  hospital: "",
  languages: "English",
  fee: "",
  about: "",
};

export default function AdminDoctors() {
  const { doctors, appointments, addDoctor, removeDoctor } = useApp();
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<DoctorProfile | null>(null);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));
  const specs = useMemo(
    () =>
      Array.from(
        new Set([...COMMON_SPECIALITIES, ...specialitiesOf(doctors)]),
      ).sort(),
    [doctors],
  );
  const list = doctors.filter(
    (d) =>
      (!spec || d.speciality === spec) &&
      (!q.trim() ||
        `${d.name} ${d.speciality} ${d.email}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())),
  );
  const stats = (id: string) => ({
    toAccept: appointments.filter(
      (a) => a.doctorId === id && a.status === "assigned",
    ).length,
    upcoming: appointments.filter(
      (a) => a.doctorId === id && a.status === "confirmed",
    ).length,
    done: appointments.filter(
      (a) => a.doctorId === id && a.status === "completed",
    ).length,
  });
  const openCount = (id: string) =>
    appointments.filter(
      (a) =>
        a.doctorId === id &&
        ["requested", "assigned", "confirmed"].includes(a.status),
    ).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await addDoctor({
      name: f.name,
      email: f.email,
      password: f.password,
      speciality: f.speciality,
      qualification: f.qualification,
      experience: Number(f.experience) || 0,
      hospital: f.hospital,
      fee: Number(f.fee) || 0,
      about: f.about,
      languages: f.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (!res.success) return setError(res.error ?? "Could not add doctor");
    setFlash(
      `Dr. ${f.name.replace(/^dr\.?\s*/i, "")} added. They can sign in with ${f.email.trim().toLowerCase()} and the password you set.`,
    );
    setF(EMPTY);
    setShowForm(false);
    setTimeout(() => setFlash(""), 7000);
  };

  const input =
    "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-600/40";

  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex-1 min-w-60">
            <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {doctors.length} doctors in the clinic database. Add a doctor to
              give them a login; remove one when they leave.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((s) => !s);
              setError("");
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{ background: ACCENT }}
            data-testid="add-doctor-toggle"
          >
            {showForm ? (
              <>
                <X size={15} />
                Close form
              </>
            ) : (
              <>
                <UserPlus size={15} />
                Add doctor
              </>
            )}
          </button>
        </motion.div>

        {flash && (
          <p className="text-xs rounded-lg px-3 py-2 bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center gap-2">
            <CheckCircle2 size={14} />
            {flash}
          </p>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={submit}
              noValidate
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card/80 border border-border rounded-2xl p-5 space-y-4">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <UserPlus size={16} style={{ color: ACCENT }} />
                  New doctor
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-xs text-muted-foreground">
                    Full name *
                    <input
                      value={f.name}
                      onChange={set("name")}
                      placeholder="e.g. Ananya Rao"
                      className={`${input} mt-1`}
                      data-testid="doc-name"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Speciality *
                    <input
                      list="spec-list"
                      value={f.speciality}
                      onChange={set("speciality")}
                      placeholder="Choose or type"
                      className={`${input} mt-1`}
                      data-testid="doc-speciality"
                    />
                  </label>
                  <datalist id="spec-list">
                    {specs.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <label className="text-xs text-muted-foreground">
                    Login email *
                    <input
                      type="email"
                      value={f.email}
                      onChange={set("email")}
                      placeholder="doctor@DoseVia.com"
                      className={`${input} mt-1`}
                      data-testid="doc-email"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Login password *{" "}
                    <span className="opacity-70">
                      (min 6, letters + numbers)
                    </span>
                    <input
                      type="text"
                      value={f.password}
                      onChange={set("password")}
                      placeholder="e.g. Ananya@1234"
                      className={`${input} mt-1`}
                      data-testid="doc-password"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Qualification
                    <input
                      value={f.qualification}
                      onChange={set("qualification")}
                      placeholder="MD, DM (Cardiology)"
                      className={`${input} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Hospital / unit
                    <input
                      value={f.hospital}
                      onChange={set("hospital")}
                      placeholder="DoseVia Heart Centre"
                      className={`${input} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Experience (years)
                    <input
                      type="number"
                      min={0}
                      value={f.experience}
                      onChange={set("experience")}
                      className={`${input} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Consultation fee (₹)
                    <input
                      type="number"
                      min={0}
                      value={f.fee}
                      onChange={set("fee")}
                      className={`${input} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground sm:col-span-2">
                    Languages (comma separated)
                    <input
                      value={f.languages}
                      onChange={set("languages")}
                      className={`${input} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground sm:col-span-2">
                    About
                    <textarea
                      rows={2}
                      value={f.about}
                      onChange={set("about")}
                      placeholder="What does this doctor treat?"
                      className={`${input} mt-1 resize-none`}
                    />
                  </label>
                </div>
                {error && (
                  <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: ACCENT }}
                    data-testid="doc-submit"
                  >
                    {busy ? "Adding…" : "Add doctor to database"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setF(EMPTY);
                      setError("");
                    }}
                    className="px-4 py-2.5 text-sm text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, speciality or email…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none text-foreground"
            />
          </div>
          <select
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none"
          >
            <option value="">All specialities</option>
            {specialitiesOf(doctors).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {list.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground bg-card/60 border border-dashed border-border rounded-2xl">
            No doctors match.
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {list.map((d) => {
              const s = stats(d.id);
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card/80 border border-border rounded-2xl p-4 flex flex-col gap-3"
                  data-testid={`admin-doctor-${d.id}`}
                >
                  <div className="flex gap-3">
                    <DoctorAvatar d={d} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">
                        {d.name}
                      </p>
                      <span
                        className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5"
                        style={{ background: `${d.color}22`, color: d.color }}
                      >
                        {d.speciality}
                      </span>
                    </div>
                    <span className="text-xs font-semibold flex items-start gap-1 text-amber-500 shrink-0">
                      <Star size={12} className="mt-0.5 fill-amber-400" />
                      {d.rating}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail size={12} />
                      {d.email}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 size={12} />
                      {d.hospital}
                    </p>
                    <p>
                      {d.qualification} · {d.experience} yrs · ₹{d.fee}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["To accept", s.toAccept, "#8b5cf6"],
                      ["Upcoming", s.upcoming, "#059669"],
                      ["Done", s.done, "#2563eb"],
                    ].map(([l, n, c]) => (
                      <div
                        key={l as string}
                        className="rounded-lg bg-muted/60 py-1.5"
                      >
                        <p
                          className="text-base font-black leading-none"
                          style={{ color: c as string }}
                        >
                          {n}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {l}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setToDelete(d)}
                    className="mt-auto px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center gap-1.5"
                    data-testid={`delete-doctor-${d.id}`}
                  >
                    <Trash2 size={13} />
                    Remove doctor
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their login and chat history will be deleted and they will
              disappear from the patient directory.
              {toDelete && openCount(toDelete.id) > 0
                ? ` ${openCount(toDelete.id)} open appointment(s) will go back to your queue to be reassigned, and the patients will be told.`
                : ""}{" "}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep doctor</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-doctor"
              onClick={() => {
                if (toDelete) removeDoctor(toDelete.id);
                setToDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
