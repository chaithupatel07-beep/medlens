import React from 'react';
import { X, Search, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { LabParameter } from '../types';

interface SourceInspectorModalProps {
  param: LabParameter | null;
  rawReportText: string;
  onClose: () => void;
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({
  param,
  rawReportText,
  onClose
}) => {
  if (!param) return null;

  const lines = rawReportText.split(/\r?\n/);
  const snippet = param.sourceSnippet?.trim() || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search size={18} color="var(--blue-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Source Provenance Inspector</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Verify original text origin and context for extracted parameter
              </p>
            </div>
          </div>
          <button id="close-inspector-btn" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Side-by-Side View */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>
          {/* Left: Structured Data Card */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span className="form-label" style={{ fontSize: '11px' }}>Extracted Structured Item</span>

            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {param.canonicalName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Source Term: <span className="mono-num">{param.sourceTerm}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Observed Value</span>
                <span className="mono-num" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--teal-primary)' }}>
                  {param.observedValue} {param.unit}
                </span>
              </div>

              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Reported Range</span>
                <span className="mono-num" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {param.referenceRange?.text || 'No range in report'}
                </span>
              </div>
            </div>

            <div>
              <span className="form-label" style={{ fontSize: '10px' }}>Evaluation Status</span>
              <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                {param.statusText}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ fontSize: '10px' }}>Source Origin</span>
              <span className="prov-badge prov-report">
                {param.source === 'CURRENT_REPORT' ? 'Current Medical Report' : 'Previous Medical Report'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: 'auto' }}>
              <span className="form-label" style={{ fontSize: '10px' }}>Extraction Confidence</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <ShieldCheck size={14} color="var(--teal-primary)" />
                <span>{param.confidence} • {param.confidenceReason || 'Exact text match verified'}</span>
              </div>
            </div>
          </div>

          {/* Right: Original Document with Line Highlighting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="form-label" style={{ fontSize: '11px', marginBottom: 0 }}>
                Raw Source Report (Matched Snippet Highlighted)
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {lines.length} lines in document
              </span>
            </div>

            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              maxHeight: '340px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.7'
            }}>
              {lines.map((line, idx) => {
                const isMatched = snippet && line.includes(snippet.substring(0, Math.min(25, snippet.length)));
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: isMatched ? 'rgba(6, 214, 160, 0.25)' : 'transparent',
                      borderLeft: isMatched ? '3px solid var(--teal-primary)' : '3px solid transparent',
                      color: isMatched ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    <span style={{ opacity: 0.4, marginRight: '10px', userSelect: 'none' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
