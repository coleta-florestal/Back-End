import { IsEnum } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class ApproveUserDto {
  @IsEnum(Role)
  role!: Role;
}
