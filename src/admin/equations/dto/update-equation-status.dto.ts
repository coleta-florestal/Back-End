import { IsBoolean } from 'class-validator';

export class UpdateEquationStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
