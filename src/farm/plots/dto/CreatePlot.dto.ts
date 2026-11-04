import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlotDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  areaHA!: number;
}
