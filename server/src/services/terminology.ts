export interface TermMapping {
  canonicalName: string;
  category: 'Hematology' | 'Biochemistry' | 'Metabolic' | 'Lipid' | 'Endocrine' | 'Electrolytes' | 'Inflammatory' | 'Urinalysis' | 'General';
  aliases: string[];
  standardUnit: string;
}

export const CLINICAL_TERMINOLOGY_DICTIONARY: TermMapping[] = [
  {
    canonicalName: 'Hemoglobin',
    category: 'Hematology',
    aliases: ['hb', 'hgb', 'hemoglobin', 'haemoglobin', 'hgb (hemoglobin)', 'total hemoglobin'],
    standardUnit: 'g/dL'
  },
  {
    canonicalName: 'White Blood Cell Count',
    category: 'Hematology',
    aliases: ['wbc', 'white blood cells', 'leukocyte count', 'wbc count', 'leukocytes', 'total leukocytes'],
    standardUnit: '10^3/uL'
  },
  {
    canonicalName: 'Red Blood Cell Count',
    category: 'Hematology',
    aliases: ['rbc', 'red blood cells', 'erythrocyte count', 'rbc count', 'erythrocytes'],
    standardUnit: '10^6/uL'
  },
  {
    canonicalName: 'Hematocrit',
    category: 'Hematology',
    aliases: ['hct', 'pcv', 'hematocrit', 'haematocrit', 'packed cell volume'],
    standardUnit: '%'
  },
  {
    canonicalName: 'Platelet Count',
    category: 'Hematology',
    aliases: ['plt', 'platelets', 'platelet count', 'thrombocyte count', 'thrombocytes'],
    standardUnit: '10^3/uL'
  },
  {
    canonicalName: 'Mean Corpuscular Volume',
    category: 'Hematology',
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    standardUnit: 'fL'
  },
  {
    canonicalName: 'Mean Corpuscular Hemoglobin',
    category: 'Hematology',
    aliases: ['mch', 'mean corpuscular hemoglobin', 'mean cell hemoglobin'],
    standardUnit: 'pg'
  },
  {
    canonicalName: 'MCHC',
    category: 'Hematology',
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration'],
    standardUnit: 'g/dL'
  },
  {
    canonicalName: 'Fasting Blood Sugar',
    category: 'Metabolic',
    aliases: ['fbs', 'fasting glucose', 'fasting blood sugar', 'glucose, fasting', 'blood sugar fasting', 'plasma glucose (fasting)', 'fasting blood glucose'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Random Blood Glucose',
    category: 'Metabolic',
    aliases: ['rbs', 'random glucose', 'random blood sugar', 'glucose, random', 'blood glucose (random)'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Glycated Hemoglobin (HbA1c)',
    category: 'Metabolic',
    aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'hemoglobin a1c'],
    standardUnit: '%'
  },
  {
    canonicalName: 'Serum Creatinine',
    category: 'Biochemistry',
    aliases: ['cr', 'creatinine', 'serum creatinine', 's. creatinine', 'creat'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Blood Urea Nitrogen',
    category: 'Biochemistry',
    aliases: ['bun', 'blood urea nitrogen', 'urea nitrogen', 'serum urea', 'urea'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Estimated GFR',
    category: 'Biochemistry',
    aliases: ['egfr', 'gfr', 'estimated glomerular filtration rate', 'calc egfr'],
    standardUnit: 'mL/min/1.73m2'
  },
  {
    canonicalName: 'Alanine Aminotransferase (ALT/SGPT)',
    category: 'Biochemistry',
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alt (sgpt)', 'alanine transaminase'],
    standardUnit: 'U/L'
  },
  {
    canonicalName: 'Aspartate Aminotransferase (AST/SGOT)',
    category: 'Biochemistry',
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'ast (sgot)', 'aspartate transaminase'],
    standardUnit: 'U/L'
  },
  {
    canonicalName: 'Alkaline Phosphatase',
    category: 'Biochemistry',
    aliases: ['alp', 'alk phos', 'alkaline phosphatase'],
    standardUnit: 'U/L'
  },
  {
    canonicalName: 'Total Bilirubin',
    category: 'Biochemistry',
    aliases: ['total bilirubin', 't. bili', 't. bilirubin', 'bilirubin total'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Direct Bilirubin',
    category: 'Biochemistry',
    aliases: ['direct bilirubin', 'd. bili', 'd. bilirubin', 'conjugated bilirubin'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Total Cholesterol',
    category: 'Lipid',
    aliases: ['cholesterol', 'total cholesterol', 'cholesterol, total', 'tc', 'serum cholesterol'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'HDL Cholesterol',
    category: 'Lipid',
    aliases: ['hdl', 'hdl cholesterol', 'hdl-c', 'high-density lipoprotein', 'high density lipoprotein'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'LDL Cholesterol',
    category: 'Lipid',
    aliases: ['ldl', 'ldl cholesterol', 'ldl-c', 'low-density lipoprotein', 'low density lipoprotein'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Triglycerides',
    category: 'Lipid',
    aliases: ['tg', 'triglycerides', 'serum triglycerides', 'trigs'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Serum Potassium',
    category: 'Electrolytes',
    aliases: ['k+', 'k', 'potassium', 'serum potassium', 's. potassium'],
    standardUnit: 'mEq/L'
  },
  {
    canonicalName: 'Serum Sodium',
    category: 'Electrolytes',
    aliases: ['na+', 'na', 'sodium', 'serum sodium', 's. sodium'],
    standardUnit: 'mEq/L'
  },
  {
    canonicalName: 'Serum Chloride',
    category: 'Electrolytes',
    aliases: ['cl-', 'cl', 'chloride', 'serum chloride'],
    standardUnit: 'mEq/L'
  },
  {
    canonicalName: 'Serum Calcium',
    category: 'Electrolytes',
    aliases: ['ca', 'calcium', 'serum calcium', 'total calcium'],
    standardUnit: 'mg/dL'
  },
  {
    canonicalName: 'Thyroid Stimulating Hormone (TSH)',
    category: 'Endocrine',
    aliases: ['tsh', 'thyroid stimulating hormone', 'serum tsh', 'thyrotropin', 'tsh, ultrasensitive'],
    standardUnit: 'uIU/mL'
  },
  {
    canonicalName: 'Free Thyroxine (FT4)',
    category: 'Endocrine',
    aliases: ['ft4', 'free t4', 'free thyroxine'],
    standardUnit: 'ng/dL'
  },
  {
    canonicalName: 'Serum Ferritin',
    category: 'Hematology',
    aliases: ['ferritin', 'serum ferritin', 's. ferritin'],
    standardUnit: 'ng/mL'
  },
  {
    canonicalName: 'Vitamin D (25-Hydroxy)',
    category: 'General',
    aliases: ['vitamin d', 'vit d', '25-hydroxy vitamin d', '25-oh vitamin d', 'vit d3'],
    standardUnit: 'ng/mL'
  },
  {
    canonicalName: 'Vitamin B12',
    category: 'General',
    aliases: ['vitamin b12', 'vit b12', 'b12', 'cobalamin'],
    standardUnit: 'pg/mL'
  },
  {
    canonicalName: 'C-Reactive Protein (CRP)',
    category: 'Inflammatory',
    aliases: ['crp', 'c-reactive protein', 'high sensitivity crp', 'hs-crp'],
    standardUnit: 'mg/L'
  },
  {
    canonicalName: 'Erythrocyte Sedimentation Rate (ESR)',
    category: 'Inflammatory',
    aliases: ['esr', 'erythrocyte sedimentation rate', 'sed rate'],
    standardUnit: 'mm/hr'
  },
  {
    canonicalName: 'Serum Uric Acid',
    category: 'Biochemistry',
    aliases: ['uric acid', 'serum uric acid', 'urate'],
    standardUnit: 'mg/dL'
  }
];

export function normalizeTerm(rawName: string): { canonicalName: string; category: string; standardUnit: string } {
  const clean = rawName.trim().toLowerCase().replace(/[:=]/g, '').trim();

  for (const item of CLINICAL_TERMINOLOGY_DICTIONARY) {
    if (item.canonicalName.toLowerCase() === clean) {
      return { canonicalName: item.canonicalName, category: item.category, standardUnit: item.standardUnit };
    }
    for (const alias of item.aliases) {
      if (alias.toLowerCase() === clean) {
        return { canonicalName: item.canonicalName, category: item.category, standardUnit: item.standardUnit };
      }
    }
  }

  // Fallback: title-case the cleaned string
  const formatted = rawName.trim()
    .replace(/^[-*•\s]+/, '')
    .replace(/[:=]+$/, '')
    .trim();

  return {
    canonicalName: formatted.charAt(0).toUpperCase() + formatted.slice(1),
    category: 'General',
    standardUnit: ''
  };
}
