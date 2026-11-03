import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

import { CreateTreeDto } from './create-tree.dto';

export class CreateTreeBatchDto {
  // Lista de árvores que serão cadastradas na parcela.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTreeDto)
  trees!: CreateTreeDto[];
}
