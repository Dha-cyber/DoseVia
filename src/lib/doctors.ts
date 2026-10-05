// Fixed roster of 20 clinic doctors. Each can sign in with the email + password below.
export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // only used for the built-in seed doctors (never stored in the doctor list)
  speciality: string;
  qualification: string;
  experience: number; // years
  hospital: string;
  languages: string[];
  fee: number; // INR
  rating: number;
  about: string;
  color: string; // avatar accent
}

export const SEED_DOCTORS: DoctorProfile[] = [
  {
    id: "doc_01",
    name: "Dr. Anil Verma",
    email: "anil.verma@DoseVia.com",
    password: "Anil@1234",
    speciality: "Cardiologist",
    qualification: "MD, DM (Cardiology)",
    experience: 18,
    hospital: "DoseVia Heart Centre, Bengaluru",
    languages: ["English", "Hindi", "Kannada"],
    fee: 900,
    rating: 4.9,
    about:
      "Treats blood pressure, heart failure, arrhythmias and drug interactions of cardiac medicines.",
    color: "#e11d48",
  },
  {
    id: "doc_02",
    name: "Dr. Priya Nair",
    email: "priya.nair@DoseVia.com",
    password: "Priya@1234",
    speciality: "Endocrinologist",
    qualification: "MD, DM (Endocrinology)",
    experience: 14,
    hospital: "DoseVia Diabetes Institute",
    languages: ["English", "Malayalam", "Tamil"],
    fee: 800,
    rating: 4.8,
    about:
      "Diabetes, thyroid disorders, obesity and hormone-related medicine management.",
    color: "#f59e0b",
  },
  {
    id: "doc_03",
    name: "Dr. Rahul Menon",
    email: "rahul.menon@DoseVia.com",
    password: "Rahul@1234",
    speciality: "Neurologist",
    qualification: "MD, DM (Neurology)",
    experience: 16,
    hospital: "DoseVia Neuro Care",
    languages: ["English", "Malayalam", "Hindi"],
    fee: 1000,
    rating: 4.8,
    about: "Epilepsy, migraine, stroke recovery, Parkinson’s and neuropathy.",
    color: "#7c3aed",
  },
  {
    id: "doc_04",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@DoseVia.com",
    password: "Sunita@1234",
    speciality: "Nephrologist",
    qualification: "MD, DM (Nephrology)",
    experience: 15,
    hospital: "DoseVia Kidney Centre",
    languages: ["English", "Kannada", "Telugu"],
    fee: 900,
    rating: 4.7,
    about:
      "Kidney disease, dialysis planning and safe dosing in reduced kidney function.",
    color: "#0ea5e9",
  },
  {
    id: "doc_05",
    name: "Dr. Vikram Singh",
    email: "vikram.singh@DoseVia.com",
    password: "Vikram@1234",
    speciality: "Gastroenterologist",
    qualification: "MD, DM (Gastroenterology)",
    experience: 13,
    hospital: "DoseVia Digestive Health",
    languages: ["English", "Hindi", "Punjabi"],
    fee: 850,
    rating: 4.7,
    about:
      "Acidity, ulcers, IBS, liver and gut problems, medicine-related stomach issues.",
    color: "#16a34a",
  },
  {
    id: "doc_06",
    name: "Dr. Meera Iyer",
    email: "meera.iyer@DoseVia.com",
    password: "Meera@1234",
    speciality: "Pulmonologist",
    qualification: "MD, DM (Pulmonology)",
    experience: 12,
    hospital: "DoseVia Chest Clinic",
    languages: ["English", "Tamil", "Kannada"],
    fee: 800,
    rating: 4.6,
    about: "Asthma, COPD, breathlessness, chronic cough and sleep apnoea.",
    color: "#06b6d4",
  },
  {
    id: "doc_07",
    name: "Dr. Arjun Reddy",
    email: "arjun.reddy@DoseVia.com",
    password: "Arjun@1234",
    speciality: "General Physician",
    qualification: "MBBS, MD (General Medicine)",
    experience: 20,
    hospital: "DoseVia Family Clinic",
    languages: ["English", "Telugu", "Hindi"],
    fee: 500,
    rating: 4.9,
    about:
      "First point of contact for fever, infections, general check-ups and multiple medicines.",
    color: "#185FA5",
  },
  {
    id: "doc_08",
    name: "Dr. Kavya Shetty",
    email: "kavya.shetty@DoseVia.com",
    password: "Kavya@1234",
    speciality: "Psychiatrist",
    qualification: "MD (Psychiatry)",
    experience: 11,
    hospital: "DoseVia Mind Care",
    languages: ["English", "Kannada", "Tulu"],
    fee: 1000,
    rating: 4.8,
    about:
      "Anxiety, depression, sleep problems and safe use of psychiatric medicines.",
    color: "#a855f7",
  },
  {
    id: "doc_09",
    name: "Dr. Suresh Patil",
    email: "suresh.patil@DoseVia.com",
    password: "Suresh@1234",
    speciality: "Geriatrician",
    qualification: "MD (Geriatric Medicine)",
    experience: 22,
    hospital: "DoseVia Senior Care",
    languages: ["English", "Marathi", "Hindi"],
    fee: 700,
    rating: 4.9,
    about:
      "Elderly patients on many medicines (polypharmacy), falls, memory and frailty.",
    color: "#b45309",
  },
  {
    id: "doc_10",
    name: "Dr. Anita Deshmukh",
    email: "anita.deshmukh@DoseVia.com",
    password: "Anita@1234",
    speciality: "Clinical Pharmacologist",
    qualification: "MD (Pharmacology), PhD",
    experience: 17,
    hospital: "DoseVia Medication Safety Unit",
    languages: ["English", "Marathi", "Hindi"],
    fee: 600,
    rating: 4.9,
    about:
      "Drug–drug interactions, side effects, dose adjustment and medication reviews.",
    color: "#0F6E56",
  },
  {
    id: "doc_11",
    name: "Dr. Rohit Kulkarni",
    email: "rohit.kulkarni@DoseVia.com",
    password: "Rohit@1234",
    speciality: "Hepatologist",
    qualification: "MD, DM (Hepatology)",
    experience: 12,
    hospital: "DoseVia Liver Centre",
    languages: ["English", "Kannada", "Marathi"],
    fee: 950,
    rating: 4.7,
    about:
      "Fatty liver, hepatitis, cirrhosis and medicines that affect the liver.",
    color: "#ca8a04",
  },
  {
    id: "doc_12",
    name: "Dr. Neha Gupta",
    email: "neha.gupta@DoseVia.com",
    password: "Neha@1234",
    speciality: "Rheumatologist",
    qualification: "MD, DM (Rheumatology)",
    experience: 10,
    hospital: "DoseVia Joint & Immunity Clinic",
    languages: ["English", "Hindi"],
    fee: 900,
    rating: 4.7,
    about: "Arthritis, gout, lupus and long-term pain or steroid medicines.",
    color: "#db2777",
  },
  {
    id: "doc_13",
    name: "Dr. Farhan Sheikh",
    email: "farhan.sheikh@DoseVia.com",
    password: "Farhan@1234",
    speciality: "Dermatologist",
    qualification: "MD (Dermatology)",
    experience: 9,
    hospital: "DoseVia Skin Clinic",
    languages: ["English", "Hindi", "Urdu"],
    fee: 700,
    rating: 4.6,
    about:
      "Skin rashes, allergies, acne, eczema and medicine-induced skin reactions.",
    color: "#f97316",
  },
  {
    id: "doc_14",
    name: "Dr. Lakshmi Narayan",
    email: "lakshmi.narayan@DoseVia.com",
    password: "Lakshmi@1234",
    speciality: "Gynaecologist",
    qualification: "MD, DGO (Obstetrics & Gynaecology)",
    experience: 19,
    hospital: "DoseVia Women’s Health",
    languages: ["English", "Tamil", "Telugu"],
    fee: 800,
    rating: 4.9,
    about:
      "Pregnancy, PCOS, menstrual problems and medicine safety in pregnancy.",
    color: "#ec4899",
  },
  {
    id: "doc_15",
    name: "Dr. Manoj Joshi",
    email: "manoj.joshi@DoseVia.com",
    password: "Manoj@1234",
    speciality: "Orthopaedic Surgeon",
    qualification: "MS (Orthopaedics)",
    experience: 16,
    hospital: "DoseVia Bone & Joint Centre",
    languages: ["English", "Hindi", "Gujarati"],
    fee: 850,
    rating: 4.7,
    about:
      "Fractures, back and knee pain, joint replacement and pain-killer safety.",
    color: "#64748b",
  },
  {
    id: "doc_16",
    name: "Dr. Divya Krishnan",
    email: "divya.krishnan@DoseVia.com",
    password: "Divya@1234",
    speciality: "ENT Specialist",
    qualification: "MS (ENT)",
    experience: 8,
    hospital: "DoseVia ENT Clinic",
    languages: ["English", "Tamil", "Malayalam"],
    fee: 600,
    rating: 4.5,
    about:
      "Ear, nose and throat infections, sinus, hearing and voice problems.",
    color: "#14b8a6",
  },
  {
    id: "doc_17",
    name: "Dr. Sanjay Bhat",
    email: "sanjay.bhat@DoseVia.com",
    password: "Sanjay@1234",
    speciality: "Ophthalmologist",
    qualification: "MS (Ophthalmology)",
    experience: 14,
    hospital: "DoseVia Eye Care",
    languages: ["English", "Kannada", "Konkani"],
    fee: 700,
    rating: 4.6,
    about:
      "Vision problems, glaucoma, diabetic eye disease and eye-drop guidance.",
    color: "#3b82f6",
  },
  {
    id: "doc_18",
    name: "Dr. Ritu Malhotra",
    email: "ritu.malhotra@DoseVia.com",
    password: "Ritu@1234",
    speciality: "Oncologist",
    qualification: "MD, DM (Medical Oncology)",
    experience: 15,
    hospital: "DoseVia Cancer Centre",
    languages: ["English", "Hindi", "Punjabi"],
    fee: 1200,
    rating: 4.8,
    about:
      "Cancer treatment planning, chemotherapy side effects and drug interactions.",
    color: "#be123c",
  },
  {
    id: "doc_19",
    name: "Dr. Karthik Subramanian",
    email: "karthik.subramanian@DoseVia.com",
    password: "Karthik@1234",
    speciality: "Urologist",
    qualification: "MS, MCh (Urology)",
    experience: 13,
    hospital: "DoseVia Urology Centre",
    languages: ["English", "Tamil", "Kannada"],
    fee: 850,
    rating: 4.6,
    about:
      "Kidney stones, prostate and urinary problems, and related medicines.",
    color: "#0891b2",
  },
  {
    id: "doc_20",
    name: "Dr. Pooja Agarwal",
    email: "pooja.agarwal@DoseVia.com",
    password: "Pooja@1234",
    speciality: "Haematologist",
    qualification: "MD, DM (Haematology)",
    experience: 11,
    hospital: "DoseVia Blood Disorders Unit",
    languages: ["English", "Hindi", "Bengali"],
    fee: 950,
    rating: 4.7,
    about:
      "Anaemia, clotting disorders, blood thinners (warfarin etc.) and blood tests.",
    color: "#dc2626",
  },
];

