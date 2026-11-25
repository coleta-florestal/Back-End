import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './CreateProfile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
