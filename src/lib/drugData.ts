export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type PregnancyCategory = "A" | "B" | "C" | "D" | "X";

export interface Drug {
  id: string;
  name: string; // brand name e.g. "Lipitor"
  genericName: string; // generic e.g. "Atorvastatin"
  class: string; // e.g. "Statin"
  cyp: string[]; // CYP enzymes this drug uses e.g. ["CYP3A4"]
  pregnancyCategory: PregnancyCategory;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  drugs: string[]; // Drug IDs
  kidneyFunction: number; // 0–100
  liverFunction: number; // 0–100
  allergies: string[];
  pregnant: boolean;
  // NOTE: 'risk' field is REMOVED — use computeRisk() from interactions.ts
}

// ---- Drug Database (40 drugs) ----

export const DRUGS_DATABASE: Drug[] = [
  // Original 20
  {
    id: "d1",
    name: "Glucophage",
    genericName: "Metformin",
    class: "Biguanide",
    cyp: [],
    pregnancyCategory: "B",
  },
  {
    id: "d2",
    name: "Norvasc",
    genericName: "Amlodipine",
    class: "CCB",
    cyp: ["CYP3A4"],
    pregnancyCategory: "C",
  },
  {
    id: "d3",
    name: "Disprin",
    genericName: "Aspirin",
    class: "NSAID",
    cyp: ["CYP2C9"],
    pregnancyCategory: "D",
  },
  {
    id: "d4",
    name: "Synthroid",
    genericName: "Levothyroxine",
    class: "Thyroid",
    cyp: [],
    pregnancyCategory: "A",
  },
  {
    id: "d5",
    name: "Ferrous",
    genericName: "Iron Sulfate",
    class: "Mineral",
    cyp: [],
    pregnancyCategory: "A",
  },
  {
    id: "d6",
    name: "Folvite",
    genericName: "Folic Acid",
    class: "Vitamin",
    cyp: [],
    pregnancyCategory: "A",
  },
  {
    id: "d7",
    name: "Coumadin",
    genericName: "Warfarin",
    class: "Anticoagulant",
    cyp: ["CYP2C9", "CYP3A4"],
    pregnancyCategory: "X",
  },
  {
    id: "d8",
    name: "Lipitor",
    genericName: "Atorvastatin",
    class: "Statin",
    cyp: ["CYP3A4"],
    pregnancyCategory: "X",
  },
  {
    id: "d9",
    name: "Lopressor",
    genericName: "Metoprolol",
    class: "Beta Blocker",
    cyp: ["CYP2D6"],
    pregnancyCategory: "C",
  },
  {
    id: "d10",
    name: "Altace",
    genericName: "Ramipril",
    class: "ACE Inhibitor",
    cyp: [],
    pregnancyCategory: "D",
  },
  {
    id: "d11",
    name: "Zoloft",
    genericName: "Sertraline",
    class: "SSRI",
    cyp: ["CYP2C19", "CYP2D6"],
    pregnancyCategory: "C",
  },
  {
    id: "d12",
    name: "Protonix",
    genericName: "Pantoprazole",
    class: "PPI",
    cyp: ["CYP2C19"],
    pregnancyCategory: "B",
  },
  {
    id: "d13",
    name: "Amoxil",
    genericName: "Amoxicillin",
    class: "Penicillin",
    cyp: [],
    pregnancyCategory: "B",
  },
  {
    id: "d14",
    name: "Tylenol",
    genericName: "Paracetamol",
    class: "Analgesic",
    cyp: ["CYP3A4"],
    pregnancyCategory: "B",
  },
  {
    id: "d15",
    name: "Advil",
    genericName: "Ibuprofen",
    class: "NSAID",
    cyp: ["CYP2C9"],
    pregnancyCategory: "C",
  },
  {
    id: "d16",
    name: "Prilosec",
    genericName: "Omeprazole",
    class: "PPI",
    cyp: ["CYP2C19"],
    pregnancyCategory: "C",
  },
  {
    id: "d17",
    name: "Zestril",
    genericName: "Lisinopril",
    class: "ACE Inhibitor",
    cyp: [],
    pregnancyCategory: "D",
  },
  {
    id: "d18",
    name: "Cozaar",
    genericName: "Losartan",
    class: "ARB",
    cyp: ["CYP2C9", "CYP3A4"],
    pregnancyCategory: "D",
  },
  {
    id: "d19",
    name: "Daonil",
    genericName: "Glibenclamide",
    class: "Sulfonylurea",
    cyp: ["CYP2C9"],
    pregnancyCategory: "C",
  },
  {
    id: "d20",
    name: "Cipro",
    genericName: "Ciprofloxacin",
    class: "Fluoroquinolone",
    cyp: ["CYP1A2", "CYP3A4"],
    pregnancyCategory: "C",
  },

  // New 20 drugs
  {
    id: "d21",
    name: "Plavix",
    genericName: "Clopidogrel",
    class: "Antiplatelet",
    cyp: ["CYP2C19"],
    pregnancyCategory: "B",
  },
  {
    id: "d22",
    name: "Zocor",
    genericName: "Simvastatin",
    class: "Statin",
    cyp: ["CYP3A4"],
    pregnancyCategory: "X",
  },
  {
    id: "d23",
    name: "Biaxin",
    genericName: "Clarithromycin",
    class: "Macrolide",
    cyp: ["CYP3A4"],
    pregnancyCategory: "C",
  },
  {
    id: "d24",
    name: "Diflucan",
    genericName: "Fluconazole",
    class: "Antifungal",
    cyp: ["CYP2C9", "CYP3A4"],
    pregnancyCategory: "D",
  },
  {
    id: "d25",
    name: "Prozac",
    genericName: "Fluoxetine",
    class: "SSRI",
    cyp: ["CYP2D6", "CYP2C9"],
    pregnancyCategory: "C",
  },
  {
    id: "d26",
    name: "Tegretol",
    genericName: "Carbamazepine",
    class: "Anticonvulsant",
    cyp: ["CYP3A4", "CYP1A2"],
    pregnancyCategory: "D",
  },
  {
    id: "d27",
    name: "Dilantin",
    genericName: "Phenytoin",
    class: "Anticonvulsant",
    cyp: ["CYP2C9", "CYP2C19"],
    pregnancyCategory: "D",
  },
  {
    id: "d28",
    name: "Lanoxin",
    genericName: "Digoxin",
    class: "Cardiac Glycoside",
    cyp: [],
    pregnancyCategory: "C",
  },
  {
    id: "d29",
    name: "Cardizem",
    genericName: "Diltiazem",
    class: "CCB",
    cyp: ["CYP3A4"],
    pregnancyCategory: "C",
  },
  {
    id: "d30",
    name: "Inderal",
    genericName: "Propranolol",
    class: "Beta Blocker",
    cyp: ["CYP2D6", "CYP1A2"],
    pregnancyCategory: "C",
  },
  {
    id: "d31",
    name: "Prinivil",
    genericName: "Captopril",
    class: "ACE Inhibitor",
    cyp: [],
    pregnancyCategory: "D",
  },
  {
    id: "d32",
    name: "Januvia",
    genericName: "Sitagliptin",
    class: "DPP-4 Inhibitor",
    cyp: ["CYP3A4"],
    pregnancyCategory: "B",
  },
  {
    id: "d33",
    name: "Nexium",
    genericName: "Esomeprazole",
    class: "PPI",
    cyp: ["CYP2C19"],
    pregnancyCategory: "B",
  },
  {
    id: "d34",
    name: "Lasix",
    genericName: "Furosemide",
    class: "Loop Diuretic",
    cyp: [],
    pregnancyCategory: "C",
  },
  {
    id: "d35",
    name: "Aldactone",
    genericName: "Spironolactone",
    class: "K-sparing Diuretic",
    cyp: [],
    pregnancyCategory: "C",
  },
  {
    id: "d36",
    name: "Coreg",
    genericName: "Carvedilol",
    class: "Beta Blocker",
    cyp: ["CYP2D6", "CYP2C9"],
    pregnancyCategory: "C",
  },
  {
    id: "d37",
    name: "Xarelto",
    genericName: "Rivaroxaban",
    class: "Anticoagulant",
    cyp: ["CYP3A4"],
    pregnancyCategory: "C",
  },
  {
    id: "d38",
    name: "Eliquis",
    genericName: "Apixaban",
    class: "Anticoagulant",
    cyp: ["CYP3A4"],
    pregnancyCategory: "B",
  },
  {
    id: "d39",
    name: "Amaryl",
    genericName: "Glimepiride",
    class: "Sulfonylurea",
    cyp: ["CYP2C9"],
    pregnancyCategory: "C",
  },
  {
    id: "d40",
    name: "Voltaren",
    genericName: "Diclofenac",
    class: "NSAID",
    cyp: ["CYP2C9"],
    pregnancyCategory: "C",
  },
];

// ---- Demo Patients (risk removed) ----

// Fresh database: no pre-loaded patients. Patients are created when they register.
export const INITIAL_PATIENTS: Patient[] = [];

export function initializeData(): void {
  if (!localStorage.getItem("DoseVia_patients")) {
    localStorage.setItem("DoseVia_patients", JSON.stringify(INITIAL_PATIENTS));
  }
  if (!localStorage.getItem("DoseVia_drugs")) {
    localStorage.setItem("DoseVia_drugs", JSON.stringify(DRUGS_DATABASE));
  }
}
