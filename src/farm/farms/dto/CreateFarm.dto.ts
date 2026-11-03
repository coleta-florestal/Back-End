import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsNotEmpty()
  @IsUUID()
  ownerId!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
