import { Injectable } from '@nestjs/common';
import {
  DescriptiveStatistics,
  DiameterClassResult,
  QualityClassResult,
  StatisticalMetricResult,
} from './types/processing.types';

@Injectable()
export class StatisticsService {
  /**
   * Tabela Student (Bilateral) para graus de liberdade comuns e níveis de confiança usuais.
   * Chave externa: nível de confiança (0.90, 0.95, 0.99)
   * Chave interna: graus de liberdade (df = n - 1)
   */
  private readonly studentTable: Record<number, Record<number, number>> = {
    0.95: {
      1: 12.706,
      2: 4.303,
      3: 3.182,
      4: 2.776,
      5: 2.571,
      6: 2.447,
      7: 2.365,
      8: 2.306,
      9: 2.262,
      10: 2.228,
      11: 2.201,
      12: 2.179,
      13: 2.16,
      14: 2.145,
      15: 2.131,
      16: 2.12,
      17: 2.11,
      18: 2.101,
      19: 2.093,
      20: 2.086,
      21: 2.08,
      22: 2.074,
      23: 2.069,
      24: 2.064,
      25: 2.06,
      26: 2.056,
      27: 2.052,
      28: 2.048,
      29: 2.045,
      30: 2.042,
      35: 2.03,
      40: 2.021,
      45: 2.014,
      50: 2.009,
      60: 2.0,
      80: 1.99,
      100: 1.984,
      120: 1.98,
    },
    0.9: {
      1: 6.314,
      2: 2.92,
      3: 2.353,
      4: 2.132,
      5: 2.015,
      6: 1.943,
      7: 1.895,
      8: 1.86,
      9: 1.833,
      10: 1.812,
      11: 1.796,
      12: 1.782,
      13: 1.771,
      14: 1.761,
      15: 1.753,
      16: 1.746,
      17: 1.74,
      18: 1.734,
      19: 1.729,
      20: 1.725,
      25: 1.708,
      30: 1.697,
      40: 1.684,
      50: 1.676,
      60: 1.671,
      80: 1.664,
      100: 1.66,
      120: 1.658,
    },
    0.99: {
      1: 63.657,
      2: 9.925,
      3: 5.841,
      4: 4.604,
      5: 4.032,
      6: 3.707,
      7: 3.499,
      8: 3.355,
      9: 3.25,
      10: 3.169,
      11: 3.106,
      12: 3.055,
      13: 3.012,
      14: 2.977,
      15: 2.947,
      16: 2.921,
      17: 2.898,
      18: 2.878,
      19: 2.861,
      20: 2.845,
      25: 2.787,
      30: 2.75,
      40: 2.704,
      50: 2.678,
      60: 2.66,
      80: 2.639,
      100: 2.626,
      120: 2.617,
    },
  };

  /**
   * Calcula estatísticas descritivas básicas para uma série de valores numéricos.
   */
  calculateDescriptive(values: number[]): DescriptiveStatistics {
    const n = values.length;
    if (n === 0) {
      return {
        n: 0,
        total: 0,
        mean: 0,
        variance: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
      };
    }

    const total = values.reduce((acc, curr) => acc + curr, 0);
    const mean = total / n;

    const variance =
      n > 1 ? values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n - 1) : 0;

    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean !== 0 ? (standardDeviation / mean) * 100 : 0;

