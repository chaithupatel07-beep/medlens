import React, { useState } from 'react';
import { FileUp, FileText, ArrowRight, UploadCloud, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ReportUploaderProps {
  currentReportText: string;
  onCurrentReportChange: (text: string) => void;
  previousReportText: string;
  onPreviousReportChange: (text: string) => void;
  onProcessIntelligence: () => void;
  isLoading: boolean;
}

export const ReportUploader: React.FC<ReportUploaderProps> = ({
  currentReportText,
  onCurrentReportChange,
  previousReportText,
  onPreviousReportChange,
  onProcessIntelligence,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current');
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File, target: 'current' | 'previous') => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(prev => ({ ...prev, [target]: `Uploading & parsing ${file.name}...` }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse file');
      }

      const data = await res.json();
      if (target === 'current') {
        onCurrentReportChange(data.text);
      } else {
        onPreviousReportChange(data.text);
      }
      setUploadStatus(prev => ({ ...prev, [target]: `✓ Extracted from ${file.name}` }));
    } catch (err: any) {
      console.error(err);
      setUploadStatus(prev => ({ ...prev, [target]: `✗ ${err.message || 'File parse error'}` }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>2. Medical Reports Input</h3>
        </div>
        <div className="tabs-nav" style={{ padding: '2px' }}>
          <button
            id="tab-current-report"
            className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            <span>Current Report</span>
            {currentReportText && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal-primary)' }} />}
          </button>
          <button
            id="tab-previous-report"
            className={`tab-btn ${activeTab === 'previous' ? 'active' : ''}`}
            onClick={() => setActiveTab('previous')}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            <span>Previous Report (Optional)</span>
            {previousReportText && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue-primary)' }} />}
          </button>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
        {activeTab === 'current'
          ? 'Paste current laboratory or clinical test report text below, or upload a PDF / document. MedLens will extract parameters, validate reported reference ranges, and trace provenance.'
          : 'Provide an earlier report for longitudinal comparison. MedLens will calculate mathematical deltas, % changes, trend directions (↑, ↓, →), and status transitions.'}
      </p>

      {/* File Upload Drop Area */}
      <div style={{
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <UploadCloud size={20} color="var(--text-muted)" />
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Drop PDF or TXT report here, or
        </span>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
          <FileUp size={13} />
          <span>Browse File</span>
          <input
            type="file"
            accept=".pdf,.txt,.md,.csv,.tsv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0], activeTab);
              }
            }}
          />
        </label>
        {uploadStatus[activeTab] && (
          <span style={{
            fontSize: '12px',
            color: uploadStatus[activeTab].startsWith('✓') ? 'var(--teal-primary)' : 'var(--text-muted)'
          }}>
            {uploadStatus[activeTab]}
          </span>
        )}
      </div>

      {/* Text Area for Current or Previous Report */}
      {activeTab === 'current' ? (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className="form-label" htmlFor="current-report-text">Current Report Document</label>
            <span className="prov-badge prov-report">Source: Current Report</span>
          </div>
          <textarea
            id="current-report-text"
            className="form-textarea mono-num"
            rows={7}
            placeholder={`Example format:\nHemoglobin: 10.2 g/dL (Ref: 13.0 - 17.0)\nWBC: 8.1 10^3/uL (Ref: 4.5 - 11.0)\nPlatelet Count: 240 10^3/uL (Ref: 150 - 450)\nSerum Ferritin: 8.2 ng/mL (Ref: 15 - 150)`}
            value={currentReportText}
            onChange={(e) => onCurrentReportChange(e.target.value)}
          />
        </div>
      ) : (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className="form-label" htmlFor="previous-report-text">Historical / Baseline Report</label>
            <span className="prov-badge prov-report">Source: Previous Report</span>
          </div>
          <textarea
            id="previous-report-text"
            className="form-textarea mono-num"
            rows={7}
            placeholder={`Optional prior baseline report for longitudinal trend analysis:\nHemoglobin: 11.4 g/dL (Ref: 13.0 - 17.0)\nWBC: 7.1 10^3/uL (Ref: 4.5 - 11.0)\nSerum Ferritin: 24.5 ng/mL (Ref: 15 - 150)`}
            value={previousReportText}
            onChange={(e) => onPreviousReportChange(e.target.value)}
          />
        </div>
      )}

      {/* Main Process Button */}
      <button
        id="process-intelligence-btn"
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '12px 20px',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)'
        }}
        onClick={onProcessIntelligence}
        disabled={isLoading || isUploading || (!currentReportText && !previousReportText)}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-animation" />
            <span>Processing Clinical Intelligence Pipeline...</span>
          </>
        ) : (
          <>
            <span>Transform & Structure Medical Information</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Pipeline Status Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '8px'
      }}>
        <span>Input</span>
        <span>→</span>
        <span>Extraction</span>
        <span>→</span>
        <span>Normalization</span>
        <span>→</span>
        <span>Range Check</span>
        <span>→</span>
        <span>Conflict Flagging</span>
        <span>→</span>
        <span>Human Review</span>
      </div>
    </div>
  );
};
