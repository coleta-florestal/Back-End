import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @MinLength(3) 
    userName: string;
    
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;
    
    @IsString()
    @IsNotEmpty()
    password: string;
    
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}

export default CreateUserDto;