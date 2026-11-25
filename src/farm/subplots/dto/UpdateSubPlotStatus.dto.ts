import { IsEnum } from 'class-validator';
import { SubPlotStatus } from 'src/generated/prisma/enums';

export class UpdateSubPlotStatusDto {
  @IsEnum(SubPlotStatus)
  status!: SubPlotStatus;
}
