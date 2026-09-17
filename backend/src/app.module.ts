import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Correspondence, CorrespondenceAttachment, CorrespondenceComment, ExternalLink, InstitutionalForm, News, Procedure, ProcedureStep, RepositoryDocument, Role, User } from './entities';
import { AuthService, JwtAuthGuard, RolesGuard } from './auth';
import { AuditService, CorrespondenceService, FormsService, LinksService, NewsService, ProcedureService, RepositoryService, UsersService } from './services';
import { AuditController, AuthController, CorrespondenceController, FormsController, LinksController, NewsController, ProcedureController, RepositoryController, UsersController } from './controllers';

const entities=[Role,User,Correspondence,CorrespondenceAttachment,CorrespondenceComment,RepositoryDocument,Procedure,ProcedureStep,InstitutionalForm,ExternalLink,News,AuditLog];
@Module({
 imports:[ConfigModule.forRoot({isGlobal:true}),TypeOrmModule.forRootAsync({inject:[ConfigService],useFactory:(c:ConfigService)=>({type:'postgres',host:c.get('DB_HOST','localhost'),port:+c.get('DB_PORT',5432),username:c.get('DB_USER','sgip'),password:c.get('DB_PASSWORD','sgip'),database:c.get('DB_NAME','sgip'),entities,synchronize:true})}),TypeOrmModule.forFeature(entities),JwtModule.registerAsync({inject:[ConfigService],useFactory:(c:ConfigService)=>({secret:c.get('JWT_SECRET','dev-secret'),signOptions:{expiresIn:'8h'}})})],
 controllers:[AuthController,UsersController,CorrespondenceController,RepositoryController,ProcedureController,FormsController,LinksController,NewsController,AuditController],
 providers:[AuthService,JwtAuthGuard,RolesGuard,AuditService,UsersService,CorrespondenceService,RepositoryService,ProcedureService,FormsService,LinksService,NewsService]
}) export class AppModule{}
