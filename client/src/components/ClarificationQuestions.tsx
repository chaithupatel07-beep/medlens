import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, MessageSquare, Shield, Send } from 'lucide-react';
import { ClarificationQuestion } from '../types';

interface ClarificationQuestionsProps {
  questions: ClarificationQuestion[];
  onUpdateQuestionResponse: (questionId: string, response: string) => void;
}

export const ClarificationQuestions: React.FC<ClarificationQuestionsProps> = ({
  questions,
  onUpdateQuestionResponse
}) => {
  const [activeAnswers, setActiveAnswers] = useState<{ [id: string]: string }>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckCircle2 size={20} color="var(--teal-primary)" />
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>No Immediate Clarifications Required</h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            The provided medical records and intake appear sufficiently detailed for baseline organization.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveAnswer = (qId: string) => {
    const text = activeAnswers[qId];
    if (text !== undefined) {
      onUpdateQuestionResponse(qId, text);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            Context-Aware Clarification Questions ({questions.length})
          </h3>
        </div>
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Investigative questions to gather missing clinical context (Not medical advice)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {questions.map((q, idx) => {
          const currentAnswer = activeAnswers[q.id] !== undefined ? activeAnswers[q.id] : (q.patientResponse || '');

          return (
            <div
              key={q.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                borderLeft: `3px solid ${q.priority === 'HIGH' ? 'var(--blue-primary)' : 'var(--border-subtle)'}`
              }}
            >
              {/* Question Header & Topic */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--blue-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--blue-primary)', textTransform: 'uppercase' }}>
                    {q.topic}
                  </span>
                </div>
                <span className={`badge ${q.priority === 'HIGH' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                  {q.priority} PRIORITY
                </span>
              </div>

              {/* The Question */}
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                "{q.question}"
              </p>

              {/* Clinical Rationale */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Rationale:</span>
                <span>{q.clinicalRationale}</span>
              </div>

              {/* Patient Response Input Box */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Record patient's clarification or response..."
                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                  value={currentAnswer}
                  onChange={(e) => setActiveAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveAnswer(q.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSaveAnswer(q.id)}
                  className="btn btn-secondary btn-sm"
                  title="Save response"
                >
                  <Send size={13} />
                  <span>Save</span>
                </button>
              </div>

              {q.patientResponse && (
                <div style={{ fontSize: '11.5px', color: 'var(--teal-primary)', marginTop: '6px' }}>
                  ✓ Recorded: "{q.patientResponse}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
