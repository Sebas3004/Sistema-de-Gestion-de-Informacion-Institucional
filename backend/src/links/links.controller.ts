import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth';
import { Role } from '../roles';
import { Roles } from '../roles.decorator';
import { RolesGuard } from '../roles.guard';

import {
  CreateLinkDto,
  ListLinksQueryDto,
  UpdateLinkDto,
} from './links.dto';

import { LinksService } from './links.service';

/* =========================================================
   CONTROLADOR DE ENLACES (ACCESOS RÁPIDOS)

   CONSULTA:               ADMIN / EDITOR / CONSULTOR
   CREAR / EDITAR:         ADMIN / EDITOR
   DESACTIVAR / RESTAURAR: ADMIN

   Cada endpoint declara @Roles: sin él, RolesGuard
   no restringe nada.
========================================================= */

@Controller('links')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Get()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  list(@Query() query: ListLinksQueryDto) {
    return this.service.list(query);
  }

  @Get('manage')
  @Roles(Role.ADMIN, Role.EDITOR)
  listAll() {
    return this.service.listAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() body: CreateLinkDto, @Req() request: any) {
    return this.service.create(body, request.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.EDITOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLinkDto,
    @Req() request: any,
  ) {
    return this.service.update(id, body, request.user);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: any,
  ) {
    return this.service.deactivate(id, request.user);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: any,
  ) {
    return this.service.restore(id, request.user);
  }
}
