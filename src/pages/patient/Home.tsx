import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flame, Plus, X, Clock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import PatientLayout from "@/layouts/PatientLayout";
import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import confetti from "canvas-confetti";

// Default dose times by drug ID
const DRUG_DOSE_TIMES: Record<
  string,
  { time: string; hour: number; label: string }
> = {
  d1: { time: "08:00", hour: 8, label: "With breakfast" },
  d2: { time: "09:00", hour: 9, label: "Morning" },
  d3: { time: "13:00", hour: 13, label: "After lunch" },
  d4: { time: "07:00", hour: 7, label: "Empty stomach (30 min before eating)" },
  d5: { time: "09:00", hour: 9, label: "With food" },
  d6: { time: "10:00", hour: 10, label: "With food" },
  d7: { time: "18:00", hour: 18, label: "Same time every day" },
  d8: { time: "21:00", hour: 21, label: "Evening" },
  d9: { time: "08:00", hour: 8, label: "With food" },
  d10: { time: "08:00", hour: 8, label: "Morning" },
  d11: { time: "09:00", hour: 9, label: "With breakfast" },
  d12: { time: "07:30", hour: 7.5, label: "30 min before breakfast" },
  d13: { time: "08:00", hour: 8, label: "With food" },
  d14: { time: "08:00", hour: 8, label: "As needed" },
  d15: { time: "13:00", hour: 13, label: "After food" },
  d16: { time: "07:30", hour: 7.5, label: "Before breakfast" },
  d17: { time: "08:00", hour: 8, label: "Morning" },
  d18: { time: "09:00", hour: 9, label: "Morning" },
  d19: { time: "07:30", hour: 7.5, label: "With breakfast" },
  d20: { time: "08:00", hour: 8, label: "With food" },
};

const MOOD_DATA = [
  {
    emoji: "😢",
    label: "Very Sad",
    shortMsg: "Sending you strength",
    fullMsg:
      "It's okay to have hard days. Your body is working hard managing multiple medications. Take it one hour at a time — rest, hydrate, and if things feel very low, please reach out to your doctor.",
    color: "#6366f1",
    tip: "Try a 5-minute breathing exercise — breathe in for 4 counts, hold for 4, out for 6.",
  },
  {
    emoji: "😟",
    label: "Not Great",
    shortMsg: "You're doing your best",
    fullMsg:
      "Feeling off is normal when managing a health condition. Make sure you've taken all your medicines today — sometimes missing a dose can affect how you feel. Small things like sunlight and a short walk really help.",
    color: "#f59e0b",
    tip: "Have you had enough water today? Dehydration worsens most symptoms.",
  },
  {
    emoji: "😐",
    label: "Okay",
    shortMsg: "Steady is good!",
    fullMsg:
      "An okay day is a stable day — and stability is important for your health. Your medicines are doing their job keeping things in check. Keep your routine going.",
    color: "#94a3b8",
    tip: "A consistent daily routine helps your body know when to expect your medications.",
  },
  {
    emoji: "😊",
    label: "Good",
    shortMsg: "That's wonderful to hear!",
    fullMsg:
      "Feeling good is a sign your medicines are working and your body is responding well. Keep up your healthy habits — they're making a real difference!",
    color: "#22c55e",
    tip: "On good days, gentle exercise can boost your mood further and help with circulation.",
  },
  {
    emoji: "😄",
    label: "Great!",
    shortMsg: "You're thriving! 🌟",
    fullMsg:
      "You're feeling great and that's amazing! Your dedication to taking your medicines consistently is paying off. Share this energy with someone you love today.",
    color: "#7C3AED",
    tip: "Celebrate this good day — call a friend, take a walk outside, or treat yourself to something you enjoy.",
  },
];

const MILESTONE_MESSAGES: Record<number, string> = {
  7: "🔥 7-day streak! One whole week of consistent medication — incredible discipline!",
  14: "⚡ 14-day streak! Two weeks strong! Your health is getting better every day.",
  30: "🏆 30-day streak! A whole month! You are an absolute champion of your health!",
};

