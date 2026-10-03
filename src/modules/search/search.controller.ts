import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator.js';

import { SearchService } from './search.service.js';
import { QuerySearchDto } from './dto/index.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Recherche globale dans tout le contenu (projets, services, équipe, clients, témoignages, navigation)',
    description:
      'Recherche insensible à la casse dans la locale demandée. Résultats triés par pertinence.',
  })
  search(@Query() query: QuerySearchDto) {
    return this.service.search(query);
  }
}