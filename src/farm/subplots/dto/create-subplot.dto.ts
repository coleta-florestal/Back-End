import { IsInt, IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateSubPlotDto {
  @IsInt()
  @IsPositive()
  number!: number;

  @IsNumber()
  @IsPositive()
  areaM2!: number;

  @IsInt()
  @IsPositive()
  targetTrees!: number;

  @IsString()
  @IsNotEmpty()
  plotId!: string;
}
