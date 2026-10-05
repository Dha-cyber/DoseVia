import { useEffect, useState } from "react";
import { COMMON_SPECIALITIES } from "@/lib/doctors";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Mail, Lock, User, Eye, EyeOff, CalendarDays } from "lucide-react";
import DrugBackdrop from "@/components/graphics/DrugBackdrop";
import { Capsule } from "@/components/graphics/DrugShapes";

type Mode = "signin" | "register";
type RoleKey = "doctor" | "patient" | "admin";
const homeFor = (r: RoleKey) =>
  r === "admin"
    ? "/admin/dashboard"
    : r === "doctor"
      ? "/doctor/dashboard"
      : "/patient/home";
const ROLE_LABEL: Record<RoleKey, string> = {
  doctor: "Doctor",
  patient: "Patient",
  admin: "Admin",
};

export default function Login() {
  const { login, register, user } = useApp();
  const [, setLocation] = useLocation();

  const [role, setRole] = useState<RoleKey>("patient");
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("M");
  const [speciality, setSpeciality] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [hospital, setHospital] = useState("");
  const [fee, setFee] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Already signed in (e.g. page refresh) -> go straight to the portal
  useEffect(() => {
    if (user) setLocation(homeFor(user.role));
  }, [user, setLocation]);

  const isDoctor = role === "doctor";
  const isAdmin = role === "admin";
  const isRegister = mode === "register";
  const primary = isAdmin ? "#0F766E" : isDoctor ? "#185FA5" : "#7C3AED";
  const accent = isAdmin ? "#5eead4" : isDoctor ? "#60a5fa" : "#a78bfa";
  const bg = isAdmin
    ? "linear-gradient(135deg, #04201e 0%, #063a36 50%, #082f3d 100%)"
    : isDoctor
      ? "linear-gradient(135deg, #0a1628 0%, #0d2045 50%, #0a2d4a 100%)"
      : "linear-gradient(135deg, #1a0a2e 0%, #2d0a4a 50%, #1a0a35 100%)";

  const reset = () => {
    setError("");
    setInfo("");
    setPassword("");
    setConfirm("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) return setError("Please enter your email address");
    if (!password) return setError("Please enter your password");

    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) return setError("Please enter your full name");
        if (password !== confirm) return setError("Passwords do not match");
        const res = await register({
          name,
          email,
          password,
          role,
          age: role === "patient" ? parseInt(age, 10) || undefined : undefined,
          gender: role === "patient" ? gender : undefined,
          speciality: isDoctor ? speciality : undefined,
          qualification: isDoctor ? qualification : undefined,
          experience: isDoctor ? parseInt(experience, 10) || 0 : undefined,
          hospital: isDoctor ? hospital : undefined,
          fee: isDoctor ? parseInt(fee, 10) || 0 : undefined,
        });
        if (!res.success) return setError(res.error ?? "Registration failed");
        // Registered -> now they must sign in
        setMode("signin");
        setPassword("");
        setConfirm("");
        setInfo(
          "Account created! Please sign in with your email and password.",
        );
        return;
      }
      // Single-step sign-in: email + password, once.
      const res = await login(email, password, role);
      if (!res.success) return setError(res.error ?? "Login failed");
      setLocation(homeFor(role));
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/35 focus:outline-none focus:border-white/60 transition-all";

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{ background: bg }}
    >
      <DrugBackdrop opacity={0.3} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: 200 + i * 90,
              height: 200 + i * 90,
              background: `radial-gradient(circle, ${primary}, transparent)`,
              left: `${[10, 62, 80, 25][i]}%`,
              top: `${[20, 55, 8, 78][i]}%`,
            }}
            animate={{ x: [0, 25, -15, 0], y: [0, -15, 25, 0] }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <motion.div
              className="flex justify-center mb-2"
              animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Capsule size={84} c1={accent} c2="#f8fafc" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              DoseVia
            </h1>
            <p className="text-white/55 text-sm mt-1">
              Your medications are monitored. Your safety is guaranteed.
            </p>
          </div>

          {/* Role selector */}
          <div className="relative flex bg-white/10 rounded-2xl p-1 mb-4">
            <motion.div
              className="absolute top-1 bottom-1 rounded-xl"
              style={{ background: primary, width: "calc((100% - 8px) / 3)" }}
              animate={{
                left: `calc(4px + ${["patient", "doctor", "admin"].indexOf(role)} * ((100% - 8px) / 3))`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {(["patient", "doctor", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  reset();
                }}
                className="relative z-10 flex-1 py-2.5 text-sm font-semibold text-white rounded-xl"
              >
                {r === "admin"
                  ? "Admin"
                  : r === "doctor"
                    ? "Doctor"
                    : "Patient"}
              </button>
            ))}
          </div>

          {/* Sign in / Register tabs */}
          <div className="flex gap-6 justify-center mb-5 text-sm font-semibold">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  reset();
                }}
                className="pb-1 transition-colors"
                style={{
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.45)",
                  borderBottom:
                    mode === m
                      ? `2px solid ${accent}`
                      : "2px solid transparent",
                }}
              >
                {m === "signin" ? "Sign In" : "New? Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3" noValidate>
            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.div
                  key="reg-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        isDoctor ? "Full name (e.g. Anil Verma)" : "Full name"
                      }
                      className={field}
                      autoComplete="name"
                    />
                  </div>
                  {isDoctor && (
                    <div className="space-y-3">
                      <input
                        list="reg-spec"
                        value={speciality}
                        onChange={(e) => setSpeciality(e.target.value)}
                        placeholder="Speciality (choose or type)"
                        className={`${field} pl-4`}
                      />
                      <datalist id="reg-spec">
                        {COMMON_SPECIALITIES.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                      <input
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="Qualification (e.g. MD, DM)"
                        className={`${field} pl-4`}
                      />
                      <input
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        placeholder="Hospital / clinic"
                        className={`${field} pl-4`}
                      />
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min={0}
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="Experience (yrs)"
                          className={`${field} pl-4`}
                        />
                        <input
                          type="number"
                          min={0}
                          value={fee}
                          onChange={(e) => setFee(e.target.value)}
                          placeholder="Fee (₹)"
                          className={`${field} pl-4`}
                        />
                      </div>
                    </div>
                  )}
                  {role === "patient" && (
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <CalendarDays
                          size={15}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="Age"
                          className={field}
                        />
                      </div>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none"
                      >
                        <option value="M" className="text-black">
                          Male
                        </option>
                        <option value="F" className="text-black">
                          Female
                        </option>
                        <option value="O" className="text-black">
                          Other
                        </option>
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className={field}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`${field} pr-11`}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                aria-label="Show password"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {isRegister && (
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className={field}
                  autoComplete="new-password"
                />
              </div>
            )}

            {isRegister && (
              <p className="text-white/40 text-xs text-center">
                Min. 6 characters, with letters and numbers.
              </p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-200 text-xs text-center bg-emerald-500/15 border border-emerald-400/30 rounded-lg px-3 py-2"
              >
                {info}
              </motion.p>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-300 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-70"
              style={{ background: primary }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? "Creating account..." : "Signing in..."}
                </span>
              ) : isRegister ? (
                `Create ${ROLE_LABEL[role]} Account`
              ) : (
                `Sign in as ${ROLE_LABEL[role]}`
              )}
            </motion.button>
          </form>

          {!isRegister && isDoctor && (
            <p className="text-white/40 text-xs text-center mt-4">
              Doctors: sign in, or tap{" "}
              <span className="font-semibold text-white/70">New? Register</span>{" "}
              to join the clinic. Admin can also add you.
            </p>
          )}
          {!isRegister && isAdmin && (
            <p className="text-white/40 text-xs text-center mt-4">
              Admin: manage doctors and route appointments. Default login:
              admin@DoseVia.com / Admin@1234, or register a new admin.
            </p>
          )}
          {!isRegister && role === "patient" && (
            <p className="text-white/40 text-xs text-center mt-4">
              First time here? Tap{" "}
              <span className="font-semibold text-white/70">New? Register</span>{" "}
              to create your account.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
