import {
  LabParameter,
  ParameterStatus,
  PatientIntake,
  ClinicalConflict,
  ClarificationQuestion,
  ReferenceRange
} from '../types/clinical.js';
import { normalizeTerm } from './terminology.js';

export class ClinicalEngine {

  /**
   * Parse reference range string into structured low/high bounds
   */
  public static parseReferenceRange(rangeStr: string): ReferenceRange | undefined {
    if (!rangeStr) return undefined;
    const clean = rangeStr.trim();
    if (!clean) return undefined;

    // Pattern 1: "13.0 - 17.0" or "13 - 17" or "13.0 to 17.0" or "13.0-17.0"
    const dashMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i);
    if (dashMatch) {
      const low = parseFloat(dashMatch[1]);
      const high = parseFloat(dashMatch[2]);
      return { low, high, text: clean, sourceText: clean };
    }

    // Pattern 2: "< 200" or "<= 200"
    const lessMatch = clean.match(/^(?:<|<=|less than)\s*(\d+(?:\.\d+)?)/i);
    if (lessMatch) {
      return { high: parseFloat(lessMatch[1]), text: clean, sourceText: clean };
    }

    // Pattern 3: "> 60" or ">= 60"
    const greaterMatch = clean.match(/^(?:>|>=|greater than)\s*(\d+(?:\.\d+)?)/i);
    if (greaterMatch) {
      return { low: parseFloat(greaterMatch[1]), text: clean, sourceText: clean };
    }

