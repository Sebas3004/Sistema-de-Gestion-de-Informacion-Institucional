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
  AddDocumentDto,
  CloseExpedienteDto,
  CreateExpedienteDto,
  ListExpedientesQueryDto,
  UpdateExpedienteDto,
} from './expedientes.dto';

import { ExpedientesService } from './expedientes.service';

/* =========================================================
   CONTROLADOR DE EXPEDIENTES (REQ-EXP-002.1)

   CONSULTA:                 ADMIN / EDITOR / CONSULTOR
   CREAR / EDITAR / FOLIAR:  ADMIN / EDITOR
   CERRAR:                   ADMIN

   Cada endpoint declara @Roles: sin él, RolesGuard
   no restringe nada.
========================================================= */

@Controller('expedientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ExpedientesController {
  constructor(private readonly service: ExpedientesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  list(@Query() query: ListExpedientesQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() body: CreateExpedienteDto, @Req() request: any) {
    return this.service.create(body, request.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.EDITOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExpedienteDto,
    @Req() request: any,
  ) {
    return this.service.update(id, body, request.user);
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.EDITOR)
  addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddDocumentDto,
    @Req() request: any,
  ) {
    return this.service.addDocument(id, body.documentId, request.user);
  }

  @Patch(':id/close')
  @Roles(Role.ADMIN)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CloseExpedienteDto,
    @Req() request: any,
  ) {
    return this.service.close(id, body.reason, request.user);
  }
}
