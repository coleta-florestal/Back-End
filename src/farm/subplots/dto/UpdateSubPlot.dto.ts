import { PartialType } from "@nestjs/mapped-types";
import { CreateSubPlotDto } from "./create-subplot.dto";

export class UpdateSubPlotDto extends PartialType(CreateSubPlotDto) {}