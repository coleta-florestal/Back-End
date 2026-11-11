import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { EquationType } from 'src/generated/prisma/enums';

export class CustomEquationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsEnum(EquationType)
  modelType!: EquationType;

  @IsNumber()
  beta0!: number;

  @IsNumber()
  beta1!: number;

  @IsOptional()
  @IsNumber()
  beta2?: number | null;
}
