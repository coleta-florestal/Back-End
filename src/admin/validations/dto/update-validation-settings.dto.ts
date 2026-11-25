import { IsNumber, IsPositive, Max } from 'class-validator';

export class UpdateValidationSettingsDto {
  @IsNumber()
  @IsPositive()
  @Max(1000)
  minDapCm!: number;

  @IsNumber()
  @IsPositive()
  @Max(1000)
  maxDapCm!: number;

  @IsNumber()
  @IsPositive()
  @Max(150)
  minHeightM!: number;

  @IsNumber()
  @IsPositive()
  @Max(150)
  maxHeightM!: number;
}
