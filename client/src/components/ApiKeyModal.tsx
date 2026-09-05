import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  currentKey: string;
  onSaveKey: (key: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  currentKey,
  onSaveKey,
  onClose
}) => {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(apiKey.trim());
    setSavedMessage('Key saved for this session!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    onSaveKey('');
    setSavedMessage('Key cleared. MedLens will use high-accuracy deterministic engine.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 214, 160, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Key size={18} color="var(--teal-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Gemini AI Configuration</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Power semantic extraction & summary with Google Gemini
              </p>
            </div>
          </div>
          <button id="close-api-modal-btn" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="gemini-api-key">Gemini API Key</label>
            <input
              id="gemini-api-key"
              type="password"
              className="form-input mono-num"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {/* Privacy and Security Notice */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              <ShieldCheck size={14} color="var(--teal-primary)" />
              <span>Zero Leakage Architecture</span>
            </div>
            Keys are held strictly in local session storage and transmitted solely to your local Express backend proxy. They are never bundled into client assets or shared externally.
            <div style={{ marginTop: '6px', color: 'var(--teal-primary)' }}>
              Note: MedLens is 100% functional even without an API key using its built-in clinical rule engine!
            </div>
          </div>

          {savedMessage && (
            <div style={{ fontSize: '12px', color: 'var(--teal-primary)', textAlign: 'center' }}>
              {savedMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-danger-text)' }}
            >
              Clear Key
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button id="save-key-btn" type="submit" className="btn btn-primary btn-sm">
                Save & Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
