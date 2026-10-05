/**
 * Offline pharmacokinetic reference data used by the doctor Visualisations page.
 * Values are approximate, textbook-level figures (peak time, plasma half-life,
 * a sensible dosing hour and the organs the drug acts on / is cleared by).
 * Visualisations work from this table with no internet or API key.
 */
export interface PKEntry {
  peakHours: number;
  halfLifeHours: number;
  optimalDoseHour: number;
  affectedOrgans: string[];
  clearance: 'renal' | 'hepatic' | 'mixed';
}

const PK_BY_ID: Record<string, PKEntry> = {
  d1: { peakHours: 2.5, halfLifeHours: 6, optimalDoseHour: 8, affectedOrgans: ['Liver', 'Kidneys', 'Stomach', 'Blood'], clearance: 'renal' },
  d2: { peakHours: 7, halfLifeHours: 35, optimalDoseHour: 9, affectedOrgans: ['Heart', 'Liver', 'Blood'], clearance: 'hepatic' },
  d3: { peakHours: 1, halfLifeHours: 3, optimalDoseHour: 13, affectedOrgans: ['Stomach', 'Blood', 'Heart', 'Kidneys'], clearance: 'mixed' },
  d4: { peakHours: 3, halfLifeHours: 24, optimalDoseHour: 7, affectedOrgans: ['Thyroid', 'Heart'], clearance: 'hepatic' },
  d5: { peakHours: 3, halfLifeHours: 6, optimalDoseHour: 9, affectedOrgans: ['Blood', 'Stomach'], clearance: 'mixed' },
  d6: { peakHours: 1, halfLifeHours: 4, optimalDoseHour: 10, affectedOrgans: ['Blood', 'Liver'], clearance: 'renal' },
  d7: { peakHours: 4, halfLifeHours: 40, optimalDoseHour: 18, affectedOrgans: ['Blood', 'Liver'], clearance: 'hepatic' },
  d8: { peakHours: 2, halfLifeHours: 14, optimalDoseHour: 21, affectedOrgans: ['Liver', 'Heart', 'Blood'], clearance: 'hepatic' },
  d9: { peakHours: 2, halfLifeHours: 4, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Lungs', 'Liver'], clearance: 'hepatic' },
  d10: { peakHours: 3, halfLifeHours: 13, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Kidneys', 'Blood'], clearance: 'renal' },
  d11: { peakHours: 6, halfLifeHours: 26, optimalDoseHour: 9, affectedOrgans: ['Brain', 'Liver', 'Stomach'], clearance: 'hepatic' },
  d12: { peakHours: 2.5, halfLifeHours: 1.5, optimalDoseHour: 7, affectedOrgans: ['Stomach', 'Liver'], clearance: 'hepatic' },
  d13: { peakHours: 1.5, halfLifeHours: 1.5, optimalDoseHour: 8, affectedOrgans: ['Lungs', 'Kidneys', 'Blood'], clearance: 'renal' },
  d14: { peakHours: 1, halfLifeHours: 2.5, optimalDoseHour: 12, affectedOrgans: ['Brain', 'Liver'], clearance: 'hepatic' },
  d15: { peakHours: 1.5, halfLifeHours: 2, optimalDoseHour: 13, affectedOrgans: ['Stomach', 'Kidneys', 'Blood'], clearance: 'mixed' },
  d16: { peakHours: 1, halfLifeHours: 1, optimalDoseHour: 7, affectedOrgans: ['Stomach', 'Liver'], clearance: 'hepatic' },
  d17: { peakHours: 7, halfLifeHours: 12, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Kidneys', 'Blood'], clearance: 'renal' },
  d18: { peakHours: 3, halfLifeHours: 6, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Kidneys', 'Liver'], clearance: 'mixed' },
  d19: { peakHours: 4, halfLifeHours: 10, optimalDoseHour: 8, affectedOrgans: ['Liver', 'Kidneys', 'Blood'], clearance: 'mixed' },
  d20: { peakHours: 1.5, halfLifeHours: 4, optimalDoseHour: 8, affectedOrgans: ['Lungs', 'Kidneys', 'Stomach'], clearance: 'renal' },
  d21: { peakHours: 1, halfLifeHours: 6, optimalDoseHour: 9, affectedOrgans: ['Blood', 'Heart', 'Liver'], clearance: 'hepatic' },
  d22: { peakHours: 1.5, halfLifeHours: 3, optimalDoseHour: 21, affectedOrgans: ['Liver', 'Heart', 'Blood'], clearance: 'hepatic' },
  d23: { peakHours: 3, halfLifeHours: 5, optimalDoseHour: 8, affectedOrgans: ['Lungs', 'Liver', 'Stomach'], clearance: 'hepatic' },
  d24: { peakHours: 2, halfLifeHours: 30, optimalDoseHour: 9, affectedOrgans: ['Liver', 'Kidneys', 'Blood'], clearance: 'renal' },
  d25: { peakHours: 7, halfLifeHours: 72, optimalDoseHour: 8, affectedOrgans: ['Brain', 'Liver', 'Stomach'], clearance: 'hepatic' },
  d26: { peakHours: 6, halfLifeHours: 15, optimalDoseHour: 20, affectedOrgans: ['Brain', 'Liver', 'Blood'], clearance: 'hepatic' },
  d27: { peakHours: 8, halfLifeHours: 22, optimalDoseHour: 20, affectedOrgans: ['Brain', 'Liver', 'Heart'], clearance: 'hepatic' },
  d28: { peakHours: 1.5, halfLifeHours: 36, optimalDoseHour: 9, affectedOrgans: ['Heart', 'Kidneys', 'Brain'], clearance: 'renal' },
  d29: { peakHours: 3, halfLifeHours: 5, optimalDoseHour: 9, affectedOrgans: ['Heart', 'Liver', 'Blood'], clearance: 'hepatic' },
  d30: { peakHours: 2, halfLifeHours: 4, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Lungs', 'Brain', 'Liver'], clearance: 'hepatic' },
  d31: { peakHours: 1, halfLifeHours: 2, optimalDoseHour: 8, affectedOrgans: ['Heart', 'Kidneys', 'Blood'], clearance: 'renal' },
  d32: { peakHours: 3, halfLifeHours: 12, optimalDoseHour: 8, affectedOrgans: ['Blood', 'Kidneys', 'Stomach'], clearance: 'renal' },
  d33: { peakHours: 1.5, halfLifeHours: 1.5, optimalDoseHour: 7, affectedOrgans: ['Stomach', 'Liver'], clearance: 'hepatic' },
  d34: { peakHours: 1.5, halfLifeHours: 2, optimalDoseHour: 8, affectedOrgans: ['Kidneys', 'Heart', 'Blood'], clearance: 'renal' },
  d35: { peakHours: 3, halfLifeHours: 14, optimalDoseHour: 8, affectedOrgans: ['Kidneys', 'Heart', 'Blood'], clearance: 'mixed' },
  d36: { peakHours: 1.5, halfLifeHours: 7, optimalDoseHour: 9, affectedOrgans: ['Heart', 'Lungs', 'Liver'], clearance: 'hepatic' },
  d37: { peakHours: 3, halfLifeHours: 9, optimalDoseHour: 18, affectedOrgans: ['Blood', 'Liver', 'Kidneys'], clearance: 'mixed' },
  d38: { peakHours: 3, halfLifeHours: 12, optimalDoseHour: 9, affectedOrgans: ['Blood', 'Liver', 'Kidneys'], clearance: 'mixed' },
  d39: { peakHours: 3, halfLifeHours: 7, optimalDoseHour: 8, affectedOrgans: ['Liver', 'Kidneys', 'Blood'], clearance: 'mixed' },
  d40: { peakHours: 2, halfLifeHours: 2, optimalDoseHour: 13, affectedOrgans: ['Stomach', 'Kidneys', 'Blood'], clearance: 'mixed' },
};

// Fallback by drug class (used for custom drugs added to the database)
const PK_BY_CLASS: Record<string, PKEntry> = {
  Biguanide: PK_BY_ID.d1, CCB: PK_BY_ID.d2, NSAID: PK_BY_ID.d3, Thyroid: PK_BY_ID.d4,
  Mineral: PK_BY_ID.d5, Vitamin: PK_BY_ID.d6, Anticoagulant: PK_BY_ID.d7, Statin: PK_BY_ID.d8,
  'Beta Blocker': PK_BY_ID.d9, 'ACE Inhibitor': PK_BY_ID.d10, SSRI: PK_BY_ID.d11, PPI: PK_BY_ID.d12,
  Penicillin: PK_BY_ID.d13, Analgesic: PK_BY_ID.d14, ARB: PK_BY_ID.d18, Sulfonylurea: PK_BY_ID.d19,
  Fluoroquinolone: PK_BY_ID.d20, Antiplatelet: PK_BY_ID.d21, Macrolide: PK_BY_ID.d23,
  Antifungal: PK_BY_ID.d24, Anticonvulsant: PK_BY_ID.d26, 'Cardiac Glycoside': PK_BY_ID.d28,
  'DPP-4 Inhibitor': PK_BY_ID.d32, 'Loop Diuretic': PK_BY_ID.d34, 'K-sparing Diuretic': PK_BY_ID.d35,
};

const GENERIC_PK: PKEntry = { peakHours: 2, halfLifeHours: 8, optimalDoseHour: 8, affectedOrgans: ['Liver', 'Blood'], clearance: 'mixed' };

export function getPK(drugId: string, drugClass: string): PKEntry {
  return PK_BY_ID[drugId] ?? PK_BY_CLASS[drugClass] ?? GENERIC_PK;
}
