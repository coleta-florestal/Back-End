import { PartialType } from '@nestjs/mapped-types';
import { CreateSubPlotDto } from './CreateSubPlot.dto';

export class UpdateSubPlotDto extends PartialType(CreateSubPlotDto) {}