// ---- Doctor directory (managed by the Admin) -------------------------------------------
// The 20 SEED_DOCTORS are copied into localStorage on first load. After that the Admin
// adds / removes doctors and this stored list is the single source of truth.
export const DOCTORS_KEY = "DoseVia_doctors";

export function getAllDoctors(): DoctorProfile[] {
  try {
    const raw = localStorage.getItem(DOCTORS_KEY);
    if (raw) return JSON.parse(raw) as DoctorProfile[];
    const seeded = SEED_DOCTORS.map(
      ({ password: _pw, ...rest }) => rest as DoctorProfile,
    );
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return SEED_DOCTORS.map(
      ({ password: _pw, ...rest }) => rest as DoctorProfile,
    );
  }
}
export function saveDoctors(list: DoctorProfile[]): void {
  try {
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export const specialitiesOf = (list: DoctorProfile[]) =>
  Array.from(new Set(list.map((d) => d.speciality))).sort();
export const COMMON_SPECIALITIES = Array.from(
  new Set(SEED_DOCTORS.map((d) => d.speciality)),
).sort();
export const DOCTOR_COLORS = [
  "#e11d48",
  "#f59e0b",
  "#7c3aed",
  "#0ea5e9",
  "#16a34a",
  "#06b6d4",
  "#185FA5",
  "#a855f7",
  "#0F6E56",
  "#db2777",
  "#f97316",
  "#14b8a6",
];

export const getDoctor = (id?: string | null) =>
  getAllDoctors().find((d) => d.id === id);
export const doctorInitials = (name: string) =>
  name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// "What is your problem?" -> which specialities can help
export interface ProblemOption {
  label: string;
  emoji: string;
  keywords: string[];
  specialities: string[];
}
export const PROBLEMS: ProblemOption[] = [
  {
    label: "Heart / Blood pressure",
    emoji: "❤️",
    keywords: [
      "heart",
      "bp",
      "blood pressure",
      "hypertension",
      "chest pain",
      "palpitation",
      "cholesterol",
    ],
    specialities: ["Cardiologist", "General Physician"],
  },
  {
    label: "Diabetes / Thyroid",
    emoji: "🩸",
    keywords: [
      "diabetes",
      "sugar",
      "thyroid",
      "insulin",
      "obesity",
      "weight",
      "hormone",
    ],
    specialities: ["Endocrinologist", "General Physician"],
  },
  {
    label: "Headache / Nerves / Seizures",
    emoji: "🧠",
    keywords: [
      "headache",
      "migraine",
      "seizure",
      "epilepsy",
      "stroke",
      "numbness",
      "tremor",
      "parkinson",
      "dizziness",
    ],
    specialities: ["Neurologist"],
  },
  {
    label: "Kidney problems",
    emoji: "🫘",
    keywords: ["kidney", "creatinine", "dialysis", "renal"],
    specialities: ["Nephrologist", "Urologist"],
  },
  {
    label: "Stomach / Liver",
    emoji: "🍽️",
    keywords: [
      "stomach",
      "acidity",
      "gas",
      "ulcer",
      "liver",
      "jaundice",
      "vomiting",
      "diarrhoea",
      "constipation",
      "hepatitis",
    ],
    specialities: ["Gastroenterologist", "Hepatologist"],
  },
  {
    label: "Breathing / Cough",
    emoji: "🫁",
    keywords: ["asthma", "breath", "cough", "copd", "wheeze", "lung"],
    specialities: ["Pulmonologist", "General Physician"],
  },
  {
    label: "Mental health / Sleep",
    emoji: "🧘",
    keywords: [
      "anxiety",
      "depression",
      "stress",
      "sleep",
      "insomnia",
      "panic",
      "mood",
    ],
    specialities: ["Psychiatrist"],
  },
  {
    label: "Many medicines / Side effects",
    emoji: "💊",
    keywords: [
      "side effect",
      "interaction",
      "medicine",
      "tablet",
      "dose",
      "polypharmacy",
      "reaction",
    ],
    specialities: [
      "Clinical Pharmacologist",
      "Geriatrician",
      "General Physician",
    ],
  },
  {
    label: "Joint / Bone pain",
    emoji: "🦴",
    keywords: [
      "joint",
      "bone",
      "knee",
      "back pain",
      "arthritis",
      "gout",
      "fracture",
      "lupus",
    ],
    specialities: ["Orthopaedic Surgeon", "Rheumatologist"],
  },
  {
    label: "Skin / Allergy",
    emoji: "🧴",
    keywords: ["skin", "rash", "itch", "allergy", "acne", "eczema"],
    specialities: ["Dermatologist"],
  },
  {
    label: "Pregnancy / Women’s health",
    emoji: "🤰",
    keywords: ["pregnan", "period", "menstrual", "pcos", "women"],
    specialities: ["Gynaecologist"],
  },
  {
    label: "Eye / Ear / Throat",
    emoji: "👁️",
    keywords: [
      "eye",
      "vision",
      "ear",
      "hearing",
      "throat",
      "sinus",
      "nose",
      "tonsil",
    ],
    specialities: ["Ophthalmologist", "ENT Specialist"],
  },
  {
    label: "Blood disorders / Cancer",
    emoji: "🔬",
    keywords: [
      "anaemia",
      "anemia",
      "clot",
      "warfarin",
      "blood thinner",
      "cancer",
      "chemo",
      "tumour",
    ],
    specialities: ["Haematologist", "Oncologist"],
  },
  {
    label: "Fever / General check-up",
    emoji: "🌡️",
    keywords: [
      "fever",
      "cold",
      "flu",
      "infection",
      "check-up",
      "checkup",
      "weakness",
      "fatigue",
    ],
    specialities: ["General Physician"],
  },
  {
    label: "Elderly care",
    emoji: "👵",
    keywords: ["elderly", "old age", "memory", "falls", "senior"],
    specialities: ["Geriatrician"],
  },
];

/** Specialities that match free text typed by the patient (e.g. "my sugar is high"). */
export function specialitiesForText(text: string): string[] {
  const t = text.trim().toLowerCase();
  if (!t) return [];
  const hit = new Set<string>();
  PROBLEMS.forEach((p) => {
    if (
      p.keywords.some((k) => t.includes(k)) ||
      p.label.toLowerCase().includes(t)
    )
      p.specialities.forEach((s) => hit.add(s));
  });
  getAllDoctors().forEach((d) => {
    if (
      d.speciality.toLowerCase().includes(t) ||
      d.name.toLowerCase().includes(t)
    )
      hit.add(d.speciality);
  });
  return Array.from(hit);
}

// sessionStorage hand-off keys between the Doctors directory, Chat and Visits pages
export const CHAT_DOCTOR_KEY = "DoseVia_chat_doctor";
export const BOOK_DOCTOR_KEY = "DoseVia_book_doctor";
