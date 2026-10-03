import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class NavReorderItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Nouveau parent (null pour racine)',
  })
  @IsString()
  parentId!: string | null;
}

export class ReorderNavDto {
  @ApiProperty({ type: [NavReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NavReorderItemDto)
  items!: NavReorderItemDto[];
}