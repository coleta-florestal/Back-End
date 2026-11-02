import { IsNumber, IsPositive } from 'class-validator';

export class UpdateValidationSettingsDto {
  @IsNumber()
  @IsPositive()
  minDapCm!: number;

  @IsNumber()
  @IsPositive()
  maxDapCm!: number;

  @IsNumber()
  @IsPositive()
  minHeightM!: number;

  @IsNumber()
  @IsPositive()
  maxHeightM!: number;
}
