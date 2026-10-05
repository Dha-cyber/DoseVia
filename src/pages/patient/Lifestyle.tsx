import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import PatientLayout from "@/layouts/PatientLayout";
import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import { Drug } from "@/lib/drugData";
import { callGemini } from "@/lib/gemini";

function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

interface AvoidFood {
  name: string;
  reason: string;
  emoji: string;
}
interface GoodFood {
  name: string;
  reason: string;
  emoji: string;
}
interface ExerciseItem {
  label: string;
  emoji: string;
  ok: boolean;
  note?: string;
}

interface AiLifestyle {
  avoidFoods: AvoidFood[];
  goodFoods: GoodFood[];
  exercises: ExerciseItem[];
}

function RefillRow({
  drug,
  tabletCount,
  refillCount,
  pct,
  statusColor,
}: {
  drug: Drug;
  tabletCount: number;
  refillCount: number;
  pct: number;
  statusColor: string;
}) {
  const [tablets, setTablets] = useState(tabletCount);
  const [refill, setRefill] = useState(refillCount);

  const save = (t: number, r: number) => {
    const tv = Math.max(0, t);
    const rv = Math.max(0, r);
    setTablets(tv);
    setRefill(rv);
    setLocalStorage(`DoseVia_refill_${drug.id}`, { tablets: tv, refill: rv });
  };

  const total = tablets + refill;
  const p = total > 0 ? Math.min((tablets / total) * 100, 100) : 0;
  const sc = tablets <= 5 ? "#ef4444" : tablets <= 14 ? "#f59e0b" : "#22c55e";

  return (
    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
      <p className="text-sm font-semibold text-foreground">
        {drug.genericName}{" "}
        <span className="text-xs text-muted-foreground font-normal">
          ({drug.name})
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tablets on hand</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => save(tablets - 1, refill)}
              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              value={tablets}
              onChange={(e) => save(Number(e.target.value), refill)}
              className="w-14 text-center text-sm font-bold border border-border rounded-lg py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => save(tablets + 1, refill)}
              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Refill qty (ordered)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => save(tablets, refill - 1)}
              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              value={refill}
              onChange={(e) => save(tablets, Number(e.target.value))}
              className="w-14 text-center text-sm font-bold border border-border rounded-lg py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => save(tablets, refill + 1)}
              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">
          {tablets} tablets left · {refill} on order
        </span>
        <span className="font-bold" style={{ color: sc }}>
          {tablets <= 5
            ? "⚠ Refill now!"
            : tablets <= 14
              ? "Running low"
              : "Well stocked"}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: sc }}
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function Lifestyle() {
  const { selectedPatient, drugs: allDrugs } = useApp();
  const [expandedSection, setExpandedSection] = useState<string>("food");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLifestyle, setAiLifestyle] = useState<AiLifestyle | null>(null);

  const patient = selectedPatient;
  const firstName = patient?.name.split(" ")[0] ?? "there";
  const patientDrugs = allDrugs.filter((d) => patient?.drugs.includes(d.id));

  const sectionToggle = (s: string) =>
    setExpandedSection((prev) => (prev === s ? "" : s));

  const fetchAiLifestyle = async () => {
    if (!patient) return;
    setAiLoading(true);
    setAiError(null);

    const drugList = patientDrugs
      .map((d) => `${d.genericName} (${d.name}, class: ${d.class})`)
      .join("; ");

    const prompt = `You are a clinical nutritionist and exercise physiologist AI specialising in polypharmacy patients.

Patient: ${patient.name}, ${patient.age}yo, ${patient.gender === "M" ? "Male" : "Female"}
Conditions: ${patient.conditions.join(", ")}
Current medications: ${drugList || "None listed"}
Kidney function: ${patient.kidneyFunction}%
Liver function: ${patient.liverFunction}%
${patient.pregnant ? "Patient is PREGNANT." : ""}
${patient.allergies?.length ? `Allergies: ${patient.allergies.join(", ")}` : ""}

Provide highly personalised lifestyle guidance considering ALL drug interactions and organ function. Return ONLY valid JSON (no markdown):
{
  "avoidFoods": [
    {"name": "<food>", "reason": "<specific clinical reason referencing their exact drugs/conditions>", "emoji": "<emoji>"}
  ],
  "goodFoods": [
    {"name": "<food>", "reason": "<specific clinical reason>", "emoji": "<emoji>"}
  ],
  "exercises": [
    {"label": "<exercise>", "emoji": "<emoji>", "ok": <true|false>, "note": "<brief reason>"}
  ]
}
Include 5-6 avoidFoods, 5-6 goodFoods, and 6-7 exercises. Be specific to this patient's exact drug combination and organ function — not generic advice.`;

    try {
      const response = await callGemini(
        prompt,
        "You are a clinical nutritionist and exercise physiologist. Return only valid JSON.",
      );
      const data = parseJson<AiLifestyle>(response);
      setAiLifestyle(data);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (patient) {
      fetchAiLifestyle();
    }
  }, [patient?.id, patient?.drugs?.join(",")]);

  const avoidFoods = aiLifestyle?.avoidFoods ?? [];
  const goodFoods = aiLifestyle?.goodFoods ?? [];
  const exercises = aiLifestyle?.exercises ?? [];

  const LoadingPlaceholder = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
      <Loader2 size={16} className="animate-spin text-primary" />
      {message}
    </div>
  );

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-foreground">
                Lifestyle & Wellness
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {patient
                  ? `AI-personalised for ${firstName} · ${patient.conditions.join(", ")} · ${patientDrugs.length} medication${patientDrugs.length !== 1 ? "s" : ""}`
                  : "Log in to see your personalised plan"}
              </p>
            </div>
            {patient && (
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6 }}
                onClick={fetchAiLifestyle}
                disabled={aiLoading}
                className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
              </motion.button>
            )}
          </div>
          {patient && (
            <div className="flex gap-2 flex-wrap mt-2">
              {patientDrugs.map((d) => (
                <span
                  key={d.id}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                >
                  {d.name}
                </span>
              ))}
            </div>
          )}
          {aiError && (
            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {aiError.includes("VITE_GEMINI_API_KEY")
                ? "Gemini API key not configured — add VITE_GEMINI_API_KEY to your .env file."
                : aiError}
            </div>
          )}
        </motion.div>

        {/* Foods to avoid — AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => sectionToggle("food")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">Foods to Avoid</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {patient
                  ? `Based on ${firstName}'s conditions: ${patient.conditions.join(", ")}`
                  : "Log in to see your personalised list"}
              </p>
            </div>
            {expandedSection === "food" ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === "food" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 space-y-2">
                  {aiLoading ? (
                    <LoadingPlaceholder message="AI is generating your personalised food guidance…" />
                  ) : avoidFoods.length > 0 ? (
                    avoidFoods.map((food, i) => (
                      <motion.div
                        key={food.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <span className="text-xl shrink-0">{food.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            {food.name}
                          </p>
                          <p className="text-xs text-red-600 mt-0.5">
                            {food.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Log in as a patient to see personalised food guidance
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Foods to eat — AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => sectionToggle("good")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">
                  Foods That Help You
                </h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Foods that work with your medicines to support your health
              </p>
            </div>
            {expandedSection === "good" ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === "good" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 space-y-2">
                  {aiLoading ? (
                    <LoadingPlaceholder message="AI is generating your personalised food guidance…" />
                  ) : goodFoods.length > 0 ? (
                    goodFoods.map((food, i) => (
                      <motion.div
                        key={food.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl"
                      >
                        <span className="text-xl shrink-0">{food.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            {food.name}
                          </p>
                          <p className="text-xs text-green-600 mt-0.5">
                            {food.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Log in to see personalised food recommendations
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Exercise guide — AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-card/80 border border-border rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => sectionToggle("exercise")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">
                  Exercise Guide for {firstName}
                </h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                What to do and what to avoid based on your conditions and
                medications
              </p>
            </div>
            {expandedSection === "exercise" ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === "exercise" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 space-y-2">
                  {aiLoading ? (
                    <LoadingPlaceholder message="AI is generating your personalised exercise guide…" />
                  ) : exercises.length > 0 ? (
                    exercises.map((ex, i) => (
                      <motion.div
                        key={ex.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${ex.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                      >
                        <span className="text-xl shrink-0">{ex.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold ${ex.ok ? "text-green-800" : "text-red-800"}`}
                            >
                              {ex.label}
                            </p>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${ex.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {ex.ok ? "✓ Good" : "✗ Avoid"}
                            </span>
                          </div>
                          {ex.note && (
                            <p
                              className={`text-xs mt-0.5 ${ex.ok ? "text-green-600" : "text-red-600"}`}
                            >
                              {ex.note}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Log in to see exercise guidance
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Refill tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-foreground">Refill Tracker</h2>
              <p className="text-xs text-muted-foreground">
                Enter your current tablet count &amp; refill quantity
              </p>
            </div>
            <RefreshCw size={15} className="text-muted-foreground" />
          </div>
          {patientDrugs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Log in to manage your refill tracker
            </p>
          )}
          <div className="space-y-4">
            {patientDrugs.slice(0, 4).map((drug) => {
              const storedRaw = getLocalStorage<{
                tablets: number;
                refill: number;
              }>(`DoseVia_refill_${drug.id}`);
              const stored = storedRaw ?? { tablets: 0, refill: 0 };
              const tabletCount = stored.tablets;
              const refillCount = stored.refill;
              const total = tabletCount + refillCount;
              const pct =
                total > 0 ? Math.min((tabletCount / total) * 100, 100) : 0;
              const statusColor =
                tabletCount <= 5
                  ? "#ef4444"
                  : tabletCount <= 14
                    ? "#f59e0b"
                    : "#22c55e";
              return (
                <RefillRow
                  key={drug.id}
                  drug={drug}
                  tabletCount={tabletCount}
                  refillCount={refillCount}
                  pct={pct}
                  statusColor={statusColor}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
