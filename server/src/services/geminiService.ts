import { GoogleGenAI } from '@google/genai';
import {
  PatientIntake,
  LabParameter,
  ClinicalConflict,
  ClarificationQuestion,
  StructuredPatientRecord
} from '../types/clinical.js';
import { ClinicalEngine } from './clinicalEngine.js';
import { LongitudinalService } from './longitudinalService.js';

export class GeminiService {
  /**
   * Process patient intake and medical reports through AI and Clinical Engine
   */
  public static async processMedicalIntelligence(
    intake: PatientIntake,
    currentReportText: string,
    previousReportText?: string,
    apiKeyOverride?: string
  ): Promise<StructuredPatientRecord> {
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

    // 1. Run deterministic baseline parsing
    const currentLabResults = ClinicalEngine.parseLabReport(currentReportText, 'CURRENT_REPORT');
    const previousLabResults = previousReportText
      ? ClinicalEngine.parseLabReport(previousReportText, 'PREVIOUS_REPORT')
      : [];

    const deterministicConflicts = ClinicalEngine.detectConflicts(
      intake,
      currentLabResults,
      currentReportText,
      previousReportText
    );

    const deterministicQuestions = ClinicalEngine.generateClarificationQuestions(
      intake,
      currentLabResults,
      deterministicConflicts
    );

    const deterministicSummary = ClinicalEngine.generateSummary(
      intake,
      currentLabResults,
      deterministicConflicts,
      deterministicQuestions
    );

    const longitudinalComparison = previousLabResults.length > 0
      ? LongitudinalService.compareReports(currentLabResults, previousLabResults)
      : undefined;

    // Base structured record
    const baseRecord: StructuredPatientRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patientInfo: intake,
      symptoms: intake.symptoms,
      conditions: intake.conditions,
      allergies: intake.allergies,
      medications: intake.medications,
      labResults: currentLabResults,
      additionalObservations: this.extractObservations(currentReportText),
      conflicts: deterministicConflicts,
      clarificationQuestions: deterministicQuestions,
      summary: deterministicSummary,
      longitudinalComparison,
      rawReports: {
        currentReportText,
        previousReportText
      },
      verification: {
        isVerified: false
      },
      auditLog: []
    };

    // If no API key is available, return the deterministic result
    if (!apiKey) {
      return baseRecord;
    }

    // If API key is available, invoke Gemini to enrich semantic conflict analysis & patient-friendly summary
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are MedLens AI, a specialized clinical information intelligence and organization assistant.
STRICT SAFETY MANDATE: You DO NOT diagnose diseases, prescribe treatments, or suggest medication adjustments. You organize data, spot potential inconsistencies, and highlight information requiring clarification.

DATA PROVIDED:
1. Patient Intake Form:
${JSON.stringify(intake, null, 2)}

2. Current Medical Report Text:
${currentReportText}

${previousReportText ? `3. Previous Medical Report Text:\n${previousReportText}` : ''}

4. Extracted Laboratory Parameters:
${JSON.stringify(currentLabResults.map(r => ({ name: r.canonicalName, value: r.observedValue, unit: r.unit, refRange: r.referenceRange?.text, status: r.statusText })), null, 2)}

INSTRUCTIONS:
Return a JSON object with:
1. "additionalConflicts": list of any semantic or subtle inconsistencies between intake, current report, and previous record. Each conflict has: "type", "severity" ("HIGH"|"MEDIUM"|"LOW"), "title", "description", "sourceA" (origin, text), "sourceB" (origin, text).
2. "refinedQuestions": list of 3-5 high-yield clarification questions framed as investigative questions for the clinical intake. Each has: "topic", "question", "clinicalRationale", "priority" ("HIGH"|"MEDIUM"|"LOW").
3. "enhancedSummary": an objective summary object containing:
   - "patientOverview": concise neutral overview
   - "keyFindings": array of bullet points highlighting out-of-range parameters with their reported reference ranges (never invent ranges)
   - "normalFindings": array of parameters within reported normal ranges
   - "potentialInconsistencies": array of identified contradictions
   - "actionItemsForClinician": questions/items for healthcare provider to clarify with patient
   - "disclaimer": standard medical disclaimer stating MedLens is an organization tool, not a doctor.

Output ONLY valid JSON.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);

        // Merge AI conflicts if unique
        if (Array.isArray(parsed.additionalConflicts) && parsed.additionalConflicts.length > 0) {
          let cId = deterministicConflicts.length + 1;
          for (const c of parsed.additionalConflicts) {
            const isDuplicate = baseRecord.conflicts.some(
              existing => existing.title.toLowerCase().includes(c.title?.toLowerCase() || '')
            );
            if (!isDuplicate && c.title && c.description) {
              baseRecord.conflicts.push({
                id: `conflict_ai_${cId++}`,
                type: c.type || 'HISTORY_CONFLICT',
                severity: c.severity || 'MEDIUM',
                title: c.title,
                description: c.description,
                sourceA: c.sourceA || { origin: 'Intake', text: 'Documented intake' },
                sourceB: c.sourceB || { origin: 'Report', text: 'Documented report' },
                status: 'unresolved'
              });
            }
          }
        }

        // Replace or merge clarification questions if high quality
        if (Array.isArray(parsed.refinedQuestions) && parsed.refinedQuestions.length >= 3) {
          baseRecord.clarificationQuestions = parsed.refinedQuestions.map((q: any, idx: number) => ({
            id: `cq_ai_${idx + 1}`,
            topic: q.topic || 'Clarification',
            question: q.question,
            clinicalRationale: q.clinicalRationale || 'Clarifies medical context for safe care.',
            priority: q.priority || 'MEDIUM'
          }));
        }

        // Update summary if provided
        if (parsed.enhancedSummary) {
          baseRecord.summary = {
            patientOverview: parsed.enhancedSummary.patientOverview || baseRecord.summary.patientOverview,
            keyFindings: Array.isArray(parsed.enhancedSummary.keyFindings) ? parsed.enhancedSummary.keyFindings : baseRecord.summary.keyFindings,
            normalFindings: Array.isArray(parsed.enhancedSummary.normalFindings) ? parsed.enhancedSummary.normalFindings : baseRecord.summary.normalFindings,
            potentialInconsistencies: Array.isArray(parsed.enhancedSummary.potentialInconsistencies) ? parsed.enhancedSummary.potentialInconsistencies : baseRecord.summary.potentialInconsistencies,
            actionItemsForClinician: Array.isArray(parsed.enhancedSummary.actionItemsForClinician) ? parsed.enhancedSummary.actionItemsForClinician : baseRecord.summary.actionItemsForClinician,
            disclaimer: parsed.enhancedSummary.disclaimer || baseRecord.summary.disclaimer
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call skipped or encountered an error; using deterministic clinical engine output:', err);
    }

    return baseRecord;
  }

  private static extractObservations(text: string): string[] {
    const observations: string[] = [];
    const lines = text.split(/\r?\n/);
    let inObsSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(clinical observation|observations|comments|notes|specimen notes)/i.test(trimmed)) {
        inObsSection = true;
        continue;
      }
      if (inObsSection) {
        if (/^[A-Z\s]{4,}:?$/.test(trimmed) || trimmed.startsWith('----')) {
          inObsSection = false;
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
          observations.push(trimmed.replace(/^[-•*]\s*/, ''));
        } else if (trimmed.length > 5) {
          observations.push(trimmed);
        }
      }
    }

    return observations;
  }
}
