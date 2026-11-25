import { PartialType } from '@nestjs/mapped-types';
import { CreateEquationDto } from './create-equation.dto';

export class UpdateEquationDto extends PartialType(CreateEquationDto) {}
