import { IsEmail, IsNotEmpty, IsString } from "class-validator";

class SignInDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email!: string
    
    @IsString()
    @IsNotEmpty()
    password!: string
}

export default SignInDto