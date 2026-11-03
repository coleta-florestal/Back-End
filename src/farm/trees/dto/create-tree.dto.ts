import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

import { TreeQuality } from 'src/generated/prisma/enums';

export class CreateTreeDto {
  // Número de identificação da árvore.
  @IsInt()
  @IsPositive()
  number!: number;

  // Diâmetro à altura do peito, em centímetros.
  @IsNumber()
  @IsPositive()
  diameterDapCm!: number;

  // Altura da árvore, em metros.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  // Classificação da qualidade da árvore.
  @IsOptional()
  @IsEnum(TreeQuality)
  quality?: TreeQuality;

  // Observações opcionais sobre a árvore.
  @IsOptional()
  @IsString()
  observations?: string;
}
