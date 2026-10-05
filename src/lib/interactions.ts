import { Drug, Patient, RiskLevel } from './drugData';

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

// ---- 30 known drug-drug interactions ----

export const KNOWN_INTERACTIONS: Interaction[] = [
  // Original 10
  { drug1: 'd7',  drug2: 'd3',  severity: 'severe',   description: 'Warfarin + Aspirin significantly increases bleeding risk' },
  { drug1: 'd7',  drug2: 'd8',  severity: 'moderate', description: 'Warfarin + Atorvastatin may increase anticoagulant effect' },
  { drug1: 'd7',  drug2: 'd15', severity: 'severe',   description: 'Warfarin + Ibuprofen greatly increases bleeding risk' },
  { drug1: 'd11', drug2: 'd3',  severity: 'moderate', description: 'Sertraline + Aspirin increases risk of bleeding' },
  { drug1: 'd2',  drug2: 'd9',  severity: 'mild',     description: 'Amlodipine + Metoprolol may cause excessive BP lowering' },
  { drug1: 'd1',  drug2: 'd15', severity: 'mild',     description: 'Metformin + Ibuprofen may affect kidney function' },
  { drug1: 'd12', drug2: 'd16', severity: 'moderate', description: 'Two PPIs together is redundant and increases side effects' },
  { drug1: 'd19', drug2: 'd3',  severity: 'moderate', description: 'Glibenclamide + Aspirin may enhance hypoglycaemia' },
  { drug1: 'd8',  drug2: 'd20', severity: 'moderate', description: 'Atorvastatin + Ciprofloxacin: ciprofloxacin inhibits CYP3A4, raising statin levels' },
  { drug1: 'd4',  drug2: 'd5',  severity: 'mild',     description: 'Levothyroxine absorption reduced by iron — take 2 hours apart' },

  // New 20 interactions
  { drug1: 'd7',  drug2: 'd24', severity: 'severe',   description: 'Warfarin + Fluconazole: Fluconazole strongly inhibits CYP2C9, drastically raising Warfarin levels — severe bleeding risk' },
  { drug1: 'd7',  drug2: 'd27', severity: 'severe',   description: 'Warfarin + Phenytoin: complex interaction — initially raises then lowers Warfarin effect; requires close INR monitoring' },
  { drug1: 'd8',  drug2: 'd23', severity: 'severe',   description: 'Simvastatin/Atorvastatin + Clarithromycin: Clarithromycin blocks CYP3A4, causing dangerous statin accumulation (rhabdomyolysis risk)' },
  { drug1: 'd22', drug2: 'd23', severity: 'severe',   description: 'Simvastatin + Clarithromycin: CYP3A4 inhibition causes major statin toxicity — muscle breakdown risk' },
  { drug1: 'd21', drug2: 'd16', severity: 'moderate', description: 'Clopidogrel + Omeprazole: Omeprazole inhibits CYP2C19 reducing Clopidogrel activation — reduced antiplatelet effect' },
  { drug1: 'd21', drug2: 'd33', severity: 'moderate', description: 'Clopidogrel + Esomeprazole: same CYP2C19 interaction as Omeprazole — may reduce Clopidogrel effectiveness' },
  { drug1: 'd9',  drug2: 'd25', severity: 'moderate', description: 'Metoprolol + Fluoxetine: Fluoxetine inhibits CYP2D6, raising Metoprolol blood levels — bradycardia risk' },
  { drug1: 'd9',  drug2: 'd11', severity: 'moderate', description: 'Metoprolol + Sertraline: Sertraline inhibits CYP2D6, slowing Metoprolol clearance — excessive beta-blockade possible' },
  { drug1: 'd26', drug2: 'd8',  severity: 'moderate', description: 'Carbamazepine + Atorvastatin: Carbamazepine induces CYP3A4, reducing statin levels — less cholesterol control' },
  { drug1: 'd26', drug2: 'd7',  severity: 'severe',   description: 'Carbamazepine + Warfarin: Carbamazepine induces CYP enzymes, significantly reducing Warfarin effect — clotting risk' },
  { drug1: 'd25', drug2: 'd7',  severity: 'severe',   description: 'Fluoxetine + Warfarin: Fluoxetine inhibits CYP2C9, raising Warfarin levels — high bleeding risk' },
  { drug1: 'd10', drug2: 'd35', severity: 'moderate', description: 'Ramipril + Spironolactone: both raise potassium — dangerous hyperkalaemia risk, especially with renal impairment' },
  { drug1: 'd17', drug2: 'd35', severity: 'moderate', description: 'Lisinopril + Spironolactone: ACE inhibitor + K-sparing diuretic combination risks severe hyperkalaemia' },
  { drug1: 'd37', drug2: 'd38', severity: 'severe',   description: 'Rivaroxaban + Apixaban: two anticoagulants together drastically increases haemorrhage risk — never combine' },
  { drug1: 'd37', drug2: 'd7',  severity: 'severe',   description: 'Rivaroxaban + Warfarin: combining two anticoagulants causes extreme bleeding risk' },
  { drug1: 'd1',  drug2: 'd34', severity: 'mild',     description: 'Metformin + Furosemide: Furosemide may raise Metformin levels by reducing renal clearance' },
  { drug1: 'd28', drug2: 'd34', severity: 'moderate', description: 'Digoxin + Furosemide: Furosemide-induced low potassium increases Digoxin toxicity risk' },
  { drug1: 'd3',  drug2: 'd40', severity: 'moderate', description: 'Aspirin + Diclofenac: two NSAIDs together increases GI bleeding and renal impairment risk' },
  { drug1: 'd19', drug2: 'd24', severity: 'moderate', description: 'Glibenclamide + Fluconazole: Fluconazole inhibits CYP2C9, raising Glibenclamide levels — severe hypoglycaemia risk' },
  { drug1: 'd39', drug2: 'd24', severity: 'moderate', description: 'Glimepiride + Fluconazole: same CYP2C9 inhibition — hypoglycaemia risk' },
];

