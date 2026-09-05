import React from 'react';
import { FileCheck, AlertCircle, CheckCircle, HelpCircle, Shield, AlertTriangle } from 'lucide-react';
import { StructuredPatientRecord } from '../types';

interface AiSummaryViewProps {
  summary: StructuredPatientRecord['summary'];
}

export const AiSummaryView: React.FC<AiSummaryViewProps> = ({ summary }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Strict Medical Boundary Disclaimer Banner */}
      <div className="disclaimer-banner">
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700 }}>CLINICAL INFORMATION NOTICE: </span>
          <span>
            MedLens is an information-intelligence and organization system — <strong>NOT a diagnostic or treatment system</strong>. It does not provide medical diagnoses or prescribe therapies. All insights, flags, and values must be reviewed by a licensed healthcare professional.
          </span>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <FileCheck size={18} color="var(--teal-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Clinical Record Synthesis</h3>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {summary.patientOverview}
        </p>
      </div>

      {/* Two Column Grid for Key Findings & Normal Findings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Out of Range / Important Findings */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid var(--status-warning-text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <AlertCircle size={18} color="var(--status-warning-text)" />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--status-warning-text)' }}>
              Notable Findings (Outside Reported Range)
            </h4>
          </div>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.keyFindings.map((finding, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.4
                }}
              >
                • {finding}
              </li>
            ))}
          </ul>
        </div>

        {/* Stable / Normal Findings */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid var(--teal-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <CheckCircle size={18} color="var(--teal-primary)" />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--teal-primary)' }}>
              Parameters Within Reported Normal Range
            </h4>
          </div>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.normalFindings.map((finding, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: 1.4
                }}
              >
                ✓ {finding}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Items for Healthcare Provider */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <HelpCircle size={18} color="var(--blue-primary)" />
          <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
            Priority Clinical Clarification Items
          </h4>
        </div>
        <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {summary.actionItemsForClinician.map((item, idx) => (
            <li
              key={idx}
              style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderLeft: '3px solid var(--blue-primary)',
                background: 'var(--bg-surface)',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
