import React from 'react';
import { X, Printer, ShieldCheck, Activity } from 'lucide-react';
import { StructuredPatientRecord } from '../types';

interface PrintModalProps {
  record: StructuredPatientRecord;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ record, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '880px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} color="var(--teal-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Print / Export Clinical Brief</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button id="trigger-print-btn" onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={14} />
              <span>Print or Save to PDF</span>
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-brief" style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '28px',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.5
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: '#0284c7',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Activity size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0284c7' }}>
                  MedLens Clinical Intelligence Record
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Standardized Patient Intake & Laboratory Information Brief
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
              <div>Record ID: {record.id.substring(0, 14)}</div>
              <div>Generated: {new Date(record.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Legal Non-Diagnostic Notice */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#92400e',
            marginBottom: '16px'
          }}>
            <strong>NON-DIAGNOSTIC NOTICE:</strong> MedLens is an information organization tool. It does not provide medical diagnoses or treatment recommendations. All data must be verified by a licensed clinician.
          </div>

          {/* Patient Demographics & Intake */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ fontWeight: 600, color: '#475569', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Patient</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{record.patientInfo.name || 'Unnamed'}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#475569', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Age / Sex</span>
              <span>{record.patientInfo.age || 'N/A'} y/o • {record.patientInfo.sex}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#475569', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Allergies</span>
              <span style={{ color: record.patientInfo.allergies.length > 0 ? '#b91c1c' : '#047857', fontWeight: 600 }}>
                {record.patientInfo.allergies.join(', ') || 'No known allergies'}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#475569', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Current Medications</span>
              <span>{record.patientInfo.medications.join(', ') || 'None'}</span>
            </div>
          </div>

          {/* Symptoms & Conditions */}
          <div style={{ fontSize: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <strong style={{ color: '#334155' }}>Reported Symptoms: </strong>
              <span>{record.patientInfo.symptoms.join(', ') || 'None reported'}</span>
              {record.patientInfo.symptomDetails && (
                <div style={{ fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
                  "{record.patientInfo.symptomDetails}"
                </div>
              )}
            </div>
            <div>
              <strong style={{ color: '#334155' }}>Reported Conditions: </strong>
              <span>{record.patientInfo.conditions.join(', ') || 'No chronic conditions listed'}</span>
            </div>
          </div>

          {/* Laboratory Results Table */}
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Laboratory Parameters & Status
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '18px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Parameter</th>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Observed Result</th>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Reported Reference Range</th>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {record.labResults.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.canonicalName}</td>
                  <td style={{ padding: '6px 10px' }}>{p.observedValue} {p.unit}</td>
                  <td style={{ padding: '6px 10px' }}>{p.referenceRange?.text || 'No range in source'}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: p.status === 'NORMAL' ? '#059669' : '#d97706' }}>
                    {p.statusText}
                  </td>
                  <td style={{ padding: '6px 10px', color: '#64748b' }}>Current Report</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Flagged Inconsistencies if any */}
          {record.conflicts && record.conflicts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '6px', textTransform: 'uppercase' }}>
                Flagged Cross-Source Inconsistencies ({record.conflicts.length})
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '11.5px', color: '#334155' }}>
                {record.conflicts.map((c, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    <strong>[{c.severity}] {c.title}:</strong> {c.description}
                    {c.resolutionNotes && (
                      <div style={{ color: '#059669', fontStyle: 'italic' }}>
                        Resolution: {c.resolutionNotes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Sign-Off Stamp */}
          <div style={{
            borderTop: '2px solid #e2e8f0',
            paddingTop: '14px',
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '11.5px'
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Clinical Verification Status: {record.verification.isVerified ? 'VERIFIED' : 'PENDING'}
              </div>
              {record.verification.isVerified && (
                <div style={{ color: '#475569', marginTop: '2px' }}>
                  Verified by: <strong>{record.verification.verifiedBy}</strong> ({record.verification.verifiedRole})<br />
                  Timestamp: {new Date(record.verification.verifiedAt || '').toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', width: '220px', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Clinician Signature Stamp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
