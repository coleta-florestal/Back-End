import { PartialType } from "@nestjs/mapped-types";
import { CreatePlotDto } from "./CreatePlot.dto";

export class UpdatePlotDto extends PartialType(CreatePlotDto) {}