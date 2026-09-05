import { LabParameter, LongitudinalItem } from '../types/clinical.js';

export class LongitudinalService {
  /**
   * Compare current lab parameters against previous lab parameters based on extracted structured data
   */
  public static compareReports(
    currentParams: LabParameter[],
    previousParams: LabParameter[]
  ): LongitudinalItem[] {
    const comparisons: LongitudinalItem[] = [];

    // Map previous params by canonical name for fast lookup
    const prevMap = new Map<string, LabParameter>();
    for (const p of previousParams) {
      prevMap.set(p.canonicalName.toLowerCase(), p);
    }

    for (const curr of currentParams) {
      const prev = prevMap.get(curr.canonicalName.toLowerCase());
      if (!prev) continue;

      const currNum = typeof curr.observedValue === 'number' ? curr.observedValue : parseFloat(String(curr.observedValue));
      const prevNum = typeof prev.observedValue === 'number' ? prev.observedValue : parseFloat(String(prev.observedValue));

      const isBothNumeric = !isNaN(currNum) && !isNaN(prevNum);

      let delta: number | undefined = undefined;
      let percentChange: number | undefined = undefined;
      let trend: 'INCREASED' | 'DECREASED' | 'STABLE' | 'NON_NUMERIC' = 'NON_NUMERIC';

      if (isBothNumeric) {
        delta = Math.round((currNum - prevNum) * 100) / 100;
        if (prevNum !== 0) {
          percentChange = Math.round(((currNum - prevNum) / Math.abs(prevNum)) * 1000) / 10;
        }

        if (delta > 0.001) {
          trend = 'INCREASED';
        } else if (delta < -0.001) {
          trend = 'DECREASED';
        } else {
          trend = 'STABLE';
        }
      } else {
        if (String(curr.observedValue).toLowerCase() === String(prev.observedValue).toLowerCase()) {
          trend = 'STABLE';
        } else {
          trend = 'NON_NUMERIC';
        }
      }

      // Clinical contextual note on status transition
      let clinicalSignificance = '';
      if (prev.status === 'NORMAL' && (curr.status === 'BELOW_RANGE' || curr.status === 'CRITICAL_LOW')) {
        clinicalSignificance = 'New deficit: Decreased below reported reference range';
      } else if (prev.status === 'NORMAL' && (curr.status === 'ABOVE_RANGE' || curr.status === 'CRITICAL_HIGH')) {
        clinicalSignificance = 'New elevation: Increased above reported reference range';
      } else if ((prev.status === 'BELOW_RANGE' || prev.status === 'ABOVE_RANGE') && curr.status === 'NORMAL') {
        clinicalSignificance = 'Normalization: Returned to reported reference range';
      } else if (trend === 'INCREASED' && curr.status === 'ABOVE_RANGE') {
        clinicalSignificance = 'Progressive elevation further above reference range';
      } else if (trend === 'DECREASED' && curr.status === 'BELOW_RANGE') {
        clinicalSignificance = 'Progressive decline further below reference range';
      } else if (trend === 'STABLE') {
        clinicalSignificance = 'Stable across observation interval';
      } else {
        clinicalSignificance = 'Observed interval change';
      }

      comparisons.push({
        canonicalName: curr.canonicalName,
        sourceTerm: curr.sourceTerm,
        previousValue: prev.observedValue,
        currentValue: curr.observedValue,
        unit: curr.unit || prev.unit,
        numericDelta: delta,
        percentChange,
        trend,
        previousRange: prev.referenceRange?.text || 'No range provided',
        currentRange: curr.referenceRange?.text || 'No range provided',
        previousStatus: prev.status,
        currentStatus: curr.status,
        clinicalSignificance
      });
    }

    return comparisons;
  }
}