// ---- computeRisk: replaces the stored 'risk' field in Patient ----
// Call this instead of reading computeRisk(patient, drugs) directly.
// Example: const risk = computeRisk(patient, drugs);

export function computeRisk(patient: Patient, drugs: Drug[]): RiskLevel {
  const patientDrugs = drugs.filter(d => patient.drugs.includes(d.id));
  const interactions = getInteractions(patient.drugs);
  const score = getConflictScore(interactions);

  // Check for pregnancy category X drugs
  const hasX = patientDrugs.some(d => d.pregnancyCategory === 'X');

  // Severe organ impairment
  const organImpaired = patient.kidneyFunction < 40 || patient.liverFunction < 40;
  const organReduced = patient.kidneyFunction < 60 || patient.liverFunction < 60;

  if (score >= 60 || (hasX && patient.pregnant) || organImpaired) return 'Critical';
  if (score >= 35 || organReduced || hasX) return 'High';
  if (score >= 15 || patient.drugs.length >= 4) return 'Medium';
  return 'Low';
}

// ---- All original functions below — UNCHANGED ----

export function getInteractions(drugIds: string[]): Interaction[] {
  const result: Interaction[] = [];
  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const a = drugIds[i];
      const b = drugIds[j];
      const found = KNOWN_INTERACTIONS.find(
        x => (x.drug1 === a && x.drug2 === b) || (x.drug1 === b && x.drug2 === a)
      );
      if (found) result.push(found);
    }
  }
  return result;
}

export function getConflictScore(interactions: Interaction[]): number {
  return interactions.reduce((sum, i) => {
    if (i.severity === 'severe') return sum + 40;
    if (i.severity === 'moderate') return sum + 20;
    return sum + 8;
  }, 0);
}

export function getCypConflicts(drugs: Drug[]): Record<string, string[]> {
  const enzymeMap: Record<string, string[]> = {};
  drugs.forEach(d => {
    d.cyp.forEach(enzyme => {
      if (!enzymeMap[enzyme]) enzymeMap[enzyme] = [];
      enzymeMap[enzyme].push(d.id);
    });
  });
  const conflicts: Record<string, string[]> = {};
  Object.entries(enzymeMap).forEach(([enzyme, ids]) => {
    if (ids.length > 1) conflicts[enzyme] = ids;
  });
  return conflicts;
}

export function getSideEffectProbabilities(drugIds: string[]): { label: string; pct: number }[] {
  const base = [
    { label: 'Nausea', pct: 12 },
    { label: 'Headache', pct: 18 },
    { label: 'Dizziness', pct: 10 },
    { label: 'Fatigue', pct: 15 },
    { label: 'GI Upset', pct: 20 },
    { label: 'Bleeding Risk', pct: 8 },
    { label: 'Liver Stress', pct: 6 },
    { label: 'Kidney Impact', pct: 9 },
  ];
  const modifier = Math.min(drugIds.length * 0.3, 1.5);
  return base.map(item => ({ ...item, pct: Math.min(Math.round(item.pct * (1 + modifier)), 95) }));
}

export function getAllergyConflicts(patient: Patient, drugs: Drug[]): { drug: Drug; allergen: string }[] {
  const conflicts: { drug: Drug; allergen: string }[] = [];
  drugs.forEach(drug => {
    const allergenMap: Record<string, string[]> = {
      'd13': ['Penicillin'],
      'd3': ['NSAIDs', 'Aspirin'],
      'd15': ['NSAIDs', 'Ibuprofen'],
      'd40': ['NSAIDs', 'Diclofenac'],
      'd19': ['Sulfa', 'Sulfonylurea'],
      'd39': ['Sulfa', 'Sulfonylurea'],
    };
    const drugAllergens = allergenMap[drug.id] ?? [];
    const hasConflict = patient.allergies.some(a =>
      drugAllergens.some(da =>
        da.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(da.toLowerCase())
      )
    );
    if (hasConflict) {
      const allergen = patient.allergies.find(a =>
        drugAllergens.some(da =>
          da.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(da.toLowerCase())
        )
      ) ?? '';
      conflicts.push({ drug, allergen });
    }
  });
  return conflicts;
}

export function getDoseAdjustment(
  drug: Drug,
  kidneyPct: number,
  liverPct: number
): { original: string; recommended: string; action: 'reduce' | 'normal' | 'caution' } {
  const kidneySensitive = ['d1', 'd10', 'd17', 'd31', 'd34', 'd28'];
  const liverSensitive  = ['d7', 'd8', 'd22', 'd11', 'd25'];
  let action: 'reduce' | 'normal' | 'caution' = 'normal';
  let note = 'Normal dose';

  if (kidneySensitive.includes(drug.id) && kidneyPct < 50) {
    action = 'reduce';
    note = 'Reduce by 50%';
  } else if (liverSensitive.includes(drug.id) && liverPct < 60) {
    action = 'caution';
    note = 'Use with caution';
  } else if (kidneyPct < 40 || liverPct < 40) {
    action = 'caution';
    note = 'Monitor closely';
  }
  return { original: 'Standard dose', recommended: note, action };
}