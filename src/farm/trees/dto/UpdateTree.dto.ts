import { PartialType } from '@nestjs/mapped-types';

import { CreateTreeDto } from './CreateTree.dto';

export class UpdateTreeDto extends PartialType(CreateTreeDto) {}
