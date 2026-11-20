import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SendEmailDto {
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email!: string
}