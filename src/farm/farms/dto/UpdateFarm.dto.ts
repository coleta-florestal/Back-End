import { PartialType } from "@nestjs/mapped-types";
import { CreateFarmDto } from "./CreateFarm.dto";

export class UpdateFarm extends PartialType(CreateFarmDto) {}