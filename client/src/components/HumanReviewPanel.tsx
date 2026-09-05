import React, { useState } from 'react';
import { ShieldCheck, UserCheck, History, Award, CheckCircle, Edit3, Clock } from 'lucide-react';
import { StructuredPatientRecord } from '../types';

interface HumanReviewPanelProps {
  record: StructuredPatientRecord;
  onVerifyRecord: (verifiedBy: string, role: string, note?: string) => void;
  onUnverifyRecord: () => void;
}

export const HumanReviewPanel: React.FC<HumanReviewPanelProps> = ({
  record,
  onVerifyRecord,
  onUnverifyRecord
}) => {
  const [reviewerName, setReviewerName] = useState(record.verification.verifiedBy || '');
  const [reviewerRole, setReviewerRole] = useState(record.verification.verifiedRole || 'Attending Physician');
  const [signatureNote, setSignatureNote] = useState(record.verification.signatureNote || '');
  const [isSigning, setIsSigning] = useState(false);

  const { verification, auditLog } = record;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    onVerifyRecord(reviewerName.trim(), reviewerRole, signatureNote.trim());
    setIsSigning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Verification Status Card */}
      <div className="glass-panel" style={{
        padding: '24px',
        border: verification.isVerified ? '1px solid var(--teal-primary)' : '1px solid var(--border-subtle)',
        background: verification.isVerified ? 'rgba(6, 214, 160, 0.05)' : 'var(--bg-glass)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: verification.isVerified ? 'rgba(6, 214, 160, 0.2)' : 'rgba(100, 116, 139, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: verification.isVerified ? '0 0 16px var(--teal-glow)' : 'none'
            }}>
              <ShieldCheck size={26} color={verification.isVerified ? 'var(--teal-primary)' : 'var(--text-muted)'} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 600 }}>
                  {verification.isVerified ? 'Clinically Verified Record' : 'Pending Clinician Review & Verification'}
                </h3>
                <span className={`badge ${verification.isVerified ? 'badge-normal' : 'badge-warning'}`}>
                  {verification.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {verification.isVerified
                  ? `Verified by ${verification.verifiedBy} (${verification.verifiedRole}) on ${new Date(verification.verifiedAt || '').toLocaleString()}`
                  : 'AI-extracted entries must not be assumed correct without human professional inspection.'}
              </p>
              {verification.signatureNote && (
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                  "{verification.signatureNote}"
                </div>
              )}
            </div>
          </div>

          <div>
            {verification.isVerified ? (
              <button
                id="unverify-btn"
                onClick={onUnverifyRecord}
                className="btn btn-secondary btn-sm"
              >
                Re-open for Review
              </button>
            ) : (
              !isSigning && (
                <button
                  id="start-verify-btn"
                  onClick={() => setIsSigning(true)}
                  className="btn btn-primary"
                >
                  <UserCheck size={16} />
                  <span>Mark Record as Verified</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Verification Sign-Off Modal / Form */}
        {isSigning && (
          <form onSubmit={handleSign} style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reviewer-name">Reviewer Full Name</label>
                <input
                  id="reviewer-name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Dr. Sarah Jenkins, MD"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reviewer-role">Clinical Role / Title</label>
                <select
                  id="reviewer-role"
                  className="form-select"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                >
                  <option value="Attending Physician">Attending Physician</option>
                  <option value="Resident Physician">Resident Physician</option>
                  <option value="Nurse Practitioner">Nurse Practitioner</option>
                  <option value="Physician Assistant">Physician Assistant</option>
                  <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                  <option value="Registered Nurse">Registered Nurse</option>
                  <option value="Medical Reviewer">Medical Reviewer</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="signature-note">Attestation / Clinical Notes</label>
              <input
                id="signature-note"
                type="text"
                className="form-input"
                placeholder="e.g. Reviewed lab parameters, confirmed allergy note, and reconciled with intake history."
                value={signatureNote}
                onChange={(e) => setSignatureNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsSigning(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                id="confirm-verify-btn"
                type="submit"
                className="btn btn-primary btn-sm"
              >
                <ShieldCheck size={14} />
                <span>Confirm & Stamp Verification</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Audit Log of Corrections */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--blue-primary)" />
            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
              Audit Trail of Human Corrections ({auditLog?.length || 0})
            </h4>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Full traceability of clinician edits, parameter adjustments, and conflict resolutions
          </span>
        </div>

        {!auditLog || auditLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No modifications made yet. Direct edits to lab parameters or conflicts will generate an immutable audit trail here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12.5px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {entry.fieldModified}
                  </span>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Changed from <span className="mono-num" style={{ color: 'var(--status-danger-text)' }}>{entry.previousValue}</span> to <span className="mono-num" style={{ color: 'var(--teal-primary)' }}>{entry.newValue}</span>
                    {entry.reason && ` • Note: ${entry.reason}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <span>{entry.author}</span>
                  <span>•</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
