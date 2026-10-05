import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Download,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { computeRisk } from "@/lib/interactions";
import DoctorLayout from "@/layouts/DoctorLayout";
import { callGemini, toGeminiHistory } from "@/lib/gemini";

const QUICK_ACTIONS = [
  "Find safer alternative to this combination",
  "Explain this combination in patient language",
  "What monitoring schedule is recommended?",
  "Generate patient education letter",
  "Check for pregnancy safety",
];

const RISK_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};
const CYP_INTERACTIONS: Record<string, string[]> = {
  CYP3A4: ["d2", "d7", "d8", "d14", "d20"],
  CYP2C9: ["d3", "d7", "d15", "d18", "d19"],
  CYP2D6: ["d9", "d11"],
  CYP2C19: ["d11", "d12", "d16"],
  CYP1A2: ["d20"],
};

function riskScore(
  drugIds: string[],
  allDrugs: { id: string; cyp: string[]; pregnancyCategory: string }[],
) {
  const selected = allDrugs.filter((d) => drugIds.includes(d.id));
  const allCyp = selected.flatMap((d) => d.cyp);
  const counts: Record<string, number> = {};
  allCyp.forEach((c) => {
    counts[c] = (counts[c] ?? 0) + 1;
  });
  const conflicts = Object.values(counts).filter((n) => n > 1);
  const hasX = selected.some((d) => d.pregnancyCategory === "X");
  const score = Math.min(
    100,
    18 +
      conflicts.reduce((s, c) => s + c * 18, 0) +
      (hasX ? 15 : 0) +
      (drugIds.length - 2) * 8,
  );
  const level =
    score >= 70
      ? "Critical"
      : score >= 50
        ? "High"
        : score >= 30
          ? "Medium"
          : "Low";
  const conflictEnzymes = Object.entries(counts)
    .filter(([, c]) => c > 1)
    .map(([e]) => e);
  return { score, level, conflictEnzymes };
}

