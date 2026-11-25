import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { CustomEquationDto } from './custom-equation.dto';

export class ValidationLimitsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  minDapCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDapCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  minHeightM?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxHeightM?: number;
}

export class ProcessInventoryDto {
  @IsOptional()
  @IsUUID()
  equationId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomEquationDto)
  equation?: CustomEquationDto;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.999)
  confidenceLevel?: number = 0.95;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  errorThresholdPercent?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultParcelaAreaM2?: number;

  @IsOptional()
  @IsBoolean()
  finitePopulation?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationLimitsDto)
  validationLimits?: ValidationLimitsDto;

  @IsOptional()
  @IsBoolean()
  includeTreesInResult?: boolean = false;
}