    // Pattern 4: Descriptive or non-numeric (e.g. "Negative", "Non-reactive")
    return { text: clean, sourceText: clean };
  }

  /**
   * Evaluate value against reference range.
   * STRICT GUARD: If no range is provided, MedLens does NOT invent one!
   */
  public static evaluateStatus(
    valNum: number | null,
    valStr: string,
    canonicalName: string,
    refRange?: ReferenceRange
  ): { status: ParameterStatus; statusText: string } {
    if (!refRange || (!refRange.low && !refRange.high && !refRange.text)) {
      return {
        status: 'NO_RANGE_PROVIDED',
        statusText: 'No reference range in source report'
      };
    }

    if (valNum === null || isNaN(valNum)) {
      // Qualitative comparison (e.g. Negative vs Positive)
      if (refRange.text) {
        const normVal = valStr.toLowerCase().trim();
        const normRef = refRange.text.toLowerCase().trim();
        if (normRef.includes('negative') || normRef.includes('non-reactive')) {
          if (normVal.includes('positive') || normVal.includes('reactive')) {
            return { status: 'ABOVE_RANGE', statusText: 'Reactive / Positive outside reference expectations' };
          }
          if (normVal.includes('negative') || normVal.includes('non-reactive')) {
            return { status: 'NORMAL', statusText: 'Within reported normal qualitative criteria' };
          }
        }
      }
      return { status: 'NORMAL', statusText: 'Qualitative observation recorded' };
    }

    // Critical panic value thresholds
    if (canonicalName.includes('Potassium')) {
      if (valNum < 2.8) return { status: 'CRITICAL_LOW', statusText: 'CRITICAL LOW: Severe hypokalemia threshold' };
      if (valNum > 6.0) return { status: 'CRITICAL_HIGH', statusText: 'CRITICAL HIGH: Severe hyperkalemia threshold' };
    }
    if (canonicalName.includes('Platelet') && valNum < 30) {
      return { status: 'CRITICAL_LOW', statusText: 'CRITICAL LOW: Severe thrombocytopenia threshold' };
    }
    if (canonicalName.includes('Hemoglobin') && valNum < 7.0) {
      return { status: 'CRITICAL_LOW', statusText: 'CRITICAL LOW: Severe anemia threshold' };
    }
    if (canonicalName.includes('Glucose') && valNum > 350) {
      return { status: 'CRITICAL_HIGH', statusText: 'CRITICAL HIGH: Severe hyperglycemia threshold' };
    }

    // Numeric comparison against reported reference range
    if (refRange.low !== undefined && refRange.high !== undefined) {
      if (valNum < refRange.low) {
        return { status: 'BELOW_RANGE', statusText: 'Below reported reference range' };
      }
      if (valNum > refRange.high) {
        return { status: 'ABOVE_RANGE', statusText: 'Above reported reference range' };
      }
      return { status: 'NORMAL', statusText: 'Within reported reference range' };
    }

    if (refRange.high !== undefined && refRange.low === undefined) {
      if (valNum > refRange.high) {
        return { status: 'ABOVE_RANGE', statusText: 'Above reported reference range' };
      }
      return { status: 'NORMAL', statusText: 'Within reported reference range' };
    }

    if (refRange.low !== undefined && refRange.high === undefined) {
      if (valNum < refRange.low) {
        return { status: 'BELOW_RANGE', statusText: 'Below reported reference range' };
      }
      return { status: 'NORMAL', statusText: 'Within reported reference range' };
    }

    return {
      status: 'NO_RANGE_PROVIDED',
      statusText: 'No reference range in source report'
    };
  }

  /**
   * Deterministic Lab Report Parser
   * Parses line-by-line lab report tables or lists with regex tokenization
   */
  public static parseLabReport(
    reportText: string,
    sourceTag: 'CURRENT_REPORT' | 'PREVIOUS_REPORT' = 'CURRENT_REPORT'
  ): LabParameter[] {
    const results: LabParameter[] = [];
    if (!reportText) return results;

    const lines = reportText.split(/\r?\n/);
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.length < 3) continue;

      // Skip non-lab header lines
      if (
        /^(patient name|date|dob|age|sex|doctor|physician|sample|specimen|lab id|test name\s+result)/i.test(line) &&
        !/[:=]\s*\d+/.test(line)
      ) {
        continue;
      }

      // Extraction regex strategies
      // Strategy 1: Look for explicit parenthesized or bracketed reference range:
      // (Ref: 13.0 - 17.0) or [13-17] or (Range: < 200) or Ref: 13.0 - 17.0
      let paramName = '';
      let observedVal = '';
      let unit = '';
      let refStr = '';
      let matched = false;

      // Skip lines that are notes or comments
      if (/^(note|comments?|interpretation|specimen|clinical observation|facility|date)/i.test(line)) {
        continue;
      }

      // Check for reference range
      const refMatch = line.match(/(?:\(|\[|\{)\s*(?:Ref(?:erence)?|Range)?\s*[:=]?\s*([0-9\.<>\-–— to]+[a-zA-Z/%^0-9\s]*|[a-zA-Z]+)\s*(?:\)|\]|\})/i)
        || line.match(/(?:Ref(?:erence)?|Range)\s*[:=]?\s*([0-9\.<>\-–— to]+|[a-zA-Z]+)/i);

      let lineWithoutRef = line;
      if (refMatch) {
        refStr = refMatch[1].trim();
        lineWithoutRef = line.replace(refMatch[0], '').trim();
      }

      // Pattern A: key : value unit
      const colonMatch = lineWithoutRef.match(/^([^:=|\t]+?)\s*[:=]\s*([<>]?\s*\d+(?:\.\d+)?|[a-zA-Z]+)(?:\s+([a-zA-Z/%^0-9\-_]+))?$/i);
      if (colonMatch && colonMatch[1] && colonMatch[2]) {
        paramName = colonMatch[1].trim();
        observedVal = colonMatch[2].trim();
        unit = (colonMatch[3] || '').trim();
        matched = true;
      }

      // Pattern B: Tab / Multi-space separated columns
      if (!matched) {
        const parts = lineWithoutRef.split(/\t+|\s{2,}/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const first = parts[0];
          const second = parts[1];
          if (/^[<>]?\s*\d+(?:\.\d+)?$/i.test(second) || /^(negative|positive|reactive|non-reactive|normal)$/i.test(second)) {
            paramName = first;
            observedVal = second;
            if (parts.length >= 3) unit = parts[2];
            if (parts.length >= 4 && !refStr) refStr = parts[3];
            matched = true;
          }
        }
      }

      if (matched && paramName && observedVal) {
        // Clean paramName
        paramName = paramName.replace(/^[-*•\d\.\s]+/, '').trim();
        if (paramName.length < 2 || /^(note|comments?|interpretation|method|flag|random observation)/i.test(paramName)) {
          continue;
        }

        const normalized = normalizeTerm(paramName);
        const numVal = parseFloat(observedVal.replace(/^[<>]/, '').trim());
        const refRange = refStr ? this.parseReferenceRange(refStr) : undefined;
        const evaluation = this.evaluateStatus(
          isNaN(numVal) ? null : numVal,
          observedVal,
          normalized.canonicalName,
          refRange
        );

        results.push({
          id: `param_${sourceTag.toLowerCase()}_${idCounter++}`,
          canonicalName: normalized.canonicalName,
          sourceTerm: paramName,
          observedValue: isNaN(numVal) ? observedVal : numVal,
          unit: unit || normalized.standardUnit || '',
          referenceRange: refRange,
          status: evaluation.status,
          statusText: evaluation.statusText,
          source: sourceTag,
          sourceSnippet: line,
          lineNumber: i + 1,
          confidence: 'HIGH',
          confidenceReason: refRange ? 'Exact match with reported reference range' : 'Extracted parameter (no reference range reported in source)'
        });
      }
    }

    return results;
  }

  /**
   * Detect Inconsistencies & Conflicts across Patient Intake and Reports
   */
  public static detectConflicts(
    intake: PatientIntake,
    labResults: LabParameter[],
    rawReportText: string,
    previousReportText?: string
  ): ClinicalConflict[] {
    const conflicts: ClinicalConflict[] = [];
    let conflictId = 1;

    const fullReportText = `${rawReportText || ''} ${previousReportText || ''}`.toLowerCase();

    // Conflict Type 1: Allergy Discrepancies
    // Check if intake claims "no allergies" or "NKDA"
    const intakeClaimsNoAllergies = intake.allergies.some(a =>
      /^(no known allergies|no allergies|nkda|none|nil|n\/a)$/i.test(a.trim())
    ) || intake.allergies.length === 0;

    const allergyTerms = [
      { drug: 'penicillin', pattern: /penicillin|amoxicillin|ampicillin/i },
      { drug: 'sulfa', pattern: /sulfa|sulfonamide|bactrim|septra/i },
      { drug: 'latex', pattern: /latex allergy|sensitive to latex/i },
      { drug: 'aspirin', pattern: /aspirin allergy|nsaid allergy/i },
      { drug: 'codeine', pattern: /codeine allergy|opioid allergy/i }
    ];

    for (const item of allergyTerms) {
      const foundInReport = item.pattern.test(fullReportText);
      const intakeMentionsDrug = intake.allergies.some(a => item.pattern.test(a));

      if (foundInReport && intakeClaimsNoAllergies && !intakeMentionsDrug) {
        // Extract surrounding context from report text
        const match = fullReportText.match(new RegExp(`(?:.{0,40})?${item.drug}(?:.{0,40})?`, 'i'));
        const snippet = match ? match[0].trim() : `${item.drug} documented in records`;

        conflicts.push({
          id: `conflict_${conflictId++}`,
          type: 'ALLERGY_MISMATCH',
          severity: 'HIGH',
          title: `Allergy Discrepancy: ${item.drug.toUpperCase()}`,
          description: `Patient intake indicates no known allergies, but medical records/notes document a potential ${item.drug} sensitivity or allergy. Clarification is required before administering or prescribing related agents.`,
          sourceA: {
            origin: 'Patient Intake Form',
            text: intake.allergies.length > 0 ? intake.allergies.join(', ') : 'No known allergies reported'
          },
          sourceB: {
            origin: 'Medical Records / Report Notes',
            text: snippet
          },
          status: 'unresolved'
        });
      }
    }

    // Conflict Type 2: Medication vs Condition Discrepancies
    const conditionsStr = intake.conditions.join(' ').toLowerCase();
    const medsStr = intake.medications.join(' ').toLowerCase();

    // Diabetic medication without diabetic condition
    if (/metformin|glipizide|insulin|januvia|ozempic| Jardiance/i.test(medsStr)) {
      if (!/diabet|t2dm|t1dm|glucose intolerance|hyperglycemia/i.test(conditionsStr)) {
        conflicts.push({
          id: `conflict_${conflictId++}`,
          type: 'MEDICATION_DISCREPANCY',
          severity: 'MEDIUM',
          title: 'Medication without Corresponding Condition: Antidiabetic Therapy',
          description: 'Patient reports taking antidiabetic medication (e.g. Metformin/Insulin), but no history of Diabetes or Impaired Glucose Tolerance was specified in the intake conditions.',
          sourceA: {
            origin: 'Patient Medications',
            text: intake.medications.filter(m => /metformin|glipizide|insulin|januvia|ozempic/i.test(m)).join(', ')
          },
          sourceB: {
            origin: 'Patient Medical Conditions',
            text: intake.conditions.length > 0 ? intake.conditions.join(', ') : 'None listed'
          },
          status: 'unresolved'
        });
      }
    }

    // Thyroid medication without thyroid condition
    if (/levothyroxine|synthroid|methimazole/i.test(medsStr)) {
      if (!/thyroid|hypothyroid|hyperthyroid|hashimoto/i.test(conditionsStr)) {
        conflicts.push({
          id: `conflict_${conflictId++}`,
          type: 'MEDICATION_DISCREPANCY',
          severity: 'MEDIUM',
          title: 'Medication without Corresponding Condition: Thyroid Therapy',
          description: 'Patient reports taking thyroid medication (e.g. Levothyroxine), but no thyroid condition is documented in medical history.',
          sourceA: {
            origin: 'Patient Medications',
            text: intake.medications.filter(m => /levothyroxine|synthroid|methimazole/i.test(m)).join(', ')
          },
          sourceB: {
            origin: 'Patient Medical Conditions',
            text: intake.conditions.length > 0 ? intake.conditions.join(', ') : 'None listed'
          },
          status: 'unresolved'
        });
      }
    }

    // Statin / Lipid therapy without dyslipidemia
    if (/atorvastatin|rosuvastatin|simvastatin|lipitor/i.test(medsStr)) {
      if (!/cholesterol|hyperlipidemia|lipid|dyslipidemia|cad|heart/i.test(conditionsStr)) {
        conflicts.push({
          id: `conflict_${conflictId++}`,
          type: 'MEDICATION_DISCREPANCY',
          severity: 'LOW',
          title: 'Medication without Listed Condition: Statin / Lipid Lowering',
          description: 'Patient is prescribed a lipid-lowring agent (statin), but hyperlipidemia or cardiovascular risk was not listed in intake conditions.',
          sourceA: {
            origin: 'Patient Medications',
            text: intake.medications.filter(m => /statin|lipitor/i.test(m)).join(', ')
          },
          sourceB: {
            origin: 'Patient Medical Conditions',
            text: intake.conditions.length > 0 ? intake.conditions.join(', ') : 'None listed'
          },
          status: 'unresolved'
        });
      }
    }

    // Conflict Type 3: Severe Laboratory Findings vs Intake "No Conditions"
    const a1c = labResults.find(r => r.canonicalName.includes('Glycated Hemoglobin'));
    if (a1c && typeof a1c.observedValue === 'number' && a1c.observedValue >= 8.0) {
      if (!/diabet|t2dm|t1dm|glucose/i.test(conditionsStr)) {
        conflicts.push({
          id: `conflict_${conflictId++}`,
          type: 'LAB_CONDITION_MISMATCH',
          severity: 'HIGH',
          title: 'Marked Laboratory Abnormality vs Unreported Condition (HbA1c)',
          description: `Laboratory test demonstrates significantly elevated HbA1c (${a1c.observedValue}%), while patient intake states no prior history of diabetes. Clarify whether this represents a new finding or undocumented pre-existing condition.`,
          sourceA: {
            origin: 'Laboratory Results',
            text: `HbA1c: ${a1c.observedValue}% (${a1c.statusText})`
          },
          sourceB: {
            origin: 'Patient Intake Conditions',
            text: intake.conditions.length > 0 ? intake.conditions.join(', ') : 'No chronic conditions listed'
          },
          status: 'unresolved'
        });
      }
    }

    return conflicts;
  }

  /**
   * Generate 3-5 Context-Aware Clarification Questions
   * Strictly framed as clarification questions, NOT medical advice.
   */
  public static generateClarificationQuestions(
    intake: PatientIntake,
    labResults: LabParameter[],
    conflicts: ClinicalConflict[]
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];
    let qId = 1;

    // 1. Conflict-driven questions
    for (const conflict of conflicts) {
      if (conflict.type === 'ALLERGY_MISMATCH') {
        questions.push({
          id: `cq_${qId++}`,
          topic: 'Allergy Verification',
          question: `Medical records note a potential reaction or sensitivity to ${conflict.title.replace('Allergy Discrepancy: ', '')}. Have you ever experienced hives, swelling, rash, or breathing difficulties after taking this medication?`,
          clinicalRationale: 'Reconciles discrepancy between patient intake and historical documentation to ensure patient safety.',
          priority: 'HIGH'
        });
      } else if (conflict.type === 'MEDICATION_DISCREPANCY') {
        questions.push({
          id: `cq_${qId++}`,
          topic: 'Medication Indication',
          question: `You noted taking medication without a listed medical condition. What specific health condition was this medication originally prescribed to treat?`,
          clinicalRationale: 'Ensures comprehensive problem list alignment with active pharmacotherapy.',
          priority: 'MEDIUM'
        });
      }
    }

    // 2. Fasting status for metabolic / lipid tests
    const hasFastingTests = labResults.some(r =>
      r.canonicalName.includes('Glucose') ||
      r.canonicalName.includes('Triglycerides') ||
      r.canonicalName.includes('Lipid')
    );
    if (hasFastingTests && !intake.notes?.toLowerCase().includes('fasting')) {
      questions.push({
        id: `cq_${qId++}`,
        topic: 'Test Preparation / Fasting State',
        question: 'Were you fasting (no food or drinks other than water for 8 to 12 hours) when your blood sample was drawn?',
        clinicalRationale: 'Fasting status directly impacts the accurate interpretation of blood glucose and lipid fractions.',
        priority: 'HIGH'
      });
    }

    // 3. Symptoms chronology & severity
    if (intake.symptoms.length > 0) {
      const primarySymptom = intake.symptoms[0];
      questions.push({
        id: `cq_${qId++}`,
        topic: 'Symptom Chronology',
        question: `Regarding the concern of "${primarySymptom}", approximately when did this symptom first start, how often does it happen, and has it gotten more severe recently?`,
        clinicalRationale: 'Gathers essential temporal trajectory to contextualize the clinical intake.',
        priority: 'HIGH'
      });
    } else {
      questions.push({
        id: `cq_${qId++}`,
        topic: 'Chief Concern Context',
        question: 'What is the primary reason or health goal for your medical review today?',
        clinicalRationale: 'Establishes clear visit priorities for the reviewing clinician.',
        priority: 'MEDIUM'
      });
    }

    // 4. Out of range lab follow-up (e.g. Anemia / Low Hemoglobin)
    const lowHb = labResults.find(r => r.canonicalName.includes('Hemoglobin') && r.status === 'BELOW_RANGE');
    if (lowHb) {
      questions.push({
        id: `cq_${qId++}`,
        topic: 'Fatigue / Blood Loss Screen',
        question: 'Have you noticed any unexpected fatigue, dizziness, shortness of breath on exertion, or any signs of unusual bleeding or dark stools?',
        clinicalRationale: 'Clarifies whether low hemoglobin is accompanied by acute or chronic clinical indicators.',
        priority: 'HIGH'
      });
    }

    // Limit to top 5 questions
    return questions.slice(0, 5);
  }

  /**
   * Generate an Objective, Non-Diagnostic Clinical Summary
   * STRICT SAFETY RULE: No disease diagnosis, no prescription advice!
   */
  public static generateSummary(
    intake: PatientIntake,
    labResults: LabParameter[],
    conflicts: ClinicalConflict[],
    clarifications: ClarificationQuestion[]
  ) {
    const abnormalResults = labResults.filter(r => r.status === 'BELOW_RANGE' || r.status === 'ABOVE_RANGE' || r.status === 'CRITICAL_LOW' || r.status === 'CRITICAL_HIGH');
    const normalResults = labResults.filter(r => r.status === 'NORMAL');

    const keyFindings = abnormalResults.map(r => {
      const refText = r.referenceRange?.text ? ` (Reported Range: ${r.referenceRange.text})` : ' (No reference range provided in report)';
      return `${r.canonicalName}: ${r.observedValue} ${r.unit} — ${r.statusText}${refText}`;
    });

    const normalFindings = normalResults.map(r => {
      return `${r.canonicalName}: ${r.observedValue} ${r.unit} — Within reported reference range`;
    });

    const potentialInconsistencies = conflicts.map(c => `${c.title}: ${c.description}`);
    const actionItems = clarifications.map(q => `[${q.topic}] ${q.question}`);

    const patientOverview = `Patient ${intake.name || 'Anonymous'}, ${intake.age || 'Unspecified'} y/o ${intake.sex || 'individual'}. Intake records ${intake.symptoms.length > 0 ? intake.symptoms.join(', ') : 'no active symptoms'}, ${intake.conditions.length > 0 ? intake.conditions.join(', ') : 'no documented prior conditions'}, taking ${intake.medications.length > 0 ? intake.medications.join(', ') : 'no current medications'}. Total of ${labResults.length} laboratory parameter(s) evaluated against reported reference ranges.`;

    return {
      patientOverview,
      keyFindings: keyFindings.length > 0 ? keyFindings : ['All reported laboratory values fall within their respective documented reference ranges.'],
      normalFindings: normalFindings.length > 0 ? normalFindings : ['No laboratory values with documented normal ranges were recorded.'],
      potentialInconsistencies: potentialInconsistencies.length > 0 ? potentialInconsistencies : ['No contradictions identified between intake form and submitted reports.'],
      actionItemsForClinician: actionItems.length > 0 ? actionItems : ['Review baseline records and confirm patient identity.'],
      disclaimer: 'CLINICAL INFORMATION NOTICE: MedLens is an organization and intelligence assistant designed to support health data review. MedLens DOES NOT provide medical diagnoses, treatment decisions, or medication advice. All information and flags must be independently verified by a licensed healthcare professional.'
    };
  }
}