    return {
      n,
      total,
      mean,
      variance,
      standardDeviation,
      coefficientOfVariation,
    };
  }

  /**
   * Obtém o valor crítico da distribuição t de Student (bicaudal).
   */
  getTStudent(degreesOfFreedom: number, confidenceLevel: number = 0.95): number {
    if (degreesOfFreedom < 1) {
      return 0;
    }
    const df = Math.max(1, Math.round(degreesOfFreedom));

    // Busca exata na tabela para níveis usuais
    const table = this.studentTable[confidenceLevel];
    if (table) {
      if (table[df] !== undefined) {
        return table[df];
      }

      // Se df > 120, converge para a distribuição normal padrão Z
      if (df > 120) {
        if (confidenceLevel === 0.95) return 1.96;
        if (confidenceLevel === 0.9) return 1.645;
        if (confidenceLevel === 0.99) return 2.576;
      }

      // Interpolação linear se estiver entre chaves da tabela
      const sortedKeys = Object.keys(table)
        .map(Number)
        .sort((a, b) => a - b);
      for (let i = 0; i < sortedKeys.length - 1; i++) {
        const lowerDf = sortedKeys[i];
        const upperDf = sortedKeys[i + 1];
        if (df > lowerDf && df < upperDf) {
          const ratio = (df - lowerDf) / (upperDf - lowerDf);
          return table[lowerDf] + ratio * (table[upperDf] - table[lowerDf]);
        }
      }
    }

    // Aproximação de Cornish-Fisher para graus de liberdade e níveis arbitrários
    const alpha = 1 - confidenceLevel;
    const p = 1 - alpha / 2;
    const z = this.inverseNormalCdf(p);

    const term1 = z;
    const term2 = (Math.pow(z, 3) + z) / (4 * df);
    const term3 = (5 * Math.pow(z, 5) + 16 * Math.pow(z, 3) + 3 * z) / (96 * Math.pow(df, 2));

    return term1 + term2 + term3;
  }

  /**
   * Aproximação racional de Acklam para o inverso da Normal padrão (quantil normal).
   */
  private inverseNormalCdf(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('Probabilidade deve estar estritamente entre 0 e 1');
    }

    const a = [
      -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269,
      -30.66479806614716, 2.506628277459239,
    ];
    const b = [
      -54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972,
      -13.28068155288572,
    ];
    const c = [
      -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734,
      4.374664141464968, 2.938163982698783,
    ];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    } else if (p <= pHigh) {
      const q = p - 0.5;
      const r = q * q;
      return (
        ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
      );
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return -(
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }
  }

  /**
   * Calcula estatísticas completas de amostragem (AAS) para uma série de valores.
   */
  calculateSamplingStatistics(
    values: number[],
    options?: {
      confidenceLevel?: number;
      targetErrorPercent?: number;
      finitePopulation?: boolean;
      populationSize?: number;
    },
  ): StatisticalMetricResult {
    const confidenceLevel = options?.confidenceLevel ?? 0.95;
    const targetErrorPercent = options?.targetErrorPercent ?? 10;
    const finitePopulation = options?.finitePopulation ?? false;
    const populationSize = options?.populationSize;

    const descriptive = this.calculateDescriptive(values);
    const n = descriptive.n;

    if (n === 0) {
      return {
        ...descriptive,
        standardError: 0,
        standardErrorPercent: 0,
        degreesOfFreedom: 0,
        tStudent: 0,
        confidenceLevel,
        absoluteSamplingError: 0,
        relativeSamplingErrorPercent: 0,
        confidenceIntervalLower: 0,
        confidenceIntervalUpper: 0,
        meetsErrorThreshold: false,
        targetErrorPercent,
      };
    }

    if (n === 1) {
      return {
        ...descriptive,
        standardError: 0,
        standardErrorPercent: 0,
        degreesOfFreedom: 0,
        tStudent: 0,
        confidenceLevel,
        absoluteSamplingError: 0,
        relativeSamplingErrorPercent: 0,
        confidenceIntervalLower: descriptive.mean,
        confidenceIntervalUpper: descriptive.mean,
        meetsErrorThreshold: false,
        targetErrorPercent,
      };
    }

    const degreesOfFreedom = n - 1;
    const tStudent = this.getTStudent(degreesOfFreedom, confidenceLevel);

    let standardError = 0;
    if (finitePopulation && populationSize && populationSize > n) {
      // Fator de correção de população finita: sqrt(1 - f) onde f = n / N
      const f = n / populationSize;
      standardError = Math.sqrt((descriptive.variance / n) * (1 - f));
    } else if (finitePopulation && populationSize && populationSize <= n) {
      // Censo completo da população
      standardError = 0;
    } else {
      // População infinita
      standardError = Math.sqrt(descriptive.variance / n);
    }

    const standardErrorPercent =
      descriptive.mean !== 0 ? (standardError / descriptive.mean) * 100 : 0;

    const absoluteSamplingError = tStudent * standardError;
    const relativeSamplingErrorPercent =
      descriptive.mean !== 0 ? (absoluteSamplingError / descriptive.mean) * 100 : 0;

    const confidenceIntervalLower = Math.max(0, descriptive.mean - absoluteSamplingError);
    const confidenceIntervalUpper = descriptive.mean + absoluteSamplingError;

    const meetsErrorThreshold = relativeSamplingErrorPercent <= targetErrorPercent;

    return {
      ...descriptive,
      standardError,
      standardErrorPercent,
      degreesOfFreedom,
      tStudent,
      confidenceLevel,
      absoluteSamplingError,
      relativeSamplingErrorPercent,
      confidenceIntervalLower,
      confidenceIntervalUpper,
      meetsErrorThreshold,
      targetErrorPercent,
    };
  }

  /**
   * Calcula o diâmetro médio quadrático (dg): sqrt( (1/n) * sum(dap^2) )
   */
  calculateQuadraticMean(daps: number[]): number {
    if (daps.length === 0) return 0;
    const sumSq = daps.reduce((acc, d) => acc + Math.pow(d, 2), 0);
    return Math.sqrt(sumSq / daps.length);
  }

  /**
   * Distribuição diamétrica por classes regulares de diâmetro (ex: 5 cm).
   */
  calculateDiameterClasses(
    trees: Array<{ diameterDapCm: number; volumeM3: number }>,
    classInterval: number = 5,
  ): DiameterClassResult[] {
    if (!trees || trees.length === 0) return [];
    if (!classInterval || classInterval <= 0) {
      classInterval = 5;
    }

    const validTrees = trees.filter((t) => t.diameterDapCm > 0);
    if (validTrees.length === 0) return [];

    const daps = validTrees.map((t) => t.diameterDapCm);
    const minDap = Math.min(...daps);
    const maxDap = Math.max(...daps);

    const start = Math.floor(minDap / classInterval) * classInterval;
    let end = Math.ceil(maxDap / classInterval) * classInterval;
    if (start === end) end = start + classInterval;

    const results: DiameterClassResult[] = [];
    const totalTrees = validTrees.length;

    for (let lower = start; lower < end; lower += classInterval) {
      const upper = lower + classInterval;
      const isLast = upper >= end;

      const matching = validTrees.filter((t) => {
        if (isLast) {
          return t.diameterDapCm >= lower && t.diameterDapCm <= upper;
        }
        return t.diameterDapCm >= lower && t.diameterDapCm < upper;
      });

      const treeCount = matching.length;
      const percentage = totalTrees > 0 ? (treeCount / totalTrees) * 100 : 0;
      const totalVolumeM3 = matching.reduce((acc, t) => acc + (t.volumeM3 || 0), 0);

      results.push({
        classRange: `${lower.toFixed(1)} - ${upper.toFixed(1)} cm`,
        minDapCm: lower,
        maxDapCm: upper,
        treeCount,
        percentage,
        totalVolumeM3,
      });
    }

    return results;
  }

  /**
   * Distribuição por classes de qualidade das árvores.
   */
  calculateQualityClasses(
    trees: Array<{ quality: string; volumeM3: number }>,
  ): QualityClassResult[] {
    if (!trees || trees.length === 0) return [];

    const totalTrees = trees.length;
    const groups = new Map<string, { count: number; volume: number }>();

    for (const tree of trees) {
      const q = tree.quality || 'NORMAL';
      const existing = groups.get(q) || { count: 0, volume: 0 };
      existing.count += 1;
      existing.volume += tree.volumeM3 || 0;
      groups.set(q, existing);
    }

    const results: QualityClassResult[] = [];
    for (const [quality, data] of groups.entries()) {
      results.push({
        quality,
        treeCount: data.count,
        percentage: totalTrees > 0 ? (data.count / totalTrees) * 100 : 0,
        totalVolumeM3: data.volume,
      });
    }

    return results.sort((a, b) => b.treeCount - a.treeCount);
  }
}
