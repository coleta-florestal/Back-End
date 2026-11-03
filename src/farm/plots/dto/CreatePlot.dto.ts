import { IsDecimal, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreatePlotDto {
    @IsNotEmpty()
    @IsString()
    name!: string

    @IsOptional()
    @IsString()
    description!: string

    @IsDecimal()
    @IsNotEmpty()
    area!: number
}