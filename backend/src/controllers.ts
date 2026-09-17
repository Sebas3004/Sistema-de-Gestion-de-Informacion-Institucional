import { Body, Controller, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService, JwtAuthGuard, Roles, RolesGuard } from './auth';
import { RoleName } from './entities';
import { AuditService, CorrespondenceService, FormsService, LinksService, NewsService, ProcedureService, RepositoryService, UsersService } from './services';

@Controller('auth') export class AuthController{constructor(private auth:AuthService){} @Post('login') login(@Body() b:any){return this.auth.login(b.email,b.password)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('users') export class UsersController{constructor(private s:UsersService){} @Get() @Roles(RoleName.ADMIN) list(){return this.s.list()} @Post() @Roles(RoleName.ADMIN) create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)} @Patch(':id') @Roles(RoleName.ADMIN) update(@Param('id') id:string,@Body() b:any,@Req() r:any){return this.s.update(id,b,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('correspondence') export class CorrespondenceController{constructor(private s:CorrespondenceService){} @Get() list(){return this.s.list()} @Get(':id') get(@Param('id') id:string){return this.s.get(id)} @Post() create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)} @Patch(':id') update(@Param('id') id:string,@Body() b:any,@Req() r:any){return this.s.update(id,b,r.user)} @Post(':id/comments') comment(@Param('id') id:string,@Body() b:any,@Req() r:any){return this.s.addComment(id,b.body,r.user)} @Post(':id/attachments') @UseInterceptors(FileInterceptor('file',{storage:diskStorage({destination:process.env.UPLOAD_DIR||'./uploads',filename:(_,f,cb)=>cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${extname(f.originalname)}`)})})) attachment(@Param('id') id:string,@UploadedFile() file:any,@Req() r:any){return this.s.addAttachment(id,file,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('repository') export class RepositoryController{constructor(private s:RepositoryService){} @Get() list(){return this.s.list()} @Post() @Roles(RoleName.ADMIN,RoleName.EDITOR) create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)} @Patch(':id') @Roles(RoleName.ADMIN,RoleName.EDITOR) update(@Param('id') id:string,@Body() b:any,@Req() r:any){return this.s.update(id,b,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('procedures') export class ProcedureController{constructor(private s:ProcedureService){} @Get() list(){return this.s.list()} @Get(':id') get(@Param('id') id:string){return this.s.get(id)} @Post() @Roles(RoleName.ADMIN,RoleName.EDITOR) create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('forms') export class FormsController{constructor(private s:FormsService){} @Get() list(){return this.s.list()} @Post() @Roles(RoleName.ADMIN,RoleName.EDITOR) create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)} @Post(':id/download') download(@Param('id') id:string,@Req() r:any){return this.s.download(id,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('links') export class LinksController{constructor(private s:LinksService){} @Get() list(){return this.s.list()} @Post() @Roles(RoleName.ADMIN,RoleName.EDITOR) create(@Body() b:any){return this.s.create(b)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('news') export class NewsController{constructor(private s:NewsService){} @Get() list(){return this.s.list()} @Post() @Roles(RoleName.ADMIN,RoleName.EDITOR) create(@Body() b:any,@Req() r:any){return this.s.create(b,r.user)}}

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('audit') export class AuditController{constructor(private s:AuditService){} @Get('mine') mine(@Req() r:any){return this.s.list(r.user,false)} @Get('all') @Roles(RoleName.ADMIN) all(@Req() r:any){return this.s.list(r.user,true)}}
