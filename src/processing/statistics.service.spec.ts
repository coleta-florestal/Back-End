import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(() => {
    service = new StatisticsService();
  });

  describe('calculateDescriptive', () => {
    it('returns zeroes when values array is empty', () => {
      const result = service.calculateDescriptive([]);
      expect(result).toEqual({
        n: 0,
        total: 0,
        mean: 0,
        variance: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
      });
    });

    it('calculates descriptive statistics for a single value correctly', () => {
      const result = service.calculateDescriptive([15.5]);
      expect(result.n).toBe(1);
      expect(result.total).toBe(15.5);
      expect(result.mean).toBe(15.5);
      expect(result.variance).toBe(0);
      expect(result.standardDeviation).toBe(0);
      expect(result.coefficientOfVariation).toBe(0);
    });

    it('calculates sample mean, variance, sd and CV for a known dataset', () => {
      // Valores conhecidos: [10, 12, 14, 16, 18] -> total=70, mean=14
      // Variância amostral (n-1 = 4): (16 + 4 + 0 + 4 + 16) / 4 = 40 / 4 = 10
      // Desvio padrão: sqrt(10) ≈ 3.162277
      // CV: (sqrt(10) / 14) * 100 ≈ 22.5877%
      const values = [10, 12, 14, 16, 18];
      const result = service.calculateDescriptive(values);

      expect(result.n).toBe(5);
      expect(result.total).toBe(70);
      expect(result.mean).toBe(14);
      expect(result.variance).toBe(10);
      expect(result.standardDeviation).toBeCloseTo(Math.sqrt(10), 5);
      expect(result.coefficientOfVariation).toBeCloseTo((Math.sqrt(10) / 14) * 100, 4);
    });

    it('handles zero mean safely without division by zero in CV', () => {
      const result = service.calculateDescriptive([0, 0, 0]);
      expect(result.mean).toBe(0);
      expect(result.coefficientOfVariation).toBe(0);
    });
  });

  describe('getTStudent', () => {
    it('returns exact values from Student t table for confidence level 0.95', () => {
      expect(service.getTStudent(1, 0.95)).toBe(12.706);
      expect(service.getTStudent(2, 0.95)).toBe(4.303);
      expect(service.getTStudent(3, 0.95)).toBe(3.182);
      expect(service.getTStudent(4, 0.95)).toBe(2.776);
      expect(service.getTStudent(5, 0.95)).toBe(2.571);
      expect(service.getTStudent(10, 0.95)).toBe(2.228);
      expect(service.getTStudent(20, 0.95)).toBe(2.086);
      expect(service.getTStudent(30, 0.95)).toBe(2.042);
      expect(service.getTStudent(60, 0.95)).toBe(2.0);
      expect(service.getTStudent(120, 0.95)).toBe(1.98);
      expect(service.getTStudent(200, 0.95)).toBe(1.96);
    });

    it('returns exact values from Student t table for confidence level 0.90', () => {
      expect(service.getTStudent(1, 0.9)).toBe(6.314);
      expect(service.getTStudent(10, 0.9)).toBe(1.812);
      expect(service.getTStudent(30, 0.9)).toBe(1.697);
      expect(service.getTStudent(200, 0.9)).toBe(1.645);
    });

    it('returns exact values from Student t table for confidence level 0.99', () => {
      expect(service.getTStudent(1, 0.99)).toBe(63.657);
      expect(service.getTStudent(10, 0.99)).toBe(3.169);
      expect(service.getTStudent(30, 0.99)).toBe(2.75);
      expect(service.getTStudent(200, 0.99)).toBe(2.576);
    });

    it('interpolates intermediate degrees of freedom correctly', () => {
      // df = 35 está entre 30 (2.042) e 40 (2.021)
      const t35 = service.getTStudent(35, 0.95);
      expect(t35).toBe(2.03);

      // df = 32 interpola entre 30 e 35
      const t32 = service.getTStudent(32, 0.95);
      expect(t32).toBeLessThan(2.042);
      expect(t32).toBeGreaterThan(2.03);
    });

    it('approximates critical t value for arbitrary confidence levels', () => {
      // 80% de confiança
      const t = service.getTStudent(20, 0.8);
      expect(t).toBeGreaterThan(1.2);
      expect(t).toBeLessThan(1.5);
    });
  });

  describe('calculateSamplingStatistics', () => {
    it('handles empty input gracefully', () => {
      const stats = service.calculateSamplingStatistics([]);
      expect(stats.n).toBe(0);
      expect(stats.standardError).toBe(0);
      expect(stats.meetsErrorThreshold).toBe(false);
    });

    it('computes sampling statistics for infinite population', () => {
      // 5 parcelas com volumes por hectare: [100, 110, 120, 130, 140]
      // Mean = 120, s^2 = 250, s = sqrt(250) ≈ 15.811388
      // Standard Error = sqrt(250 / 5) = sqrt(50) ≈ 7.0710678
      // df = 4, t(0.05, 4) = 2.776
      // Absolute Error = 2.776 * sqrt(50) ≈ 19.62928
      // Relative Error % = (19.62928 / 120) * 100 ≈ 16.3577%
      const values = [100, 110, 120, 130, 140];
      const stats = service.calculateSamplingStatistics(values, {
        confidenceLevel: 0.95,
        targetErrorPercent: 10,
        finitePopulation: false,
      });

      expect(stats.n).toBe(5);
      expect(stats.degreesOfFreedom).toBe(4);
      expect(stats.tStudent).toBe(2.776);
      expect(stats.standardError).toBeCloseTo(Math.sqrt(50), 4);
      expect(stats.absoluteSamplingError).toBeCloseTo(2.776 * Math.sqrt(50), 4);
      expect(stats.relativeSamplingErrorPercent).toBeCloseTo(
        ((2.776 * Math.sqrt(50)) / 120) * 100,
        3,
      );
      expect(stats.meetsErrorThreshold).toBe(false); // 16.35% > 10%
      expect(stats.confidenceIntervalLower).toBeCloseTo(120 - 2.776 * Math.sqrt(50), 3);
      expect(stats.confidenceIntervalUpper).toBeCloseTo(120 + 2.776 * Math.sqrt(50), 3);
    });

    it('applies finite population correction factor when enabled and populationSize is given', () => {
      const values = [100, 110, 120, 130, 140]; // n = 5
      const populationSize = 20; // N = 20, f = 5/20 = 0.25, 1 - f = 0.75
      // s_x_bar_finite = sqrt(50 * 0.75) = sqrt(37.5) ≈ 6.123724
      const stats = service.calculateSamplingStatistics(values, {
        confidenceLevel: 0.95,
        targetErrorPercent: 20,
        finitePopulation: true,
        populationSize,
      });

      expect(stats.standardError).toBeCloseTo(Math.sqrt(37.5), 4);
      expect(stats.absoluteSamplingError).toBeCloseTo(2.776 * Math.sqrt(37.5), 4);
      expect(stats.meetsErrorThreshold).toBe(true); // ~14.16% <= 20%
    });

    it('sets standard error to 0 if population size is less than or equal to sample size (census)', () => {
      const values = [100, 110, 120];
      const stats = service.calculateSamplingStatistics(values, {
        finitePopulation: true,
        populationSize: 3,
      });

      expect(stats.standardError).toBe(0);
      expect(stats.absoluteSamplingError).toBe(0);
      expect(stats.relativeSamplingErrorPercent).toBe(0);
      expect(stats.meetsErrorThreshold).toBe(true);
    });

    it('does not produce negative lower confidence interval bound', () => {
      // Alto erro amostral
      const values = [0.1, 50];
      const stats = service.calculateSamplingStatistics(values);

      expect(stats.confidenceIntervalLower).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateQuadraticMean', () => {
    it('returns 0 for empty array', () => {
      expect(service.calculateQuadraticMean([])).toBe(0);
    });

    it('calculates dg correctly: sqrt(mean(dap^2))', () => {
      // DAPs: [10, 20] -> squares: 100, 400 -> mean square: 250 -> sqrt(250) ≈ 15.811388
      const daps = [10, 20];
      expect(service.calculateQuadraticMean(daps)).toBeCloseTo(Math.sqrt(250), 5);
    });
  });

  describe('calculateDiameterClasses', () => {
    it('returns empty array when no trees provided', () => {
      expect(service.calculateDiameterClasses([])).toEqual([]);
    });

    it('groups trees into diameter classes with 5 cm interval and calculates percentages and volumes', () => {
      const trees = [
        { diameterDapCm: 11.0, volumeM3: 0.1 },
        { diameterDapCm: 13.5, volumeM3: 0.15 },
        { diameterDapCm: 16.0, volumeM3: 0.25 },
        { diameterDapCm: 22.0, volumeM3: 0.5 },
      ];

      const classes = service.calculateDiameterClasses(trees, 5);

      // Min = 11 -> start 10; Max = 22 -> end 25
      // Classes esperadas: [10 - 15], [15 - 20], [20 - 25]
      expect(classes.length).toBe(3);

      expect(classes[0].classRange).toBe('10.0 - 15.0 cm');
      expect(classes[0].treeCount).toBe(2);
      expect(classes[0].percentage).toBe(50);
      expect(classes[0].totalVolumeM3).toBeCloseTo(0.25, 4);

      expect(classes[1].classRange).toBe('15.0 - 20.0 cm');
      expect(classes[1].treeCount).toBe(1);
      expect(classes[1].percentage).toBe(25);
      expect(classes[1].totalVolumeM3).toBeCloseTo(0.25, 4);

      expect(classes[2].classRange).toBe('20.0 - 25.0 cm');
      expect(classes[2].treeCount).toBe(1);
      expect(classes[2].percentage).toBe(25);
      expect(classes[2].totalVolumeM3).toBeCloseTo(0.5, 4);
    });
  });

  describe('calculateQualityClasses', () => {
    it('returns empty array when no trees provided', () => {
      expect(service.calculateQualityClasses([])).toEqual([]);
    });

    it('aggregates trees by quality and sorts by tree count descending', () => {
      const trees = [
        { quality: 'NORMAL', volumeM3: 0.5 },
        { quality: 'NORMAL', volumeM3: 0.6 },
        { quality: 'BIFURCADA', volumeM3: 0.4 },
        { quality: 'MORTA', volumeM3: 0.1 },
      ];

      const result = service.calculateQualityClasses(trees);

      expect(result.length).toBe(3);
      expect(result[0].quality).toBe('NORMAL');
      expect(result[0].treeCount).toBe(2);
      expect(result[0].percentage).toBe(50);
      expect(result[0].totalVolumeM3).toBeCloseTo(1.1, 4);

      expect(result[1].treeCount).toBe(1);
      expect(result[2].treeCount).toBe(1);
    });

    it('falls back to NORMAL quality when tree quality is falsy', () => {
      const trees: Array<{ quality: string; volumeM3: number }> = [{ quality: '', volumeM3: 0.2 }];
      const result = service.calculateQualityClasses(trees);
      expect(result[0].quality).toBe('NORMAL');
    });
  });

  describe('edge cases', () => {
    it('returns empty diameter classes if all trees have dap <= 0', () => {
      const trees = [{ diameterDapCm: 0, volumeM3: 0 }];
      expect(service.calculateDiameterClasses(trees)).toEqual([]);
    });

    it('handles single sample (n=1) in calculateSamplingStatistics', () => {
      const result = service.calculateSamplingStatistics([100]);
      expect(result.n).toBe(1);
      expect(result.degreesOfFreedom).toBe(0);
      expect(result.tStudent).toBe(0);
      expect(result.standardError).toBe(0);
      expect(result.absoluteSamplingError).toBe(0);
      expect(result.confidenceIntervalLower).toBe(100);
      expect(result.confidenceIntervalUpper).toBe(100);
      expect(result.meetsErrorThreshold).toBe(false);
    });

    it('returns 0 for getTStudent when degreesOfFreedom < 1', () => {
      expect(service.getTStudent(0, 0.95)).toBe(0);
      expect(service.getTStudent(-1, 0.95)).toBe(0);
    });

    it('handles non-positive classInterval safely in calculateDiameterClasses', () => {
      const trees = [
        { diameterDapCm: 12, volumeM3: 0.1 },
        { diameterDapCm: 18, volumeM3: 0.2 },
      ];
      const result = service.calculateDiameterClasses(trees, 0);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('calculates diameter class percentages based only on trees with DAP > 0 so total equals 100%', () => {
      const trees = [
        { diameterDapCm: 0, volumeM3: 0 }, // inválida
        { diameterDapCm: 12, volumeM3: 0.1 },
        { diameterDapCm: 18, volumeM3: 0.2 },
      ];
      const result = service.calculateDiameterClasses(trees, 5);
      const sumPercentage = result.reduce((acc, c) => acc + c.percentage, 0);
      expect(sumPercentage).toBeCloseTo(100, 4);
    });

    it('handles all zeroes with mean=0 in calculateSamplingStatistics', () => {
      const result = service.calculateSamplingStatistics([0, 0]);
      expect(result.mean).toBe(0);
      expect(result.standardErrorPercent).toBe(0);
      expect(result.relativeSamplingErrorPercent).toBe(0);
    });

    it('calculates tails correctly for arbitrary high and low confidence levels', () => {
      const tLow = service.getTStudent(20, 0.6);
      const tHigh = service.getTStudent(20, 0.999);
      expect(tLow).toBeGreaterThan(0.8);
      expect(tLow).toBeLessThan(1.0);
      expect(tHigh).toBeGreaterThan(3.5);
    });
  });
});
