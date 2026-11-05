import { IsInt, IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateSubPlotDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsPositive()
  areaM2!: number;

  @IsInt()
  @IsPositive()
  targetTrees!: number;
}
