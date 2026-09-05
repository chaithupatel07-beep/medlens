import React, { useState } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { StructuredPatientRecord, LabParameter, ParameterStatus } from '../types';

interface StructuredRecordViewProps {
  record: StructuredPatientRecord;
  onUpdateRecord: (updated: StructuredPatientRecord, auditReason?: string) => void;
  onInspectSource: (param: LabParameter) => void;
}

export const StructuredRecordView: React.FC<StructuredRecordViewProps> = ({
  record,
  onUpdateRecord,
  onInspectSource
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LabParameter>>({});
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { patientInfo, labResults } = record;

  // Start inline edit
  const handleStartEdit = (param: LabParameter) => {
    setEditingId(param.id);
    setEditForm({
      canonicalName: param.canonicalName,
      observedValue: param.observedValue,
      unit: param.unit,
      referenceRange: param.referenceRange ? { ...param.referenceRange } : undefined,
      notes: param.notes || ''
    });
  };

  // Save inline edit with audit logging
  const handleSaveEdit = (paramId: string) => {
    const orig = labResults.find(p => p.id === paramId);
    if (!orig) return;

    const updatedResults = labResults.map(p => {
      if (p.id === paramId) {
        const numVal = parseFloat(String(editForm.observedValue));
        return {
          ...p,
          canonicalName: editForm.canonicalName || p.canonicalName,
          observedValue: isNaN(numVal) ? (editForm.observedValue ?? p.observedValue) : numVal,
          unit: editForm.unit ?? p.unit,
          referenceRange: editForm.referenceRange ?? p.referenceRange,
          notes: editForm.notes ?? p.notes,
          isEdited: true,
          confidenceReason: 'Manually verified and modified by clinician'
        };
      }
      return p;
    });

    const auditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fieldModified: `Lab Parameter: ${orig.canonicalName}`,
      previousValue: `${orig.observedValue} ${orig.unit}`,
      newValue: `${editForm.observedValue} ${editForm.unit}`,
      reason: 'Clinician inline adjustment during human review',
      author: record.verification.verifiedBy || 'Attending Reviewer'
    };

    onUpdateRecord({
      ...record,
      labResults: updatedResults,
      auditLog: [auditEntry, ...(record.auditLog || [])]
    }, `Modified ${orig.canonicalName}`);

    setEditingId(null);
  };

  // Delete parameter with audit logging
  const handleDeleteParam = (paramId: string) => {
    const orig = labResults.find(p => p.id === paramId);
    if (!orig) return;

    const updated = labResults.filter(p => p.id !== paramId);
    const auditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fieldModified: `Removed Parameter: ${orig.canonicalName}`,
      previousValue: `${orig.observedValue} ${orig.unit}`,
      newValue: 'DELETED',
      reason: 'Parameter removed by clinical reviewer',
      author: record.verification.verifiedBy || 'Attending Reviewer'
    };

    onUpdateRecord({
      ...record,
      labResults: updated,
      auditLog: [auditEntry, ...(record.auditLog || [])]
    }, `Removed ${orig.canonicalName}`);
  };

  // Add new manual parameter
  const handleAddCustomParam = () => {
    const newParam: LabParameter = {
      id: `param_manual_${Date.now()}`,
      canonicalName: 'New Laboratory Parameter',
      sourceTerm: 'Manual Entry',
      observedValue: 0,
      unit: '',
      status: 'NO_RANGE_PROVIDED',
      statusText: 'No reference range in source report',
      source: 'HUMAN_VERIFIED',
      confidence: 'HIGH',
      confidenceReason: 'Direct manual entry during clinical review',
      isEdited: true
    };

    onUpdateRecord({
      ...record,
      labResults: [...labResults, newParam]
    }, 'Added custom parameter');

    handleStartEdit(newParam);
  };

  // Filter parameters
  const filteredParams = labResults.filter(p => {
    const matchesQuery = p.canonicalName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.sourceTerm.toLowerCase().includes(filterQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ABNORMAL') return p.status !== 'NORMAL' && p.status !== 'NO_RANGE_PROVIDED';
    if (statusFilter === 'NORMAL') return p.status === 'NORMAL';
    if (statusFilter === 'NO_RANGE') return p.status === 'NO_RANGE_PROVIDED';
    return true;
  });

  const getStatusBadge = (status: ParameterStatus) => {
    switch (status) {
      case 'NORMAL':
        return <span className="badge badge-normal">Within Range</span>;
      case 'BELOW_RANGE':
        return <span className="badge badge-warning">Below Reported Range</span>;
      case 'ABOVE_RANGE':
        return <span className="badge badge-danger">Above Reported Range</span>;
      case 'CRITICAL_LOW':
        return <span className="badge badge-danger" style={{ background: '#7f1d1d', color: '#fca5a5' }}>CRITICAL LOW</span>;
      case 'CRITICAL_HIGH':
        return <span className="badge badge-danger" style={{ background: '#7f1d1d', color: '#fca5a5' }}>CRITICAL HIGH</span>;
      case 'NO_RANGE_PROVIDED':
      default:
        return <span className="badge badge-neutral" title="Source report did not specify reference bounds">No Reported Range</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Patient Intake Summary Card (Clearly Tagged User-Provided) */}
      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>
              {patientInfo.name || 'Unnamed Patient'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              • {patientInfo.age || 'Age unrecorded'} y/o • {patientInfo.sex || 'Unspecified'}
            </span>
          </div>
          <span className="prov-badge prov-user">Source: Patient Intake (User-Provided)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span className="form-label" style={{ fontSize: '11px' }}>Symptoms / Concerns</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {patientInfo.symptoms.length > 0 ? (
                patientInfo.symptoms.map((s, idx) => (
                  <span key={idx} className="badge badge-warning" style={{ fontSize: '11px', textTransform: 'none' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None reported</span>
              )}
            </div>
            {patientInfo.symptomDetails && (
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                "{patientInfo.symptomDetails}"
              </p>
            )}
          </div>

          <div>
            <span className="form-label" style={{ fontSize: '11px' }}>Known Medical Conditions</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {patientInfo.conditions.length > 0 ? (
                patientInfo.conditions.map((c, idx) => (
                  <span key={idx} className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'none' }}>{c}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No chronic conditions listed</span>
              )}
            </div>
          </div>

          <div>
            <span className="form-label" style={{ fontSize: '11px' }}>Documented Allergies</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {patientInfo.allergies.length > 0 ? (
                patientInfo.allergies.map((a, idx) => (
                  <span key={idx} className="badge badge-danger" style={{ fontSize: '11px', textTransform: 'none' }}>{a}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No known allergies (NKDA)</span>
              )}
            </div>
          </div>

          <div>
            <span className="form-label" style={{ fontSize: '11px' }}>Current Medications</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {patientInfo.medications.length > 0 ? (
                patientInfo.medications.map((m, idx) => (
                  <span key={idx} className="badge badge-info" style={{ fontSize: '11px', textTransform: 'none' }}>{m}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active medications</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Laboratory Results Table Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {/* Table Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Structured Laboratory Results</h3>
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                {labResults.length} Parameter{labResults.length === 1 ? '' : 's'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Parameters normalized with canonical clinical terminology. Reference ranges evaluated strictly against source report.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search parameter or alias..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ fontSize: '12.5px', padding: '6px 10px', width: '190px' }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '12.5px', padding: '6px 10px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ABNORMAL">Abnormal / Out of Range</option>
              <option value="NORMAL">Normal</option>
              <option value="NO_RANGE">No Reported Range</option>
            </select>

            {/* Add Parameter Button */}
            <button
              id="add-param-btn"
              onClick={handleAddCustomParam}
              className="btn btn-secondary btn-sm"
              title="Add a manual parameter"
            >
              <Plus size={13} />
              <span>Add Parameter</span>
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Parameter (Canonical & Source)</th>
                <th style={{ minWidth: '110px' }}>Observed Value</th>
                <th style={{ minWidth: '130px' }}>Reported Range</th>
                <th style={{ minWidth: '120px' }}>Status</th>
                <th style={{ minWidth: '110px' }}>Source Trace</th>
                <th style={{ minWidth: '80px' }}>Confidence</th>
                <th style={{ textAlign: 'right', minWidth: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParams.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No laboratory parameters match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredParams.map((param) => {
                  const isEditing = editingId === param.id;

                  if (isEditing) {
                    return (
                      <tr key={param.id} style={{ background: 'var(--bg-surface-elevated)' }}>
                        {/* Edit Canonical Name */}
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            value={editForm.canonicalName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, canonicalName: e.target.value }))}
                          />
                        </td>
                        {/* Edit Value & Unit */}
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              className="form-input mono-num"
                              style={{ fontSize: '12px', padding: '4px 8px', width: '60px' }}
                              value={editForm.observedValue ?? ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, observedValue: e.target.value }))}
                            />
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '12px', padding: '4px 8px', width: '50px' }}
                              value={editForm.unit ?? ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                            />
                          </div>
                        </td>
                        {/* Edit Reference Range */}
                        <td>
                          <input
                            type="text"
                            className="form-input mono-num"
                            placeholder="e.g. 12.0 - 15.5"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            value={editForm.referenceRange?.text || ''}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              referenceRange: { text: e.target.value, sourceText: e.target.value }
                            }))}
                          />
                        </td>
                        {/* Status (auto-updated upon save) */}
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Recalculates on save
                        </td>
                        {/* Source Tag */}
                        <td>
                          <span className="prov-badge prov-verified">Human Review</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--teal-primary)' }}>100%</span>
                        </td>
                        {/* Action buttons */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              onClick={() => handleSaveEdit(param.id)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Save Changes"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={param.id} id={`lab-row-${param.id}`}>
                      {/* Parameter Name & Alias */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {param.canonicalName}
                          </span>
                          {param.sourceTerm && param.sourceTerm.toLowerCase() !== param.canonicalName.toLowerCase() && (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              Source alias: <span className="mono-num">{param.sourceTerm}</span>
                            </span>
                          )}
                          {param.isEdited && (
                            <span style={{ fontSize: '10px', color: 'var(--tag-verified-text)', marginTop: '2px' }}>
                              ✎ Edited by Clinician
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Observed Value & Unit */}
                      <td>
                        <span className="mono-num" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {param.observedValue}
                        </span>
                        {param.unit && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            {param.unit}
                          </span>
                        )}
                      </td>

                      {/* Reported Reference Range */}
                      <td>
                        {param.referenceRange?.text ? (
                          <span className="mono-num" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {param.referenceRange.text}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No range in report
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td>
                        {getStatusBadge(param.status)}
                      </td>

                      {/* Source Tag & Snippet Inspector Link */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="prov-badge prov-report">
                            Current Report
                          </span>
                          {param.sourceSnippet && (
                            <button
                              onClick={() => onInspectSource(param)}
                              className="btn-icon"
                              style={{ padding: '2px' }}
                              title="Inspect exact source line in report"
                            >
                              <ExternalLink size={13} color="var(--blue-primary)" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: param.confidence === 'HIGH' ? 'var(--teal-primary)' : 'var(--status-warning-text)'
                        }}>
                          {param.confidence}
                        </span>
                      </td>

                      {/* Edit / Delete Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button
                            onClick={() => handleStartEdit(param)}
                            className="btn-icon"
                            title="Edit parameter value/range"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteParam(param.id)}
                            className="btn-icon"
                            title="Remove parameter"
                            style={{ color: 'var(--status-danger-text)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Additional Clinical Observations */}
      {record.additionalObservations && record.additionalObservations.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <span className="form-label" style={{ marginBottom: '8px' }}>Additional Clinical Notes & Observations</span>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {record.additionalObservations.map((obs, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{obs}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
