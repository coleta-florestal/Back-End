import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TreeQuality } from 'src/generated/prisma/enums';
import { ProcessInventoryDto } from './process-inventory.dto';

const MAX_SUBPLOTS = 500;
const MAX_TREES_PER_SUBPLOT = 1000;

export class PayloadTreeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @IsPositive()
  diameterDapCm!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  heightM?: number;

  @IsOptional()
  @IsEnum(TreeQuality)
  quality?: TreeQuality = TreeQuality.NORMAL;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class PayloadSubPlotDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  areaM2?: number;

  @IsArray()
  @ArrayMaxSize(MAX_TREES_PER_SUBPLOT)
  @ValidateNested({ each: true })
  @Type(() => PayloadTreeDto)
  trees!: PayloadTreeDto[];
}

export class ProcessPayloadDto extends ProcessInventoryDto {
  @IsOptional()
  @IsString()
  plotName?: string = 'Talhão Simulado';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  plotAreaHa?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SUBPLOTS)
  @ValidateNested({ each: true })
  @Type(() => PayloadSubPlotDto)
  subPlots!: PayloadSubPlotDto[];
}
