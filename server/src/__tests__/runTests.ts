import { normalizeTerm } from '../services/terminology.js';
import { ClinicalEngine } from '../services/clinicalEngine.js';
import { LongitudinalService } from '../services/longitudinalService.js';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`, failureDetails ? JSON.stringify(failureDetails) : '');
    failed++;
  }
}

console.log('====================================================');
console.log('   RUNNING MEDLENS CLINICAL INTELLIGENCE TEST SUITE  ');
console.log('====================================================\n');

// 1. Terminology Normalization Tests
console.log('1. Testing Terminology Normalization:');
const t1 = normalizeTerm('Hb');
assert(t1.canonicalName === 'Hemoglobin', 'Hb normalizes to Hemoglobin', t1);

const t2 = normalizeTerm('HGB');
assert(t2.canonicalName === 'Hemoglobin', 'HGB normalizes to Hemoglobin', t2);

const t3 = normalizeTerm('FBS');
assert(t3.canonicalName === 'Fasting Blood Sugar', 'FBS normalizes to Fasting Blood Sugar', t3);

const t4 = normalizeTerm('s. creatinine');
assert(t4.canonicalName === 'Serum Creatinine', 's. creatinine normalizes to Serum Creatinine', t4);

const t5 = normalizeTerm('WBC count');
assert(t5.canonicalName === 'White Blood Cell Count', 'WBC count normalizes to White Blood Cell Count', t5);

const t6 = normalizeTerm('UnknownCustomTest');
assert(t6.canonicalName === 'UnknownCustomTest', 'Fallback handles custom/unregistered terms gracefully');

// 2. Reference Range Parsing Tests
console.log('\n2. Testing Reference Range Parsing:');
const r1 = ClinicalEngine.parseReferenceRange('12.0 - 15.5');
assert(r1?.low === 12.0 && r1?.high === 15.5, 'Parses range "12.0 - 15.5"', r1);

const r2 = ClinicalEngine.parseReferenceRange('< 200');
assert(r2?.high === 200 && r2?.low === undefined, 'Parses upper bound "< 200"', r2);

const r3 = ClinicalEngine.parseReferenceRange('> 60');
assert(r3?.low === 60 && r3?.high === undefined, 'Parses lower bound "> 60"', r3);

const r4 = ClinicalEngine.parseReferenceRange('');
assert(r4 === undefined, 'Empty range returns undefined');

// 3. Status Evaluation & Reference Range Hallucination Safeguard
console.log('\n3. Testing Status Evaluation & Non-Hallucination Guardrail:');
const sNormal = ClinicalEngine.evaluateStatus(13.5, '13.5', 'Hemoglobin', { low: 12.0, high: 15.5, text: '12.0 - 15.5' });
assert(sNormal.status === 'NORMAL', '13.5 in [12.0, 15.5] is NORMAL', sNormal);

const sLow = ClinicalEngine.evaluateStatus(9.8, '9.8', 'Hemoglobin', { low: 12.0, high: 15.5, text: '12.0 - 15.5' });
assert(sLow.status === 'BELOW_RANGE', '9.8 in [12.0, 15.5] is BELOW_RANGE', sLow);

const sHigh = ClinicalEngine.evaluateStatus(185, '185', 'Fasting Blood Sugar', { low: 70, high: 99, text: '70 - 99' });
assert(sHigh.status === 'ABOVE_RANGE', '185 in [70, 99] is ABOVE_RANGE', sHigh);

// CRITICAL REQUIREMENT: Must not invent reference ranges when they are not present in source report!
const sNoRange = ClinicalEngine.evaluateStatus(10.2, '10.2', 'Hemoglobin', undefined);
assert(sNoRange.status === 'NO_RANGE_PROVIDED', 'STRICT GUARD: Missing reference range returns NO_RANGE_PROVIDED without hallucinating ranges', sNoRange);
assert(sNoRange.statusText === 'No reference range in source report', 'Clear explicit status text for missing range');

// Critical panic value
const sCritLow = ClinicalEngine.evaluateStatus(2.4, '2.4', 'Serum Potassium', { low: 3.5, high: 5.0, text: '3.5 - 5.0' });
assert(sCritLow.status === 'CRITICAL_LOW', 'Potassium 2.4 triggers CRITICAL_LOW warning', sCritLow);

// 4. Lab Report Parsing from Unstructured Text
console.log('\n4. Testing Unstructured Lab Report Extraction:');
const sampleText = `
COMPLETE BLOOD COUNT
Hemoglobin: 10.2 g/dL (Ref: 13.0 - 17.0)
WBC: 8100 10^3/uL (Ref: 4500 - 11000)
Platelets: 240 10^3/uL (Ref: 150 - 450)
Random Observation Note: Mild pallor
`;
const parsedParams = ClinicalEngine.parseLabReport(sampleText, 'CURRENT_REPORT');
assert(parsedParams.length === 3, `Extracted 3 lab parameters (found ${parsedParams.length})`);
const hbParam = parsedParams.find(p => p.canonicalName === 'Hemoglobin');
assert(hbParam?.observedValue === 10.2, 'Extracted Hemoglobin value 10.2');
assert(hbParam?.status === 'BELOW_RANGE', 'Hemoglobin status is BELOW_RANGE');
assert(Boolean(hbParam?.sourceSnippet?.includes('Hemoglobin: 10.2')), 'Source snippet preserved for provenance');

// 5. Conflict & Inconsistency Detection
console.log('\n5. Testing Inconsistency & Conflict Detection:');
const testIntake = {
  name: 'Test Patient',
  age: 45,
  sex: 'Male',
  symptoms: ['Fatigue'],
  conditions: [],
  allergies: ['No known allergies'],
  medications: ['Metformin 500mg'],
  notes: '',
  source: 'PATIENT_INTAKE' as const
};
const conflicts = ClinicalEngine.detectConflicts(
  testIntake,
  parsedParams,
  'Patient had prior documented reaction: Penicillin allergy noted.'
);
const allergyConflict = conflicts.find(c => c.type === 'ALLERGY_MISMATCH');
assert(!!allergyConflict, 'Flags allergy contradiction: Intake claims NKDA but records note Penicillin allergy');

const medConflict = conflicts.find(c => c.type === 'MEDICATION_DISCREPANCY');
assert(!!medConflict, 'Flags medication contradiction: Metformin listed with no documented Diabetes condition');

// 6. Clarification Questions Generation
console.log('\n6. Testing Context-Aware Clarification Questions:');
const questions = ClinicalEngine.generateClarificationQuestions(testIntake, parsedParams, conflicts);
assert(questions.length >= 3 && questions.length <= 5, `Generates 3-5 questions (generated ${questions.length})`);
assert(questions.some(q => q.topic.includes('Allergy')), 'Generates allergy reconciliation question');
assert(questions.some(q => q.topic.includes('Chronology')), 'Generates symptom chronology question');

// 7. Longitudinal Comparison Engine
console.log('\n7. Testing Longitudinal Comparison:');
const current = ClinicalEngine.parseLabReport(`
Hemoglobin: 10.2 g/dL (Ref: 13.0 - 17.0)
WBC: 8100 10^3/uL (Ref: 4500 - 11000)
`);
const previous = ClinicalEngine.parseLabReport(`
Hemoglobin: 11.1 g/dL (Ref: 13.0 - 17.0)
WBC: 7200 10^3/uL (Ref: 4500 - 11000)
`);
const comparison = LongitudinalService.compareReports(current, previous);
assert(comparison.length === 2, `Compared 2 matched parameters`);
const hbComp = comparison.find(c => c.canonicalName === 'Hemoglobin');
assert(hbComp?.numericDelta === -0.9, `Hemoglobin change is -0.9 (got ${hbComp?.numericDelta})`);
assert(hbComp?.trend === 'DECREASED', `Hemoglobin trend is DECREASED`);

const wbcComp = comparison.find(c => c.canonicalName === 'White Blood Cell Count');
assert(wbcComp?.numericDelta === 900, `WBC change is +900 (got ${wbcComp?.numericDelta})`);
assert(wbcComp?.trend === 'INCREASED', `WBC trend is INCREASED`);

// 8. Preset Sample Scenarios Verification
console.log('\n8. Testing Sample Scenarios Integrity:');
assert(SAMPLE_SCENARIOS.length === 4, `All 4 scenarios loaded`);
const anemiaScenario = SAMPLE_SCENARIOS.find(s => s.id === 'anemia_fatigue');
assert(!!anemiaScenario?.currentReport && !!anemiaScenario?.previousReport, 'Anemia scenario has current and previous reports');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
