import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  HelpCircle,
  History,
  FileCheck,
  UserCheck,
  ArrowRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

import { Header } from './components/Header';
import { IntakeForm } from './components/IntakeForm';
import { ReportUploader } from './components/ReportUploader';
import { StructuredRecordView } from './components/StructuredRecordView';
import { SourceInspectorModal } from './components/SourceInspectorModal';
import { ConflictAlerts } from './components/ConflictAlerts';
import { ClarificationQuestions } from './components/ClarificationQuestions';
import { LongitudinalComparison } from './components/LongitudinalComparison';
import { AiSummaryView } from './components/AiSummaryView';
import { HumanReviewPanel } from './components/HumanReviewPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PrintModal } from './components/PrintModal';

import {
  PatientIntake,
  StructuredPatientRecord,
  SampleScenario,
  LabParameter
} from './types';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Gemini API Key state (held in session / local storage)
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('medlens_gemini_key') || '';
  });

  // Scenarios state
  const [scenarios, setScenarios] = useState<SampleScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('anemia_fatigue');

  // Input states
  const [intake, setIntake] = useState<PatientIntake>({
    name: '',
    age: '',
    sex: 'Female',
    symptoms: [],
    conditions: [],
    allergies: [],
    medications: [],
    notes: '',
    source: 'PATIENT_INTAKE'
  });
  const [currentReportText, setCurrentReportText] = useState<string>('');
  const [previousReportText, setPreviousReportText] = useState<string>('');

  // Processing & Active Record state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeRecord, setActiveRecord] = useState<StructuredPatientRecord | null>(null);
  const [savedRecords, setSavedRecords] = useState<StructuredPatientRecord[]>([]);

  // Navigation tab in the structured intelligence workspace
  const [activeTab, setActiveTab] = useState<'record' | 'conflicts' | 'clarifications' | 'longitudinal' | 'summary' | 'review'>('record');

  // Modals state
  const [inspectingParam, setInspectingParam] = useState<LabParameter | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('medlens_gemini_key', key);
    } else {
      localStorage.removeItem('medlens_gemini_key');
    }
  };

  // Fetch scenarios and past records on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scenariosRes, recordsRes] = await Promise.all([
          fetch('/api/scenarios'),
          fetch('/api/records')
        ]);

        if (scenariosRes.ok) {
          const scList = await scenariosRes.json();
          setScenarios(scList);
          // Auto-load the first scenario (Anemia & Fatigue) on initial open
          if (scList.length > 0) {
            loadScenario(scList[0]);
          }
        }

        if (recordsRes.ok) {
          const recList = await recordsRes.json();
          setSavedRecords(recList);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    fetchData();
  }, []);

  // Load a scenario into the inputs and process it
  const loadScenario = (scenario: SampleScenario) => {
    setActiveScenarioId(scenario.id);
    setIntake(scenario.intake);
    setCurrentReportText(scenario.currentReport);
    setPreviousReportText(scenario.previousReport || '');
  };

  // Process Clinical Intelligence Pipeline
  const handleProcessIntelligence = async () => {
    if (!currentReportText && (!intake || !intake.name)) {
      alert('Please provide patient intake information or a medical report to analyze.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake,
          currentReportText,
          previousReportText: previousReportText || undefined,
          apiKey: apiKey || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to extract intelligence');
      }

      const record: StructuredPatientRecord = await res.json();
      setActiveRecord(record);
      setActiveTab('record');

      // Refresh saved records
      const recordsRes = await fetch('/api/records');
      if (recordsRes.ok) {
        const list = await recordsRes.json();
        setSavedRecords(list);
      }
    } catch (err: any) {
      console.error('Pipeline error:', err);
      alert(`Error during processing: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update active record (inline edits, conflict resolutions, verification)
  const handleUpdateRecord = async (updated: StructuredPatientRecord, auditReason?: string) => {
    setActiveRecord(updated);

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveRecord(saved);
        setSavedRecords(prev => prev.map(r => r.id === saved.id ? saved : r));
      }
    } catch (err) {
      console.error('Error saving record:', err);
    }
  };

  // Conflict state updater
  const handleUpdateConflict = (conflictId: string, status: 'unresolved' | 'acknowledged' | 'resolved', notes?: string) => {
    if (!activeRecord) return;

    const updatedConflicts = activeRecord.conflicts.map(c => {
      if (c.id === conflictId) {
        return {
          ...c,
          status,
          resolutionNotes: notes || c.resolutionNotes,
          resolvedAt: new Date().toISOString(),
          resolvedBy: activeRecord.verification.verifiedBy || 'Reviewing Clinician'
        };
      }
      return c;
    });

    const auditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fieldModified: `Conflict Status: ${conflictId}`,
      previousValue: 'unresolved',
      newValue: status,
      reason: notes || `Marked as ${status}`,
      author: activeRecord.verification.verifiedBy || 'Attending Reviewer'
    };

    handleUpdateRecord({
      ...activeRecord,
      conflicts: updatedConflicts,
      auditLog: [auditEntry, ...(activeRecord.auditLog || [])]
    }, `Conflict updated: ${status}`);
  };

  // Clarification Question response updater
  const handleUpdateQuestionResponse = (questionId: string, response: string) => {
    if (!activeRecord) return;

    const updatedQuestions = activeRecord.clarificationQuestions.map(q => {
      if (q.id === questionId) {
        return { ...q, patientResponse: response };
      }
      return q;
    });

    handleUpdateRecord({
      ...activeRecord,
      clarificationQuestions: updatedQuestions
    }, 'Clarification response recorded');
  };

  // Verify record
  const handleVerifyRecord = (verifiedBy: string, role: string, note?: string) => {
    if (!activeRecord) return;

    const updated: StructuredPatientRecord = {
      ...activeRecord,
      verification: {
        isVerified: true,
        verifiedBy,
        verifiedRole: role,
        verifiedAt: new Date().toISOString(),
        signatureNote: note
      }
    };

    const auditEntry = {
      id: `audit_verify_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fieldModified: 'Record Verification Status',
      previousValue: 'UNVERIFIED',
      newValue: `VERIFIED by ${verifiedBy} (${role})`,
      reason: note || 'Clinician verification attested',
      author: verifiedBy
    };

    updated.auditLog = [auditEntry, ...(activeRecord.auditLog || [])];
    handleUpdateRecord(updated, 'Record verified by clinician');
  };

  const handleUnverifyRecord = () => {
    if (!activeRecord) return;
    const updated: StructuredPatientRecord = {
      ...activeRecord,
      verification: {
        isVerified: false
      }
    };
    handleUpdateRecord(updated, 'Record reopened for review');
  };

  // Select historical record
  const handleSelectRecord = async (recordId: string) => {
    try {
      const res = await fetch(`/api/records/${recordId}`);
      if (res.ok) {
        const rec = await res.json();
        setActiveRecord(rec);
        setIntake(rec.patientInfo);
        setCurrentReportText(rec.rawReports.currentReportText);
        setPreviousReportText(rec.rawReports.previousReportText || '');
        setActiveTab('record');
      }
    } catch (err) {
      console.error('Error fetching record:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        openApiKeyModal={() => setIsApiKeyModalOpen(true)}
        openPrintModal={() => setIsPrintModalOpen(true)}
        records={savedRecords}
        activeRecordId={activeRecord?.id}
        onSelectRecord={handleSelectRecord}
        hasApiKey={!!apiKey}
      />

      {/* Main Container */}
      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Top Disclaimer Notice */}
        <div className="disclaimer-banner">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>MedLens Clinical Safety Mandate:</strong> MedLens is an information intelligence, normalization, and organization platform. It is <strong>NOT a diagnostic or treatment system</strong>. It extracts, compares, and flags potential inconsistencies for human medical review.
          </span>
        </div>

        {/* Workflow Split Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 480px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column: Intake & Document Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <IntakeForm
              intake={intake}
              onChange={setIntake}
              scenarios={scenarios}
              onLoadScenario={loadScenario}
              activeScenarioId={activeScenarioId}
            />

            <ReportUploader
              currentReportText={currentReportText}
              onCurrentReportChange={setCurrentReportText}
              previousReportText={previousReportText}
              onPreviousReportChange={setPreviousReportText}
              onProcessIntelligence={handleProcessIntelligence}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Structured Intelligence Workspace */}
          <div>
            {!activeRecord ? (
              <div className="glass-panel" style={{
                padding: '60px 40px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '480px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(6, 214, 160, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 0 20px var(--teal-glow)'
                }}>
                  <Activity size={30} color="var(--teal-primary)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  Ready to Structure Clinical Information
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5, marginBottom: '20px' }}>
                  Select a clinical preset scenario on the left, or enter patient history and paste a laboratory report. Click "Transform & Structure Medical Information" to run the pipeline.
                </p>
                <button
                  id="empty-state-process-btn"
                  onClick={handleProcessIntelligence}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  <span>Run Analysis on Loaded Scenario</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Navigation Tabs */}
                <div className="tabs-nav" style={{ overflowX: 'auto' }}>
                  <button
                    id="tab-structured-record"
                    className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
                    onClick={() => setActiveTab('record')}
                  >
                    <Layers size={15} />
                    <span>Structured Record</span>
                    <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {activeRecord.labResults.length}
                    </span>
                  </button>

                  <button
                    id="tab-conflicts"
                    className={`tab-btn ${activeTab === 'conflicts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('conflicts')}
                  >
                    <ShieldAlert size={15} color={activeRecord.conflicts.length > 0 ? 'var(--status-warning-text)' : 'inherit'} />
                    <span>Inconsistencies & Conflicts</span>
                    {activeRecord.conflicts.length > 0 && (
                      <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 5px' }}>
                        {activeRecord.conflicts.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="tab-clarifications"
                    className={`tab-btn ${activeTab === 'clarifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clarifications')}
                  >
                    <HelpCircle size={15} />
                    <span>Clarification Questions</span>
                    <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {activeRecord.clarificationQuestions.length}
                    </span>
                  </button>

                  <button
                    id="tab-longitudinal"
                    className={`tab-btn ${activeTab === 'longitudinal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('longitudinal')}
                  >
                    <History size={15} />
                    <span>Longitudinal Trends</span>
                    {activeRecord.longitudinalComparison && (
                      <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                        {activeRecord.longitudinalComparison.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="tab-summary"
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    <FileCheck size={15} />
                    <span>Clinical Summary</span>
                  </button>

                  <button
                    id="tab-review"
                    className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
                    onClick={() => setActiveTab('review')}
                  >
                    <UserCheck size={15} color={activeRecord.verification.isVerified ? 'var(--teal-primary)' : 'inherit'} />
                    <span>Human Review & Audit</span>
                    {activeRecord.verification.isVerified && (
                      <span className="badge badge-normal" style={{ fontSize: '9px', padding: '1px 4px' }}>
                        ✓
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'record' && (
                  <StructuredRecordView
                    record={activeRecord}
                    onUpdateRecord={handleUpdateRecord}
                    onInspectSource={(param) => setInspectingParam(param)}
                  />
                )}

                {activeTab === 'conflicts' && (
                  <ConflictAlerts
                    conflicts={activeRecord.conflicts}
                    onUpdateConflict={handleUpdateConflict}
                  />
                )}

                {activeTab === 'clarifications' && (
                  <ClarificationQuestions
                    questions={activeRecord.clarificationQuestions}
                    onUpdateQuestionResponse={handleUpdateQuestionResponse}
                  />
                )}

                {activeTab === 'longitudinal' && (
                  <LongitudinalComparison
                    items={activeRecord.longitudinalComparison}
                    hasPreviousReport={!!activeRecord.rawReports.previousReportText}
                  />
                )}

                {activeTab === 'summary' && (
                  <AiSummaryView
                    summary={activeRecord.summary}
                  />
                )}

                {activeTab === 'review' && (
                  <HumanReviewPanel
                    record={activeRecord}
                    onVerifyRecord={handleVerifyRecord}
                    onUnverifyRecord={handleUnverifyRecord}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {inspectingParam && (
        <SourceInspectorModal
          param={inspectingParam}
          rawReportText={activeRecord?.rawReports.currentReportText || ''}
          onClose={() => setInspectingParam(null)}
        />
      )}

      {isApiKeyModalOpen && (
        <ApiKeyModal
          currentKey={apiKey}
          onSaveKey={handleSaveApiKey}
          onClose={() => setIsApiKeyModalOpen(false)}
        />
      )}

      {isPrintModalOpen && activeRecord && (
        <PrintModal
          record={activeRecord}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
