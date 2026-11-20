import { IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator"

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @IsStrongPassword(
    {
        minUppercase: 1,
        minLowercase: 1,
        minSymbols: 1,
        minNumbers: 1,
    },
    {
        message: 'Senha deve conter, pelo menos, 1 letra maiúscula, 1 símbolo e 1 número',
    },
    )
    password!: string

    @IsString()
    @IsNotEmpty()
    token!: string
}