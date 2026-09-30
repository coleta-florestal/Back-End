import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";

class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @MinLength(3) 
    userName!: string
    
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email!: string
    
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minSymbols: 1,
        minNumbers: 1
    }, {
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one symbol, one number"
    })
    password!: string
    
    @IsString()
    @IsNotEmpty()
    confirmPassword!: string
}

export default CreateUserDto;