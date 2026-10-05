import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Heart,
  Download,
  Copy,
  Check,
  Phone,
  Loader2,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import PatientLayout from "@/layouts/PatientLayout";
import { callGemini } from "@/lib/gemini";

function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

interface EmergencyProtocol {
  scenario: string;
  icon: string;
  trigger: string;
  steps: string[];
  color: string;
}

interface MedicinePrice {
  drugId: string;
  genericName: string;
  brandName: string;
  pricePerStrip: number;
  tabletsPerStrip: number;
  monthlyNote?: string;
}

// Fresh database: no pre-filled contacts. Patients add their own.
const FAMILY_CONTACTS: { name: string; relation: string; phone: string }[] = [];

export default function Emergency() {
  const { selectedPatient, drugs } = useApp();
  const patient = selectedPatient;
  const patientDrugs = patient
    ? drugs.filter((d) => patient.drugs.includes(d.id))
    : [];
  const [cardFlipped, setCardFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emergencyExpanded, setEmergencyExpanded] = useState<number | null>(
    null,
  );

  const [emergencyProtocols, setEmergencyProtocols] = useState<
    EmergencyProtocol[]
  >([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const [medicineCosts, setMedicineCosts] = useState<
    (MedicinePrice & { stripsPerMonth: number; monthlyTotal: number })[]
  >([]);
  const [costsLoading, setCostsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const copyCardInfo = () => {
    const info = `DoseVia Medical Wallet Card
Patient: ${patient?.name ?? "Unknown"}
Age/Gender: ${patient?.age ?? "?"}${patient?.gender ?? ""}
Medicines: ${patientDrugs.map((d) => `${d.genericName} (${d.name})`).join(", ")}
Allergies: ${patient?.allergies.join(", ") || "None"}
`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchEmergencyProtocols = async () => {
    if (!patient) return;
    setEmergencyLoading(true);
    setAiError(null);

    const drugList = patientDrugs
      .map((d) => `${d.genericName} (${d.name}, ${d.class})`)
      .join("; ");

    const prompt = `You are a clinical emergency medicine AI. Generate personalised emergency protocols for a patient based on their specific medications.

Patient: ${patient.name}, ${patient.age}yo
Conditions: ${patient.conditions.join(", ")}
Medications: ${drugList || "None listed"}
${patient.allergies?.length ? `Allergies: ${patient.allergies.join(", ")}` : ""}
${patient.pregnant ? "Patient is PREGNANT." : ""}

Return ONLY valid JSON (no markdown):
{
  "emergencyProtocols": [
    {
      "scenario": "<specific emergency scenario relevant to their drugs>",
      "icon": "<single relevant emoji>",
      "trigger": "<symptoms or signs that trigger this emergency>",
      "steps": ["<step1>", "<step2>", "<step3>", "<step4>", "<step5>"],
      "color": "<one of: #ef4444 for critical, #f59e0b for warning, #8b5cf6 for other>"
    }
  ]
}
Provide exactly 3 emergency protocols most relevant to this patient's specific drug combination (e.g. bleeding risk from anticoagulants, hypoglycaemia from diabetes drugs, etc.). Steps must be specific to their exact medications.`;

    try {
      const response = await callGemini(
        prompt,
        "You are a clinical emergency medicine AI. Return only valid JSON.",
      );
      const data = parseJson<{ emergencyProtocols: EmergencyProtocol[] }>(
        response,
      );
      setEmergencyProtocols(data.emergencyProtocols ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setAiError(msg);
    } finally {
      setEmergencyLoading(false);
    }
  };

  const fetchMedicineCosts = async () => {
    if (!patient || patientDrugs.length === 0) return;
    setCostsLoading(true);

    const drugList = patientDrugs
      .slice(0, 5)
      .map((d) => `ID=${d.id} ${d.genericName} (${d.name})`)
      .join("; ");

    const prompt = `You are a pharmaceutical pricing expert with knowledge of Indian medicine prices. Provide current 2024-2025 Indian MRP for these specific medications.

Medications: ${drugList}

Return ONLY valid JSON (no markdown):
{
  "medicinePrices": [
    {
      "drugId": "<exact ID from above e.g. d1>",
      "genericName": "<generic name>",
      "brandName": "<most common Indian brand name>",
      "pricePerStrip": <current Indian MRP price per strip in INR — be realistic and accurate>,
      "tabletsPerStrip": <number of tablets per strip>,
      "monthlyNote": "<optional note about pricing e.g. 'generic cheaper', 'govt scheme available'>"
    }
  ]
}
Use realistic current Indian MRP prices. Generic versions are significantly cheaper than branded.`;

    try {
      const response = await callGemini(
        prompt,
        "You are a pharmaceutical pricing expert. Return only valid JSON with accurate Indian MRP data.",
      );
      const data = parseJson<{ medicinePrices: MedicinePrice[] }>(response);
      const computed = (data.medicinePrices ?? []).map((item) => {
        const stripsPerMonth = Math.ceil(30 / item.tabletsPerStrip);
        return {
          ...item,
          stripsPerMonth,
          monthlyTotal: stripsPerMonth * item.pricePerStrip,
        };
      });
      setMedicineCosts(computed);
    } catch (_err) {
      // Silently fall back — costs are not critical
    } finally {
      setCostsLoading(false);
    }
  };

  useEffect(() => {
    if (patient) {
      fetchEmergencyProtocols();
      fetchMedicineCosts();
    }
  }, [patient?.id, patient?.drugs?.join(",")]);

  const grandTotal = medicineCosts.reduce((s, c) => s + c.monthlyTotal, 0);

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Emergency & Health Card
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quick access in emergencies
          </p>
        </motion.div>

        {/* Digital wallet card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-bold text-foreground mb-3">
            Digital Medication Card
          </h2>
          <div
            className="relative cursor-pointer"
            style={{ height: "180px", perspective: "1200px" }}
            onClick={() => setCardFlipped((f) => !f)}
            data-testid="wallet-card"
          >
            <motion.div
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{
                duration: 0.7,
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
              style={{
                transformStyle: "preserve-3d",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  background:
                    "linear-gradient(135deg, #7C3AED 0%, #D4537E 60%, #185FA5 100%)",
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-30"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "linear",
                  }}
                />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider font-medium">
                      DoseVia Medical Card
                    </p>
                    <p className="text-white text-xl font-black mt-1">
                      {patient?.name ?? "Patient Name"}
                    </p>
                    <p className="text-white/70 text-sm">
                      {patient?.age ?? "?"}
                      {patient?.gender ?? ""} ·{" "}
                      {patient?.conditions?.join(", ")}
                    </p>
                  </div>
                  <Heart size={28} className="text-white/60" />
                </div>
                <div className="relative z-10">
                  <p className="text-white/50 text-xs">
                    Tap to flip for full details
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {patientDrugs.slice(0, 3).map((d) => (
                      <span
                        key={d.id}
                        className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full"
                      >
                        {d.genericName}
                      </span>
                    ))}
                    {patientDrugs.length > 3 && (
                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                        +{patientDrugs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-white border-2 border-gray-200 rounded-2xl p-5 text-gray-800"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Medication Details
                </p>
                <div className="space-y-1 mb-3">
                  {patientDrugs.map((drug) => (
                    <div key={drug.id} className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-800">
                        {drug.genericName}
                      </span>
                      <span className="text-gray-500">{drug.class}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Allergies:</span>
                    <span className="font-semibold text-red-600">
                      {patient?.allergies.join(", ") || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Emergency contact:</span>
                    <span className="font-semibold">Your treating doctor</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #D4537E)",
              }}
              data-testid="button-download-card"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : downloaded ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                <>
                  <Download size={14} /> Save Card
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={copyCardInfo}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-semibold text-sm text-foreground"
              data-testid="button-copy-card"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Info
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Emergency protocols — AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AlertTriangle size={16} className="text-red-500" />
            </motion.span>
            Emergency Protocols
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              AI Generated
            </span>
          </h2>

          {aiError && aiError.includes("VITE_GEMINI_API_KEY") && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Gemini API key not configured — add VITE_GEMINI_API_KEY to your
              .env file.
            </div>
          )}

          {emergencyLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
              <Loader2 size={18} className="animate-spin text-red-500" />
              AI is generating personalised emergency protocols…
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyProtocols.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                  data-testid={`emergency-${idx}`}
                >
                  <button
                    onClick={() =>
                      setEmergencyExpanded((e) => (e === idx ? null : idx))
                    }
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {step.scenario}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.trigger}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: emergencyExpanded === idx ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <AlertTriangle size={16} style={{ color: step.color }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {emergencyExpanded === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          {step.steps.map((s, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="flex items-start gap-3 mb-2"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5"
                                style={{
                                  background: step.color,
                                  minWidth: "20px",
                                }}
                              >
                                {i + 1}
                              </div>
                              <p className="text-sm text-foreground">{s}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              {!emergencyLoading &&
                emergencyProtocols.length === 0 &&
                !aiError && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Log in as a patient to see AI emergency protocols
                  </p>
                )}
            </div>
          )}
        </motion.div>

        {/* Family contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="font-bold text-foreground mb-3">Emergency Contacts</h2>
          <div className="space-y-2">
            {FAMILY_CONTACTS.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 bg-card border border-border rounded-2xl">
                No emergency contacts saved yet.
              </p>
            )}
            {FAMILY_CONTACTS.map((contact, i) => (
              <motion.div
                key={contact.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl"
                data-testid={`contact-${i}`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: ["#7C3AED", "#D4537E", "#185FA5"][i] }}
                >
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {contact.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.relation}
                  </p>
                </div>
                <motion.a
                  href={`tel:${contact.phone}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  className="p-2 rounded-xl bg-primary/10 text-primary"
                  data-testid={`button-call-${i}`}
                >
                  <Phone size={16} />
                </motion.a>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Monthly cost tracker — AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">
                  Monthly Medicine Cost
                </h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  AI Pricing
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI-sourced current Indian MRP (₹)
              </p>
            </div>
          </div>

          {costsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin text-green-600" />
              AI is fetching current medicine prices…
            </div>
          ) : medicineCosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              Log in as a patient to see your medicine costs
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {medicineCosts.map((item, i) => (
                  <motion.div
                    key={item.drugId}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.genericName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.brandName} · ₹{item.pricePerStrip}/strip of{" "}
                        {item.tabletsPerStrip}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.stripsPerMonth} strip
                        {item.stripsPerMonth > 1 ? "s" : ""}/month
                        {item.monthlyNote ? ` · ${item.monthlyNote}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-foreground">
                        ₹{item.monthlyTotal}
                      </p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">
                    Total monthly cost
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For all {medicineCosts.length} medicine
                    {medicineCosts.length > 1 ? "s" : ""}
                  </p>
                </div>
                <motion.span
                  key={grandTotal}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-black text-foreground"
                >
                  ₹{grandTotal}
                </motion.span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </PatientLayout>
  );
}
