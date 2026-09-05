import React from 'react';
import { Activity, Key, Sun, Moon, Printer, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StructuredPatientRecord } from '../types';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  openApiKeyModal: () => void;
  openPrintModal: () => void;
  records: StructuredPatientRecord[];
  activeRecordId?: string;
  onSelectRecord: (id: string) => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  openApiKeyModal,
  openPrintModal,
  records,
  activeRecordId,
  onSelectRecord,
  hasApiKey
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06d6a0, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--teal-glow)'
          }}>
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-font" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Med<span style={{ color: 'var(--teal-primary)' }}>Lens</span>
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(6, 214, 160, 0.15)',
                color: 'var(--teal-primary)',
                textTransform: 'uppercase'
              }}>
                Intelligence & Intake
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Clinical Information Organization • Non-Diagnostic System
            </div>
          </div>
        </div>

        {/* Right Tools & Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Patient Record Selector */}
          {records.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record:</span>
              <select
                id="record-select"
                value={activeRecordId || ''}
                onChange={(e) => onSelectRecord(e.target.value)}
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '12.5px', minWidth: '170px' }}
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.patientInfo.name || 'Unnamed'} ({new Date(r.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Gemini AI Status / Key button */}
          <button
            id="api-key-btn"
            onClick={openApiKeyModal}
            className="btn btn-secondary btn-sm"
            title="Configure Gemini API Key"
          >
            <Key size={14} color={hasApiKey ? 'var(--teal-primary)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '12px' }}>
              {hasApiKey ? 'Gemini AI Active' : 'Configure AI Key'}
            </span>
          </button>

          {/* Print / Export */}
          <button
            id="print-btn"
            onClick={openPrintModal}
            className="btn btn-secondary btn-sm"
            title="Export / Print Clinical Record"
          >
            <Printer size={14} />
            <span style={{ fontSize: '12px' }}>Export PDF</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
