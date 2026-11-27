import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class HypsometricService {
  private readonly MINIMUM_MEASURED_TREES = 10;

  validateMeasuredTrees(trees: { diameterDapCm: number; height: number | null }[]) {
    const measuredTrees = trees.filter(
      (tree) => tree.height !== null && tree.height > 1.3 && tree.diameterDapCm > 0,
    );

    if (measuredTrees.length < this.MINIMUM_MEASURED_TREES) {
      throw new BadRequestException(
        `Apenas ${measuredTrees.length} árvore(s) com altura e DAP válidos; o mínimo para ajustar o modelo hipsométrico é ${this.MINIMUM_MEASURED_TREES}.`,
      );
    }

    return measuredTrees;
  }

  fitNaslundModel(trees: { diameterDapCm: number; height: number | null }[]) {
    const measuredTrees = this.validateMeasuredTrees(trees);

    const transformedTrees = measuredTrees.map((tree) => ({
      x: tree.diameterDapCm,
      y: tree.diameterDapCm / Math.sqrt(tree.height! - 1.3),
    }));

    const n = transformedTrees.length;

    const sumX = transformedTrees.reduce((sum, tree) => sum + tree.x, 0);
    const sumY = transformedTrees.reduce((sum, tree) => sum + tree.y, 0);
    const sumXY = transformedTrees.reduce((sum, tree) => sum + tree.x * tree.y, 0);
    const sumX2 = transformedTrees.reduce((sum, tree) => sum + tree.x ** 2, 0);

    const denominator = n * sumX2 - sumX ** 2;

    if (!Number.isFinite(denominator) || denominator === 0) {
      throw new BadRequestException(
        'Não foi possível ajustar o modelo hipsométrico com os dados fornecidos.',
      );
    }

    const b = (n * sumXY - sumX * sumY) / denominator;
    const a = (sumY - b * sumX) / n;

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      throw new BadRequestException('Os coeficientes do modelo hipsométrico são inválidos.');
    }

    return { a, b };
  }
  estimateHeight(diameterDapCm: number, a: number, b: number) {
    if (
      !Number.isFinite(diameterDapCm) ||
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      diameterDapCm <= 0
    ) {
      throw new BadRequestException('Não foi possível estimar a altura com os valores fornecidos.');
    }

    const denominator = a + b * diameterDapCm;

    if (!Number.isFinite(denominator) || denominator === 0) {
      throw new BadRequestException('Não foi possível estimar a altura com os valores fornecidos.');
    }

    const height = 1.3 + (diameterDapCm / denominator) ** 2;

    if (!Number.isFinite(height) || height <= 1.3) {
      throw new BadRequestException(
        'O modelo hipsométrico gerou uma estimativa de altura inválida.',
      );
    }

    return height;
  }
}
