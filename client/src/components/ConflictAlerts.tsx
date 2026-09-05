import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Check, X, ArrowRight, ShieldAlert, MessageSquare } from 'lucide-react';
import { ClinicalConflict } from '../types';

interface ConflictAlertsProps {
  conflicts: ClinicalConflict[];
  onUpdateConflict: (conflictId: string, status: 'unresolved' | 'acknowledged' | 'resolved', notes?: string) => void;
}

export const ConflictAlerts: React.FC<ConflictAlertsProps> = ({
  conflicts,
  onUpdateConflict
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckCircle size={20} color="var(--teal-primary)" />
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>No Contradictions Detected</h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Cross-referencing between patient intake and submitted reports found consistent clinical data.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenResolve = (id: string) => {
    setResolvingId(id);
    setResolutionText('');
  };

  const handleSaveResolve = (id: string) => {
    if (!resolutionText.trim()) return;
    onUpdateConflict(id, 'resolved', resolutionText.trim());
    setResolvingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} color="var(--status-warning-text)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            Potential Inconsistencies & Conflicts ({conflicts.length})
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          System flags conflicts for human clarification without deciding which source is correct
        </span>
      </div>

      {conflicts.map((conflict) => {
        const isResolved = conflict.status === 'resolved';
        const isAcknowledged = conflict.status === 'acknowledged';
        const isResolving = resolvingId === conflict.id;

        return (
          <div
            key={conflict.id}
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderLeft: `4px solid ${
                isResolved
                  ? 'var(--teal-primary)'
                  : conflict.severity === 'HIGH'
                  ? 'var(--status-danger-text)'
                  : 'var(--status-warning-text)'
              }`,
              background: isResolved ? 'rgba(6, 214, 160, 0.04)' : 'var(--bg-glass)'
            }}
          >
            {/* Conflict Title & Severity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: conflict.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: conflict.severity === 'HIGH' ? 'var(--status-danger-text)' : 'var(--status-warning-text)'
                }}>
                  {conflict.severity} SEVERITY
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  {conflict.title}
                </span>
              </div>

              {/* Status Badge */}
              <span className={`badge ${isResolved ? 'badge-normal' : isAcknowledged ? 'badge-warning' : 'badge-danger'}`}>
                {conflict.status.toUpperCase()}
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              {conflict.description}
            </p>

            {/* Side-by-Side Sources */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className="prov-badge prov-user" style={{ fontSize: '10px' }}>Source A</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {conflict.sourceA.origin}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{conflict.sourceA.text}"
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className="prov-badge prov-report" style={{ fontSize: '10px' }}>Source B</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {conflict.sourceB.origin}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{conflict.sourceB.text}"
                </div>
              </div>
            </div>

            {/* Resolution Note if present */}
            {conflict.resolutionNotes && (
              <div style={{
                background: 'rgba(6, 214, 160, 0.08)',
                border: '1px solid rgba(6, 214, 160, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--teal-primary)' }}>Clinical Resolution Note: </span>
                {conflict.resolutionNotes}
                {conflict.resolvedAt && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '11px' }}>
                    ({new Date(conflict.resolvedAt).toLocaleTimeString()})
                  </span>
                )}
              </div>
            )}

            {/* Inline Resolve Input */}
            {isResolving && (
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  className="form-textarea"
                  rows={2}
                  style={{ fontSize: '12.5px', minHeight: '60px' }}
                  placeholder="Enter clinician reconciliation note (e.g. 'Clarified with patient: childhood rash occurred with amoxicillin; allergy confirmed and flagged in chart')..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setResolvingId(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={() => handleSaveResolve(conflict.id)} className="btn btn-primary btn-sm">
                    Save Resolution Note
                  </button>
                </div>
              </div>
            )}

            {/* Actions for Clinician */}
            {!isResolving && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {!isAcknowledged && !isResolved && (
                  <button
                    onClick={() => onUpdateConflict(conflict.id, 'acknowledged')}
                    className="btn btn-secondary btn-sm"
                    title="Acknowledge conflict without resolving"
                  >
                    Acknowledge Discrepancy
                  </button>
                )}
                {!isResolved && (
                  <button
                    onClick={() => handleOpenResolve(conflict.id)}
                    className="btn btn-primary btn-sm"
                    title="Resolve conflict with clinical documentation"
                  >
                    Resolve with Clinical Note
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