export default function Report() {
  const { patients, drugs: allDrugs, analysisPatientId, user } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState(
    analysisPatientId ?? "",
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const patient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0] ?? null;
  const patientDrugs = allDrugs.filter((d) => patient?.drugs?.includes(d.id));
  const { score, level, conflictEnzymes } = patient
    ? riskScore(patient.drugs, allDrugs)
    : { score: 0, level: "N/A", conflictEnzymes: [] as string[] };
  const riskColor = RISK_COLORS[level] ?? "#9ca3af";
  const doctorName = user?.name ?? "Doctor";

  const systemPrompt = patient
    ? `You are a clinical AI co-pilot assistant for ${doctorName}, a medical doctor.
Patient: ${patient.name}, ${patient.age} years, ${patient.gender === "M" ? "Male" : "Female"}.
Conditions: ${patient.conditions.join(", ")}.
Current medications: ${patientDrugs.map((d) => `${d.name} (${d.genericName})`).join(", ")}.
Kidney function: ${patient.kidneyFunction}%, Liver function: ${patient.liverFunction}%.
Allergies: ${patient.allergies.join(", ") || "None"}.
Overall risk: ${level} (${score}/100).
CYP450 conflicts: ${conflictEnzymes.join(", ") || "None detected"}.
${patient.pregnant ? "Patient is pregnant." : ""}

Respond with clinical precision, evidence-based recommendations, and structured formatting.
Use **bold** for key terms and action items. Be concise but thorough.`
    : "You are a clinical AI assistant. No patient selected yet.";

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = toGeminiHistory(messages);
      const response = await callGemini(text, systemPrompt, history);
      setMessages((m) => [...m, { role: "ai", text: response }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setMessages((m) => [...m, { role: "ai", text: `⚠️ ${message}` }]);
    } finally {
      setLoading(false);
      setTimeout(
        () => chatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }),
        100,
      );
    }
  };

  const copyReport = async () => {
    const text = `DoseVia CLINICAL RISK REPORT\nPatient: ${patient?.name}\nDate: ${new Date().toLocaleDateString()}\nDrugs: ${patientDrugs.map((d) => d.genericName).join(", ")}\nRisk: ${level} (${score}/100)\nCYP Conflicts: ${conflictEnzymes.join(", ") || "None"}\nDoctor: ${doctorName}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <DoctorLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              AI Co-Pilot & Clinical Report
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {patient
                ? `Report linked to ${patient.name} — selected in Analysis page`
                : "Select a patient to generate their clinical report"}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDropdown((d) => !d)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/50 transition-colors min-w-48"
            >
              <span>{patient?.name ?? "Select patient…"}</span>
              {showDropdown ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 4 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 top-full z-50 bg-card border border-border rounded-xl shadow-2xl min-w-56 overflow-hidden"
                >
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setShowDropdown(false);
                        setMessages([]);
                        setError(null);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/8 border-b border-border/40 last:border-0 ${p.id === selectedPatientId ? "bg-primary/5 font-semibold" : ""}`}
                    >
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.drugs.length} drugs · {computeRisk(p, allDrugs)} risk
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* API key warning */}
        {error && error.includes("VITE_GEMINI_API_KEY") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Gemini API key not configured</p>
              <p className="text-xs mt-1">
                Add{" "}
                <code className="bg-amber-100 px-1 rounded">
                  VITE_GEMINI_API_KEY=your_key
                </code>{" "}
                to your <code className="bg-amber-100 px-1 rounded">.env</code>{" "}
                file or Replit Secrets, then restart the dev server.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AI Chat */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden flex flex-col h-[520px]"
          >
            <div className="p-4 border-b border-border flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #185FA5, #0F6E56)",
                }}
              >
                <span className="text-white text-xs font-bold">AI</span>
              </motion.div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Clinical AI Co-Pilot
                </p>
                <p className="text-xs text-muted-foreground">
                  {patient
                    ? `Analysing ${patient.name}'s combination`
                    : "Select a patient"}
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-3 border-b border-border flex gap-2 flex-wrap">
              {QUICK_ACTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="text-4xl">🤖</div>
                  <p className="text-sm font-medium text-foreground">
                    Ask me anything about {patient?.name ?? "this patient"}'s
                    combination
                  </p>
                  <p className="text-xs text-muted-foreground">
                    I'll provide clinical reasoning, alternatives, and
                    monitoring plans
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}
                    style={
                      m.role === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, #185FA5, #0F6E56)",
                          }
                        : {}
                    }
                  >
                    {m.text
                      .split("**")
                      .map((chunk, ci) =>
                        ci % 2 === 1 ? (
                          <strong key={ci}>{chunk}</strong>
                        ) : (
                          <span key={ci}>{chunk}</span>
                        ),
                      )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="w-2 h-2 rounded-full bg-muted-foreground"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !loading &&
                  sendMessage(input)
                }
                placeholder="Ask about interactions, alternatives, monitoring..."
                disabled={loading}
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #185FA5, #0F6E56)",
                }}
              >
                <Send size={14} />
              </motion.button>
            </div>
          </motion.div>

          {/* Clinical Report */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden flex flex-col h-[520px]"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <p className="text-sm font-bold text-foreground">
                  Clinical Risk Report
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  {copied ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #185FA5, #0F6E56)",
                  }}
                >
                  <Download size={12} />
                  PDF
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!patient ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <FileText size={32} className="opacity-30" />
                  <p className="text-sm">
                    Select a patient to generate their clinical report
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="border-b border-border pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #185FA5, #0F6E56)",
                        }}
                      >
                        {patient.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {patient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {patient.age} years ·{" "}
                          {patient.gender === "M" ? "Male" : "Female"} ·{" "}
                          {patient.conditions.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Report by: {doctorName}</span>
                      <span>·</span>
                      <span>
                        {new Date().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Risk */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{
                      borderColor: `${riskColor}40`,
                      background: `${riskColor}08`,
                    }}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Overall Risk Score
                      </p>
                      <p
                        className="text-2xl font-black"
                        style={{ color: riskColor }}
                      >
                        {level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-3xl font-black"
                        style={{ color: riskColor }}
                      >
                        {score}
                      </p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>

                  {/* Drug list */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Current Medications ({patientDrugs.length})
                    </p>
                    <div className="space-y-1.5">
                      {patientDrugs.map((d, i) => (
                        <motion.div
                          key={d.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg"
                        >
                          <div>
                            <span className="text-sm font-semibold text-foreground">
                              {d.name}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {d.genericName}
                            </span>
                          </div>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {d.class}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CYP conflicts */}
                  {conflictEnzymes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        CYP450 Conflicts Detected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {conflictEnzymes.map((e) => (
                          <span
                            key={e}
                            className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Organ function */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Organ Function
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: "Kidney Function",
                          val: patient.kidneyFunction,
                        },
                        { label: "Liver Function", val: patient.liverFunction },
                      ].map(({ label, val }) => {
                        const c =
                          val >= 70
                            ? "#22c55e"
                            : val >= 50
                              ? "#f59e0b"
                              : "#ef4444";
                        return (
                          <div
                            key={label}
                            className="p-3 rounded-xl bg-muted/40"
                          >
                            <p className="text-xs text-muted-foreground">
                              {label}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: c }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${val}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                              <span
                                className="text-xs font-bold"
                                style={{ color: c }}
                              >
                                {val}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Clinical Recommendations
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {[
                        level === "Critical" || level === "High"
                          ? "⚠️ Urgent medication review within 1 week"
                          : "✅ Routine review in 4 weeks",
                        conflictEnzymes.length > 0
                          ? `🔬 CYP450 conflicts on ${conflictEnzymes.join(", ")} — consider dose adjustment`
                          : "✅ No CYP450 conflicts detected",
                        patient.kidneyFunction < 60
                          ? `🫘 Kidney function low (${patient.kidneyFunction}%) — adjust renally-cleared drugs`
                          : `✅ Kidney function adequate (${patient.kidneyFunction}%)`,
                        patient.liverFunction < 70
                          ? `🩺 Liver function low (${patient.liverFunction}%) — monitor hepatically-metabolised drugs`
                          : `✅ Liver function adequate (${patient.liverFunction}%)`,
                        patient.pregnant
                          ? "🤰 Pregnancy — review Category C/D/X drugs with urgency"
                          : "",
                        patient.allergies.length > 0
                          ? `⚠️ Known allergies: ${patient.allergies.join(", ")} — verify no cross-reactions`
                          : "",
                      ]
                        .filter(Boolean)
                        .map((rec, i) => (
                          <div key={i} className="p-2 bg-muted/40 rounded-lg">
                            {rec}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DoctorLayout>
  );
}
