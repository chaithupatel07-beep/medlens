import { PatientIntake } from '../types/clinical.js';

export interface SampleScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  intake: PatientIntake;
  currentReport: string;
  previousReport?: string;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'anemia_fatigue',
    name: 'Iron Deficiency & Fatigue Workup',
    badge: 'Hematology & Conflict',
    description: 'Female patient with chronic fatigue. Current CBC reveals microcytic hypochromic anemia with low Ferritin; previous report allows longitudinal comparison. Allergy conflict detected.',
    intake: {
      name: 'Jane Doe',
      age: 34,
      sex: 'Female',
      symptoms: ['Progressive fatigue', 'Post-exertional lightheadedness', 'Cold intolerance'],
      symptomDetails: 'Fatigue began 4-5 months ago, steadily worsening over past 6 weeks.',
      conditions: ['Menorrhagia (heavy menstrual cycles)'],
      allergies: ['No known allergies'],
      medications: ['Daily Multivitamin'],
      notes: 'Reports feeling exhausted even after 8 hours of sleep. No prior history of anemia discussed.',
      source: 'PATIENT_INTAKE'
    },
    currentReport: `METROPOLITAN GENERAL HOSPITAL — CLINICAL LABORATORY
Patient: Jane Doe | DOB: 14-MAY-1992 | Sex: F
Specimen: Whole Blood EDTA & Serum | Date Collected: 01-FEB-2026

COMPLETE BLOOD COUNT (CBC) & IRON PANEL
------------------------------------------------------------
Test / Parameter                Result   Unit     Reference Range
------------------------------------------------------------
Hemoglobin (Hb)                 9.8      g/dL     12.0 - 15.5
Hematocrit (Hct)                30.4     %        36.0 - 46.0
RBC Count                       3.62     10^6/uL  4.00 - 5.20
MCV                             74.2     fL       80.0 - 100.0
MCH                             24.1     pg       27.0 - 33.0
MCHC                            32.2     g/dL     32.0 - 36.0
Platelet Count (PLT)            365      10^3/uL  150 - 450
White Blood Cell Count (WBC)    6.4      10^3/uL  4.5 - 11.0
Serum Ferritin                  8.2      ng/mL    15.0 - 150.0

CLINICAL SPECIMEN OBSERVATIONS:
- Microcytosis and mild hypochromia confirmed on peripheral blood smear.
- Note from phlebotomist: Patient developed mild erythematous contact rash at tourniquet site; suspected mild latex sensitivity.`,
    previousReport: `METROPOLITAN GENERAL HOSPITAL — ARCHIVED LABORATORY RECORD
Patient: Jane Doe | Date Collected: 15-AUG-2025

ROUTINE PRE-EMPLOYMENT HEALTH PANEL
------------------------------------------------------------
Hemoglobin (Hb)                 11.4     g/dL     12.0 - 15.5
Hematocrit (Hct)                34.8     %        36.0 - 46.0
RBC Count                       4.10     10^6/uL  4.00 - 5.20
MCV                             84.5     fL       80.0 - 100.0
Platelet Count (PLT)            310      10^3/uL  150 - 450
White Blood Cell Count (WBC)    7.1      10^3/uL  4.5 - 11.0
Serum Ferritin                  24.5     ng/mL    15.0 - 150.0`
  },
  {
    id: 'diabetic_conflict',
    name: 'Diabetic Monitoring & Medication Conflict',
    badge: 'Endocrine & Allergy Conflict',
    description: 'Intake claims "No chronic illnesses" and "No known allergies", but reports Metformin use and lab demonstrates elevated HbA1c with historical Penicillin allergy in chart notes.',
    intake: {
      name: 'Robert Miller',
      age: 58,
      sex: 'Male',
      symptoms: ['Increased thirst (polydipsia)', 'Nocturia (waking 3x/night)', 'Intermittent blurry vision'],
      symptomDetails: 'Thirst and frequent urination noted for approx 2 months.',
      conditions: [],
      allergies: ['NKDA (No known drug allergies)'],
      medications: ['Metformin 1000 mg twice daily'],
      notes: 'Believes this is just a routine checkup and feels generally okay.',
      source: 'PATIENT_INTAKE'
    },
    currentReport: `VALLEY HEALTH DIAGNOSTICS — AMBULATORY CARE LAB
Patient: Robert Miller | DOB: 22-NOV-1967 | Sex: M
Date of Collection: 10-FEB-2026

METABOLIC & RENAL HEALTH PANEL
------------------------------------------------------------
Parameter                       Observed Unit     Reference Range
------------------------------------------------------------
Fasting Blood Sugar (FBS)       184      mg/dL    70 - 99
Glycated Hemoglobin (HbA1c)     8.8      %        4.0 - 5.6
Serum Creatinine (Cr)           1.18     mg/dL    0.70 - 1.30
Blood Urea Nitrogen (BUN)       19       mg/dL    7 - 20
Estimated GFR (eGFR)            72       mL/min/1.73m2  > 60
Serum Potassium (K+)            4.4      mEq/L    3.5 - 5.0
Serum Sodium (Na+)              138      mEq/L    135 - 145

FACILITY CLINICAL NOTES:
- Fasting status at time of phlebotomy: Patient reported having a light coffee with sugar 2 hours prior to draw.
- Previous chart allergy record (Urgent Care, July 2022): Patient experienced diffuse urticarial rash and facial pruritus following Amoxicillin/Penicillin administration. Chart flagged: PENICILLIN ALLERGY documented.`,
    previousReport: `VALLEY HEALTH DIAGNOSTICS — HISTORICAL RECORD
Date of Collection: 14-JAN-2025

Parameter                       Observed Unit     Reference Range
------------------------------------------------------------
Fasting Blood Sugar (FBS)       132      mg/dL    70 - 99
Glycated Hemoglobin (HbA1c)     7.1      %        4.0 - 5.6
Serum Creatinine (Cr)           1.05     mg/dL    0.70 - 1.30
Estimated GFR (eGFR)            81       mL/min/1.73m2  > 60`
  },
  {
    id: 'cardiac_longitudinal',
    name: 'Cardiac Risk & Statin Longitudinal Response',
    badge: 'Cardiovascular & Longitudinal',
    description: 'Patient initiated on Statin therapy 6 months ago. Side-by-side longitudinal comparison shows significant LDL reduction with slight transaminase shift.',
    intake: {
      name: 'Marcus Chen',
      age: 62,
      sex: 'Male',
      symptoms: ['Mild bilateral calf tightness when walking uphill'],
      symptomDetails: 'Calf discomfort relieves within 5 minutes of resting.',
      conditions: ['Essential Hypertension', 'Dyslipidemia'],
      allergies: ['Sulfa drugs (causes hives)'],
      medications: ['Atorvastatin 20 mg once daily', 'Lisinopril 10 mg once daily', 'Baby Aspirin 81 mg'],
      notes: 'Follow-up lab visit to check cholesterol response to Atorvastatin prescribed 6 months ago.',
      source: 'PATIENT_INTAKE'
    },
    currentReport: `CITY HEART & VASCULAR INSTITUTE — COMPREHENSIVE LIPID & HEPATIC PANEL
Patient: Marcus Chen | Date: 12-FEB-2026 | Sex: M

Test Name                       Value    Unit     Reported Reference Range
------------------------------------------------------------
Total Cholesterol (TC)          168      mg/dL    < 200
LDL Cholesterol                 88       mg/dL    < 100
HDL Cholesterol                 48       mg/dL    > 40
Triglycerides (TG)              145      mg/dL    < 150
ALT (SGPT)                      52       U/L      7 - 56
AST (SGOT)                      44       U/L      10 - 40
Serum Potassium (K+)            4.7      mEq/L    3.5 - 5.0
Serum Creatinine                1.02     mg/dL    0.70 - 1.30

NOTES:
- Overnight 12-hour fast confirmed by patient.
- Hepatic enzymes mildly elevated compared to baseline, within acceptable monitoring threshold.`,
    previousReport: `CITY HEART & VASCULAR INSTITUTE — BASELINE LIPID PANEL (PRE-STATIN)
Patient: Marcus Chen | Date: 10-AUG-2025

Test Name                       Value    Unit     Reported Reference Range
------------------------------------------------------------
Total Cholesterol (TC)          248      mg/dL    < 200
LDL Cholesterol                 165      mg/dL    < 100
HDL Cholesterol                 42       mg/dL    > 40
Triglycerides (TG)              210      mg/dL    < 150
ALT (SGPT)                      26       U/L      7 - 56
AST (SGOT)                      22       U/L      10 - 40
Serum Potassium (K+)            4.5      mEq/L    3.5 - 5.0
Serum Creatinine                0.98     mg/dL    0.70 - 1.30`
  },
  {
    id: 'blank',
    name: 'Custom / Blank Record',
    badge: 'Interactive Input',
    description: 'Start with an empty intake form and report paste area to enter your own custom clinical case or upload PDF/text documents.',
    intake: {
      name: '',
      age: '',
      sex: 'Male',
      symptoms: [],
      symptomDetails: '',
      conditions: [],
      allergies: [],
      medications: [],
      notes: '',
      source: 'PATIENT_INTAKE'
    },
    currentReport: '',
    previousReport: ''
  }
];
