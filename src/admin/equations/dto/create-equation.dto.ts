import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { EquationType } from 'src/generated/prisma/enums';

export class CreateEquationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(EquationType)
  modelType!: EquationType;

  @IsNumber()
  beta0!: number;

  @IsNumber()
  beta1!: number;

  @IsOptional()
  @IsNumber()
  beta2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  r2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  syx?: number;
}
