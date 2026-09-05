import React from 'react';
import { User, HeartPulse, AlertCircle, Sparkles, Plus, X, Tag } from 'lucide-react';
import { PatientIntake, SampleScenario } from '../types';

interface IntakeFormProps {
  intake: PatientIntake;
  onChange: (updated: PatientIntake) => void;
  scenarios: SampleScenario[];
  onLoadScenario: (scenario: SampleScenario) => void;
  activeScenarioId?: string;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  intake,
  onChange,
  scenarios,
  onLoadScenario,
  activeScenarioId
}) => {
  const updateField = (field: keyof PatientIntake, value: any) => {
    onChange({
      ...intake,
      [field]: value
    });
  };

  const handleArrayAdd = (field: 'symptoms' | 'conditions' | 'allergies' | 'medications', value: string) => {
    if (!value.trim()) return;
    const current = intake[field] || [];
    if (!current.includes(value.trim())) {
      updateField(field, [...current, value.trim()]);
    }
  };

  const handleArrayRemove = (field: 'symptoms' | 'conditions' | 'allergies' | 'medications', index: number) => {
    const current = intake[field] || [];
    updateField(field, current.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header & Scenario Presets */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--teal-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>1. Patient Intake</h3>
          </div>
          <span className="prov-badge prov-user" title="Entered directly by user">
            Source: Patient Intake Form
          </span>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Capture core demographic and subjective clinical history. Load a realistic clinical scenario or input custom information.
        </p>

        {/* 1-Click Scenario Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {scenarios.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                id={`scenario-btn-${sc.id}`}
                onClick={() => onLoadScenario(sc)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
                title={sc.description}
              >
                <Sparkles size={12} />
                <span>{sc.name}</span>
                {sc.badge && (
                  <span style={{
                    fontSize: '9.5px',
                    opacity: 0.85,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)'
                  }}>
                    {sc.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Demographics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="patient-name">Patient Name / ID</label>
          <input
            id="patient-name"
            type="text"
            className="form-input"
            placeholder="e.g. Jane Doe or PT-8291"
            value={intake.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="patient-age">Age</label>
          <input
            id="patient-age"
            type="number"
            className="form-input"
            placeholder="e.g. 42"
            value={intake.age}
            onChange={(e) => updateField('age', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="patient-sex">Biological Sex</label>
          <select
            id="patient-sex"
            className="form-select"
            value={intake.sex}
            onChange={(e) => updateField('sex', e.target.value)}
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Symptoms / Concerns with Quick Add */}
      <div>
        <label className="form-label">Symptoms & Concerns</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
          {intake.symptoms.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No symptoms specified</span>
          ) : (
            intake.symptoms.map((s, idx) => (
              <span key={idx} className="badge badge-warning" style={{ gap: '6px', fontSize: '11.5px', textTransform: 'none' }}>
                {s}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleArrayRemove('symptoms', idx)}
                />
              </span>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            id="new-symptom-input"
            type="text"
            className="form-input"
            placeholder="Add symptom (e.g. Fatigue, Lightheadedness) and press Enter"
            style={{ fontSize: '12.5px', padding: '6px 10px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('symptoms', (e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Existing Medical Conditions */}
      <div>
        <label className="form-label">Existing Medical Conditions</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
          {intake.conditions.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None documented (Healthy baseline)</span>
          ) : (
            intake.conditions.map((c, idx) => (
              <span key={idx} className="badge badge-neutral" style={{ gap: '6px', fontSize: '11.5px', textTransform: 'none' }}>
                {c}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleArrayRemove('conditions', idx)}
                />
              </span>
            ))
          )}
        </div>
        <input
          id="new-condition-input"
          type="text"
          className="form-input"
          placeholder="Add condition (e.g. Hypertension, Menorrhagia) and press Enter"
          style={{ fontSize: '12.5px', padding: '6px 10px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayAdd('conditions', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </div>

      {/* Allergies & Medications (Two columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Allergies */}
        <div>
          <label className="form-label">Known Allergies</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
            {intake.allergies.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None reported (NKDA)</span>
            ) : (
              intake.allergies.map((a, idx) => (
                <span key={idx} className="badge badge-danger" style={{ gap: '6px', fontSize: '11.5px', textTransform: 'none' }}>
                  {a}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleArrayRemove('allergies', idx)}
                  />
                </span>
              ))
            )}
          </div>
          <input
            id="new-allergy-input"
            type="text"
            className="form-input"
            placeholder="Add allergy (e.g. Penicillin, Latex) and press Enter"
            style={{ fontSize: '12.5px', padding: '6px 10px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('allergies', (e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>

        {/* Medications */}
        <div>
          <label className="form-label">Current Medications</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
            {intake.medications.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active medications</span>
            ) : (
              intake.medications.map((m, idx) => (
                <span key={idx} className="badge badge-info" style={{ gap: '6px', fontSize: '11.5px', textTransform: 'none' }}>
                  {m}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleArrayRemove('medications', idx)}
                  />
                </span>
              ))
            )}
          </div>
          <input
            id="new-med-input"
            type="text"
            className="form-input"
            placeholder="Add medication (e.g. Metformin 1000mg) and press Enter"
            style={{ fontSize: '12.5px', padding: '6px 10px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('medications', (e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="patient-notes">Additional Patient Notes</label>
        <textarea
          id="patient-notes"
          className="form-textarea"
          rows={2}
          placeholder="Any extra context, dietary patterns, or patient observations..."
          style={{ minHeight: '60px', fontSize: '12.5px' }}
          value={intake.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </div>
    </div>
  );
};
