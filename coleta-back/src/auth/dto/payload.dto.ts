import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator"
import { Role } from "src/generated/prisma/enums"

export class PayloadDto {
    @IsUUID()
    @IsNotEmpty()
    @IsString()
    id!: string

    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email!: string
    
    @IsEnum(Role)
    @IsNotEmpty()
    role!: Role
}