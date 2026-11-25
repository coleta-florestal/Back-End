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
        'Não há árvores com altura e DAP válidos suficientes para ajustar o modelo hipsométrico.',
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

    if (denominator === 0) {
      throw new BadRequestException(
        'Não foi possível ajustar o modelo hipsométrico com os dados fornecidos.',
      );
    }

    const b = (n * sumXY - sumX * sumY) / denominator;
    const a = (sumY - b * sumX) / n;

    return { a, b };
  }

  estimateHeight(diameterDapCm: number, a: number, b: number) {
    const denominator = a + b * diameterDapCm;

    if (diameterDapCm <= 0 || denominator === 0) {
      throw new BadRequestException('Não foi possível estimar a altura com os valores fornecidos.');
    }

    const height = 1.3 + (diameterDapCm / denominator) ** 2;

    if (!Number.isFinite(height) || height <= 0) {
      throw new BadRequestException(
        'O modelo hipsométrico gerou uma estimativa de altura inválida.',
      );
    }

    return height;
  }
}
