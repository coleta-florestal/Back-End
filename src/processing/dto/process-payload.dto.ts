import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TreeQuality } from 'src/generated/prisma/enums';
import { ProcessInventoryDto } from './process-inventory.dto';

export class PayloadTreeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  diameterDapCm!: number;

  @IsOptional()
  @IsNumber()
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
  @ValidateNested({ each: true })
  @Type(() => PayloadSubPlotDto)
  subPlots!: PayloadSubPlotDto[];
}
