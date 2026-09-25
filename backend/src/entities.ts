import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RoleName { ADMIN='ADMIN', EDITOR='EDITOR', CONSULTOR='CONSULTOR' }
export enum CorrespondenceStatus { PENDIENTE='PENDIENTE', EN_REVISION='EN_REVISION', RESPONDIDO='RESPONDIDO', VENCIDO='VENCIDO' }
export enum ContentStatus { ACTIVO='ACTIVO', INACTIVO='INACTIVO', EN_REVISION='EN_REVISION', PUBLICADO='PUBLICADO' }

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({unique:true}) name:RoleName;
  @Column({nullable:true}) description:string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() name:string;
  @Column({unique:true}) email:string;
  @Column({select:false}) passwordHash:string;
  @Column({nullable:true}) position:string;
  @Column({default:true}) active:boolean;
  @Column({default:false}) mustChangePassword:boolean;
  @Column({type:'timestamp',nullable:true}) deletedAt:Date;
  @Column('text',{nullable:true}) deletionReason:string;
  @ManyToMany(()=>Role,{eager:true}) @JoinTable({name:'user_roles'}) roles:Role[];
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('correspondence')
export class Correspondence {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({unique:true}) code:string;
  @Column() subject:string;
  @Column('text') description:string;
  @Column({default:'Solicitud'}) type:string;
  @Column({default:'MEDIA'}) priority:string;
  @Column({type:'enum',enum:CorrespondenceStatus,default:CorrespondenceStatus.PENDIENTE}) status:CorrespondenceStatus;
  @ManyToOne(()=>User,{eager:true}) @JoinColumn({name:'sender_id'}) sender:User;
  @ManyToOne(()=>User,{eager:true}) @JoinColumn({name:'responsible_id'}) responsible:User;
  @ManyToMany(()=>User,{eager:true}) @JoinTable({name:'correspondence_participants'}) participants:User[];
  @Column({type:'timestamp',nullable:true}) dueDate:Date;
  @OneToMany(()=>CorrespondenceAttachment,a=>a.correspondence,{cascade:true,eager:true}) attachments:CorrespondenceAttachment[];
  @OneToMany(()=>CorrespondenceComment,c=>c.correspondence,{cascade:true,eager:true}) comments:CorrespondenceComment[];
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('correspondence_attachments')
export class CorrespondenceAttachment {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() originalName:string;
  @Column() storedName:string;
  @Column() mimeType:string;
  @Column({type:'bigint'}) size:number;
  @ManyToOne(()=>Correspondence,c=>c.attachments,{onDelete:'CASCADE'}) correspondence:Correspondence;
  @CreateDateColumn() createdAt:Date;
}

@Entity('correspondence_comments')
export class CorrespondenceComment {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column('text') body:string;
  @ManyToOne(()=>User,{eager:true}) author:User;
  @ManyToOne(()=>Correspondence,c=>c.comments,{onDelete:'CASCADE'}) correspondence:Correspondence;
  @CreateDateColumn() createdAt:Date;
}

@Entity('repository_documents')
export class RepositoryDocument {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() name:string;
  @Column({default:'Otro'}) type:string;
  @Column({default:'Otros'}) category:string;
  @Column('text',{nullable:true}) description:string;
  @Column({nullable:true}) version:string;
  @Column({default:ContentStatus.ACTIVO}) status:string;
  @Column({nullable:true}) originalName:string;
  @Column({nullable:true}) storedName:string;
  @Column({nullable:true}) mimeType:string;
  @Column({type:'bigint',nullable:true}) size:number;
  @ManyToOne(()=>User,{eager:true,nullable:true}) responsible:User;
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('procedures')
export class Procedure {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({unique:true}) code:string;
  @Column() name:string;
  @Column('text') description:string;
  @Column({default:'Administrativo'}) category:string;
  @Column({default:'ACTIVO'}) status:string;
  @Column() responsibleArea:string;
  @Column({type:'date',nullable:true}) validFrom:Date;
  @Column({type:'date',nullable:true}) validUntil:Date;
  @Column('text',{nullable:true}) normative:string;
  @Column('simple-array',{nullable:true}) requirements:string[];
  @OneToMany(()=>ProcedureStep,s=>s.procedure,{cascade:true,eager:true}) steps:ProcedureStep[];
  @Column('simple-json',{nullable:true}) links:{label:string,url:string}[];
  @Column('simple-json',{nullable:true}) relatedForms:{label:string,formId?:string,url?:string}[];
  @Column('simple-json',{nullable:true}) relatedDocuments:{label:string,documentId?:string}[];
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('procedure_steps')
export class ProcedureStep {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() stepOrder:number;
  @Column() title:string;
  @Column('text') description:string;
  @ManyToOne(()=>Procedure,p=>p.steps,{onDelete:'CASCADE'}) procedure:Procedure;
}

@Entity('forms')
export class InstitutionalForm {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() name:string;
  @Column('text',{nullable:true}) description:string;
  @Column() category:string;
  @Column() format:string;
  @Column({nullable:true}) originalName:string;
  @Column({nullable:true}) storedName:string;
  @Column({nullable:true}) mimeType:string;
  @Column({type:'bigint',nullable:true}) size:number;
  @ManyToOne(()=>User,{eager:true,nullable:true}) createdBy:User;
  @ManyToOne(()=>User,{eager:true,nullable:true}) updatedBy:User;
  @Column({default:0}) downloads:number;
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('external_links')
export class ExternalLink {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() name:string;
  @Column() url:string;
  @Column('text',{nullable:true}) description:string;
  @Column({default:'Institucional'}) category:string;
  @Column({default:true}) active:boolean;
}

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() title:string;
  @Column('text') summary:string;
  @Column('text',{nullable:true}) content:string;
  @Column({default:'Campus'}) category:string;
  @Column({nullable:true}) imageUrl:string;
  @ManyToOne(()=>User,{eager:true,nullable:true}) author:User;
  @Column({default:true}) published:boolean;
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>User,{eager:true,nullable:true}) user:User;
  @Column() action:string;
  @Column() entity:string;
  @Column({nullable:true}) entityId:string;
  @Column('text',{nullable:true}) detail:string;
  @CreateDateColumn() createdAt:Date;
}