export default function Home() {
  const { selectedPatient, drugs: allDrugs } = useApp();
  const [taken, setTaken] = useState<string[]>(
    () => getLocalStorage<string[]>("DoseVia_taken_today") ?? [],
  );
  const [streak, setStreak] = useState<number>(
    () => getLocalStorage<number>("DoseVia_streak") ?? 7,
  );
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [milestoneMsg, setMilestoneMsg] = useState("");
  const [showAddMed, setShowAddMed] = useState(false);
  const [addNote, setAddNote] = useState("");

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 5
      ? "Good night"
      : currentHour < 12
        ? "Good morning"
        : currentHour < 17
          ? "Good afternoon"
          : currentHour < 21
            ? "Good evening"
            : "Good night";
  const firstName = selectedPatient?.name.split(" ")[0] ?? "there";

  // Build medicine list from doctor's DB for this patient
  const patientMedIds = selectedPatient?.drugs ?? [];
  const meds = patientMedIds
    .map((id) => {
      const drug = allDrugs.find((d) => d.id === id);
      const schedule = DRUG_DOSE_TIMES[id] ?? {
        time: "08:00",
        hour: 8,
        label: "As directed",
      };
      return {
        id,
        name: drug ? `${drug.name} (${drug.genericName})` : id,
        genericName: drug?.genericName ?? id,
        schedule,
      };
    })
    .sort((a, b) => a.schedule.hour - b.schedule.hour);

  const markTaken = (medId: string) => {
    if (taken.includes(medId)) return;
    const newTaken = [...taken, medId];
    setTaken(newTaken);
    setLocalStorage("DoseVia_taken_today", newTaken);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#7C3AED", "#D4537E", "#a78bfa"],
      scalar: 0.8,
    });
    if (newTaken.length === meds.length) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLocalStorage("DoseVia_streak", newStreak);
      const msg = MILESTONE_MESSAGES[newStreak];
      if (msg) setMilestoneMsg(msg);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#7C3AED", "#D4537E", "#f59e0b"],
        scalar: 1,
      });
    }
  };

  const markLate = (medId: string) => {
    markTaken(medId);
    setAddNote(
      `Logged ${allDrugs.find((d) => d.id === medId)?.genericName ?? medId} as taken late at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    );
  };

  const allDone = meds.length > 0 && taken.length >= meds.length;
  const nextMed = meds.find((m) => !taken.includes(m.id));

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-6">
        {/* Milestone toast */}
        <AnimatePresence>
          {milestoneMsg && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-semibold text-sm shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #D4537E)",
              }}
              onClick={() => setMilestoneMsg("")}
            >
              {milestoneMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-black text-foreground">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {allDone
              ? "✅ All medicines taken today — excellent work!"
              : nextMed
                ? `Next: ${nextMed.genericName} at ${nextMed.schedule.time}`
                : "Your daily health overview"}
          </p>
        </motion.div>

        {/* Streak + appointment cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-card/80 border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame
                  size={20}
                  style={{ color: streak >= 7 ? "#f97316" : "#94a3b8" }}
                />
              </motion.div>
              <span className="text-xs font-semibold text-muted-foreground">
                Day Streak
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">
              {streak >= 30
                ? "🏆 Champion!"
                : streak >= 14
                  ? "⚡ Keep going!"
                  : streak >= 7
                    ? "🔥 Great work!"
                    : "Build your streak!"}
            </p>
          </div>
          <div className="bg-card/80 border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} style={{ color: "#7C3AED" }} />
              <span className="text-xs font-semibold text-muted-foreground">
                Next Visit
              </span>
            </div>
            <p className="text-xl font-black text-foreground">3 days</p>
            <p className="text-xs text-muted-foreground">Regular check-up</p>
          </div>
        </motion.div>

        {/* Today's medicines — from doctor's DB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-bold text-foreground">Today's Medicines</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedPatient
                  ? `Prescribed by your doctor for ${firstName}`
                  : "Log in as a patient to see your medicines"}
                {" · "}
                {taken.length}/{meds.length} taken
              </p>
            </div>
            <button
              onClick={() => setShowAddMed((s) => !s)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #D4537E)",
              }}
              data-testid="btn-add-med"
            >
              {showAddMed ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {/* Add missed / extra medicine panel */}
          <AnimatePresence>
            {showAddMed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                  <p className="text-xs font-semibold text-purple-700 mb-2">
                    Log a medicine not on your list (e.g. paracetamol for pain)
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={addNote}
                      onChange={(e) => setAddNote(e.target.value)}
                      placeholder="Medicine name and dose..."
                      className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      data-testid="input-add-med"
                    />
                    <button
                      onClick={() => {
                        if (addNote.trim()) {
                          setAddNote("");
                          setShowAddMed(false);
                        }
                      }}
                      className="px-3 py-2 text-xs rounded-xl text-white font-semibold"
                      style={{ background: "#7C3AED" }}
                    >
                      Log
                    </button>
                  </div>
                  <p className="text-xs text-purple-500 mt-1.5">
                    This note is saved locally for your reference
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 space-y-3">
            {meds.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No medicines in your profile yet. Your doctor will add them and
                they'll appear here automatically.
              </p>
            )}
            {meds.map((med, i) => {
              const isTaken = taken.includes(med.id);
              const isMissed = !isTaken && currentHour > med.schedule.hour + 2;
              return (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isTaken ? "opacity-60" : ""} ${isMissed ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border"}`}
                  data-testid={`med-${med.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: isTaken
                        ? "#22c55e20"
                        : isMissed
                          ? "#f59e0b20"
                          : "rgba(124,58,237,0.1)",
                    }}
                  >
                    💊
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {med.genericName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {med.schedule.time} · {med.schedule.label}
                      </p>
                    </div>
                    {isMissed && !isTaken && (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">
                        ⚠ Scheduled time passed
                      </p>
                    )}
                    {isTaken && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        ✓ Taken today
                      </p>
                    )}
                  </div>
                  {!isTaken ? (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => markTaken(med.id)}
                        className="text-xs px-3 py-1.5 rounded-xl text-white font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #7C3AED, #D4537E)",
                        }}
                        data-testid={`take-${med.id}`}
                      >
                        Take now
                      </motion.button>
                      {isMissed && (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => markLate(med.id)}
                          className="text-xs px-3 py-1.5 rounded-xl border border-amber-400 text-amber-700 font-medium bg-white"
                          data-testid={`take-late-${med.id}`}
                        >
                          Log late
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0"
                    >
                      <span className="text-green-600 text-sm font-bold">
                        ✓
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {allDone && meds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="p-3 rounded-xl text-white text-center font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #D4537E)",
                }}
              >
                🎉 All done for today! Amazing, {firstName}!
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Mood check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-card/80 border border-border rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-1">
            How are you feeling today?
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Tap a face — we'll give you personalised advice
          </p>
          <div className="flex justify-around mb-4">
            {MOOD_DATA.map((mood, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedMood(i)}
                className="flex flex-col items-center gap-1.5"
                data-testid={`mood-${i}`}
              >
                <motion.span
                  animate={
                    selectedMood === i
                      ? { scale: [1, 1.3, 1.15], rotate: [-5, 5, 0] }
                      : { scale: 1 }
                  }
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-3xl"
                  style={{
                    filter: selectedMood === i ? "none" : "grayscale(0.5)",
                  }}
                >
                  {mood.emoji}
                </motion.span>
                <span
                  className="text-xs font-medium"
                  style={{ color: selectedMood === i ? mood.color : "#9ca3af" }}
                >
                  {mood.label}
                </span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {selectedMood !== null && (
              <motion.div
                key={selectedMood}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="p-4 rounded-2xl border"
                style={{
                  background: `${MOOD_DATA[selectedMood].color}10`,
                  borderColor: `${MOOD_DATA[selectedMood].color}30`,
                }}
              >
                <p
                  className="font-bold text-sm mb-1"
                  style={{ color: MOOD_DATA[selectedMood].color }}
                >
                  {MOOD_DATA[selectedMood].emoji}{" "}
                  {MOOD_DATA[selectedMood].shortMsg}
                </p>
                <p className="text-sm text-foreground leading-relaxed mb-2">
                  {MOOD_DATA[selectedMood].fullMsg}
                </p>
                <div className="p-2 rounded-xl bg-white/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">💡 Tip: </span>
                    {MOOD_DATA[selectedMood].tip}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
