export type ParameterStatus =
  | 'BELOW_RANGE'
  | 'NORMAL'
  | 'ABOVE_RANGE'
  | 'CRITICAL_LOW'
  | 'CRITICAL_HIGH'
  | 'NO_RANGE_PROVIDED';

export type ProvenanceSource =
  | 'PATIENT_INTAKE'
  | 'CURRENT_REPORT'
  | 'PREVIOUS_REPORT'
  | 'AI_SYNTHESIS'
  | 'HUMAN_VERIFIED';

export interface ReferenceRange {
  low?: number;
  high?: number;
  text?: string;
  sourceText?: string;
}

export interface LabParameter {
  id: string;
  canonicalName: string;
  sourceTerm: string;
  observedValue: number | string;
  unit: string;
  referenceRange?: ReferenceRange;
  status: ParameterStatus;
  statusText: string;
  source: ProvenanceSource;
  sourceSnippet?: string;
  lineNumber?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason?: string;
  isEdited?: boolean;
  notes?: string;
}

export interface PatientIntake {
  id?: string;
  name: string;
  age: number | string;
  sex: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | string;
  symptoms: string[];
  symptomDetails?: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string;
  source: ProvenanceSource;
}

export interface ClinicalConflict {
  id: string;
  type: 'ALLERGY_MISMATCH' | 'MEDICATION_DISCREPANCY' | 'HISTORY_CONFLICT' | 'LAB_CONDITION_MISMATCH' | 'TEMPORAL_ANOMALY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  sourceA: {
    origin: string;
    text: string;
  };
  sourceB: {
    origin: string;
    text: string;
  };
  status: 'unresolved' | 'acknowledged' | 'resolved';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ClarificationQuestion {
  id: string;
  topic: string;
  question: string;
  clinicalRationale: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  patientResponse?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  fieldModified: string;
  previousValue: any;
  newValue: any;
  reason?: string;
  author: string;
}

export interface LongitudinalItem {
  canonicalName: string;
  sourceTerm: string;
  previousValue: number | string;
  currentValue: number | string;
  unit: string;
  numericDelta?: number;
  percentChange?: number;
  trend: 'INCREASED' | 'DECREASED' | 'STABLE' | 'NON_NUMERIC';
  previousRange?: string;
  currentRange?: string;
  previousStatus: ParameterStatus;
  currentStatus: ParameterStatus;
  clinicalSignificance?: string;
}

export interface StructuredPatientRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  reportDate?: string;
  facilityName?: string;
  patientInfo: PatientIntake;
  symptoms: string[];
  conditions: string[];
  allergies: string[];
  medications: string[];
  labResults: LabParameter[];
  additionalObservations: string[];
  conflicts: ClinicalConflict[];
  clarificationQuestions: ClarificationQuestion[];
  summary: {
    patientOverview: string;
    keyFindings: string[];
    normalFindings: string[];
    potentialInconsistencies: string[];
    actionItemsForClinician: string[];
    disclaimer: string;
  };
  longitudinalComparison?: LongitudinalItem[];
  rawReports: {
    currentReportText: string;
    previousReportText?: string;
  };
  verification: {
    isVerified: boolean;
    verifiedBy?: string;
    verifiedRole?: string;
    verifiedAt?: string;
    signatureNote?: string;
  };
  auditLog: AuditEntry[];
}

export interface SampleScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  intake: PatientIntake;
  currentReport: string;
  previousReport?: string;
}
