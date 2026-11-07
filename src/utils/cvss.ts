import { Severity } from '../types';

export interface CVSSMetrics {
  AV?: string; // Attack Vector: N, A, L, P
  AC?: string; // Attack Complexity: L, H
  PR?: string; // Privileges Required: N, L, H
  UI?: string; // User Interaction: N, R
  S?: string;  // Scope: U, C
  C?: string;  // Confidentiality: N, L, H
  I?: string;  // Integrity: N, L, H
  A?: string;  // Availability: N, L, H
}

export interface CVSSCalculationResult {
  score: number;
  severity: Severity;
  isValid: boolean;
  version: '3.1' | '3.0' | '2.0' | 'unknown';
  metrics: CVSSMetrics;
  error?: string;
}

/**
 * Standard FIRST CVSS v3.1 Rounding function
 * Smallest number, specified to one decimal place, >= input
 */
function cvssRoundUp(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

/**
 * Maps CVSS numerical score to standard Qualitative Severity Level
 */
export function getSeverityFromScore(score: number): Severity {
  const rounded = Math.round(score * 10) / 10;
  if (rounded === 0.0) return 'Info';
  if (rounded >= 0.1 && rounded <= 3.9) return 'Low';
  if (rounded >= 4.0 && rounded <= 6.9) return 'Medium';
  if (rounded >= 7.0 && rounded <= 8.9) return 'High';
  return 'Critical'; // 9.0 - 10.0
}

/**
 * Parses and calculates CVSS Base Score from vector string
 * Supports:
 * - Full v3.1 / v3.0 vectors: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
 * - Prefix-less vectors: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
 * - Case-insensitive parsing
 */
export function calculateCVSSFromVector(vectorStr: string): CVSSCalculationResult {
  if (!vectorStr || !vectorStr.trim()) {
    return {
      score: 0.0,
      severity: 'Info',
      isValid: false,
      version: 'unknown',
      metrics: {},
      error: 'Empty vector string',
    };
  }

  const clean = vectorStr.trim();
  let version: '3.1' | '3.0' | '2.0' | 'unknown' = '3.1';

  if (clean.toUpperCase().startsWith('CVSS:3.0')) {
    version = '3.0';
  } else if (clean.toUpperCase().startsWith('CVSS:3.1')) {
    version = '3.1';
  } else if (clean.toUpperCase().startsWith('CVSS:2.0')) {
    version = '2.0';
  }

  // Parse metric parts
  const metrics: Record<string, string> = {};
  const segments = clean.split('/');

  for (const seg of segments) {
    if (seg.includes(':')) {
      const [rawKey, rawVal] = seg.split(':');
      const key = rawKey.trim().toUpperCase();
      const val = rawVal.trim().toUpperCase();
      metrics[key] = val;
    }
  }

  // Check required CVSS v3 metrics
  const required = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
  const missing = required.filter((m) => !metrics[m]);

  if (missing.length > 0) {
    // If not all 8 base metrics are present, return partial or fallback
    return {
      score: 0.0,
      severity: 'Info',
      isValid: false,
      version,
      metrics,
      error: `Missing required base metrics: ${missing.join(', ')}`,
    };
  }

  // CVSS v3.1 / v3.0 Metric Weights
  const avWeights: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const acWeights: Record<string, number> = { L: 0.77, H: 0.44 };
  const uiWeights: Record<string, number> = { N: 0.85, R: 0.62 };
  const scope = metrics['S'] === 'C' ? 'C' : 'U';

  const prWeights: Record<string, number> =
    scope === 'C'
      ? { N: 0.85, L: 0.68, H: 0.5 }
      : { N: 0.85, L: 0.62, H: 0.27 };

  const ciaWeights: Record<string, number> = { H: 0.56, L: 0.22, N: 0.0 };

  const av = avWeights[metrics['AV']] ?? 0.85;
  const ac = acWeights[metrics['AC']] ?? 0.77;
  const pr = prWeights[metrics['PR']] ?? 0.85;
  const ui = uiWeights[metrics['UI']] ?? 0.85;
  const c = ciaWeights[metrics['C']] ?? 0.0;
  const i = ciaWeights[metrics['I']] ?? 0.0;
  const a = ciaWeights[metrics['A']] ?? 0.0;

  // 1. ISS (Impact Sub-Score)
  const iss = 1.0 - (1.0 - c) * (1.0 - i) * (1.0 - a);

  // 2. Impact
  let impact = 0;
  if (scope === 'C') {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  } else {
    impact = 6.42 * iss;
  }

  // 3. Exploitability
  const exploitability = 8.22 * av * ac * pr * ui;

  // 4. Base Score
  let baseScore = 0.0;
  if (impact <= 0) {
    baseScore = 0.0;
  } else {
    if (scope === 'C') {
      baseScore = cvssRoundUp(Math.min(1.08 * (impact + exploitability), 10.0));
    } else {
      baseScore = cvssRoundUp(Math.min(impact + exploitability, 10.0));
    }
  }

  // Clean float to 1 decimal place
  baseScore = Math.round(baseScore * 10) / 10;
  const severity = getSeverityFromScore(baseScore);

  return {
    score: baseScore,
    severity,
    isValid: true,
    version,
    metrics: metrics as CVSSMetrics,
  };
}

/**
 * Builds a valid CVSS v3.1 vector string from metric components
 */
export function buildCVSSVector(metrics: CVSSMetrics): string {
  const av = metrics.AV || 'N';
  const ac = metrics.AC || 'L';
  const pr = metrics.PR || 'N';
  const ui = metrics.UI || 'N';
  const s = metrics.S || 'U';
  const c = metrics.C || 'N';
  const i = metrics.I || 'N';
  const a = metrics.A || 'N';

  return `CVSS:3.1/AV:${av}/AC:${ac}/PR:${pr}/UI:${ui}/S:${s}/C:${c}/I:${i}/A:${a}`;
}

