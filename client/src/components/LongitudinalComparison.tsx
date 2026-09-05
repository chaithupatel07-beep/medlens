import React from 'react';
import { History, TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LongitudinalItem } from '../types';

interface LongitudinalComparisonProps {
  items?: LongitudinalItem[];
  hasPreviousReport: boolean;
}

export const LongitudinalComparison: React.FC<LongitudinalComparisonProps> = ({
  items,
  hasPreviousReport
}) => {
  if (!hasPreviousReport) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <History size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
          No Historical Report Provided for Comparison
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          To perform longitudinal comparisons, supply a previous medical or laboratory report in the "Medical Reports Input" tab.
        </p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <CheckCircle2 size={28} color="var(--teal-primary)" style={{ margin: '0 auto 10px auto' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
          No Matching Parameters Between Current & Previous Reports
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          The tests conducted in the previous report differ from the current panel.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            Longitudinal Comparison ({items.length} Matched Parameter{items.length === 1 ? '' : 's'})
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Mathematical deltas and status shifts computed from extracted structured data
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Previous Report</th>
              <th>Current Report</th>
              <th>Absolute Change</th>
              <th>Trend</th>
              <th>Status Shift</th>
              <th>Clinical Observation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isIncrease = item.trend === 'INCREASED';
              const isDecrease = item.trend === 'DECREASED';

              return (
                <tr key={idx}>
                  {/* Parameter Name */}
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.canonicalName}
                    </span>
                  </td>

                  {/* Previous Value */}
                  <td>
                    <span className="mono-num" style={{ fontWeight: 600 }}>
                      {item.previousValue} {item.unit}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Range: {item.previousRange}
                    </div>
                  </td>

                  {/* Current Value */}
                  <td>
                    <span className="mono-num" style={{ fontWeight: 600, color: isDecrease && item.canonicalName.includes('Hemoglobin') ? 'var(--status-warning-text)' : 'inherit' }}>
                      {item.currentValue} {item.unit}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Range: {item.currentRange}
                    </div>
                  </td>

                  {/* Delta & % Change */}
                  <td>
                    {item.numericDelta !== undefined ? (
                      <div>
                        <span className="mono-num" style={{
                          fontWeight: 600,
                          color: isIncrease ? 'var(--blue-primary)' : isDecrease ? 'var(--status-warning-text)' : 'inherit'
                        }}>
                          {item.numericDelta > 0 ? `+${item.numericDelta}` : item.numericDelta} {item.unit}
                        </span>
                        {item.percentChange !== undefined && (
                          <div className="mono-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({item.percentChange > 0 ? `+${item.percentChange}%` : `${item.percentChange}%`})
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Non-numeric</span>
                    )}
                  </td>

                  {/* Trend Indicator */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isIncrease && <TrendingUp size={16} color="var(--blue-primary)" />}
                      {isDecrease && <TrendingDown size={16} color="var(--status-warning-text)" />}
                      {item.trend === 'STABLE' && <Minus size={16} color="var(--teal-primary)" />}
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: isIncrease ? 'var(--blue-primary)' : isDecrease ? 'var(--status-warning-text)' : 'var(--teal-primary)'
                      }}>
                        {item.trend}
                      </span>
                    </div>
                  </td>

                  {/* Status Shift */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.previousStatus}</span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                      <span style={{
                        fontWeight: 600,
                        color: item.currentStatus === 'NORMAL' ? 'var(--teal-primary)' : 'var(--status-warning-text)'
                      }}>
                        {item.currentStatus}
                      </span>
                    </div>
                  </td>

                  {/* Clinical Significance */}
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.clinicalSignificance}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
