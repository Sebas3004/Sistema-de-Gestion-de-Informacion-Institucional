import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/* =========================================================
   ENUMS
========================================================= */

export enum RoleName {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  CONSULTOR = 'CONSULTOR',
}

/*
 * IMPORTANTE:
 * Esta entidad se mantiene porque actualmente representa
 * el módulo que visualmente llamamos ASIGNACIONES.
 */
export enum CorrespondenceStatus {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  RESPONDIDO = 'RESPONDIDO',
  VENCIDO = 'VENCIDO',
}

export enum ContentStatus {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  EN_REVISION = 'EN_REVISION',
  PUBLICADO = 'PUBLICADO',
}

export enum NewsPriority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

/*
 * Correspondencia institucional real.
 */
export enum InstitutionalCorrespondenceDirection {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export enum InstitutionalCorrespondenceStatus {
  RECIBIDA = 'RECIBIDA',
  ASIGNADA = 'ASIGNADA',
  EN_TRAMITE = 'EN_TRAMITE',
  RESPONDIDA = 'RESPONDIDA',
  CERRADA = 'CERRADA',
  VENCIDA = 'VENCIDA',
}

/* =========================================================
   ROLES
========================================================= */

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: RoleName;

  @Column({
    nullable: true,
  })
  description: string;
}

/* =========================================================
   USUARIOS
========================================================= */

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    select: false,
  })
  passwordHash: string;

  @Column({
    nullable: true,
  })
  position: string;

  @Column({
    default: true,
  })
  active: boolean;

  @Column({
    default: false,
  })
  mustChangePassword: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;

  @Column('text', {
    nullable: true,
  })
  deletionReason: string;

  @ManyToMany(() => Role, {
    eager: true,
  })
  @JoinTable({
    name: 'user_roles',
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* =========================================================
   ASIGNACIONES
   Internamente se mantiene el nombre Correspondence
   para no romper datos existentes.
========================================================= */

@Entity('correspondence')
export class Correspondence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  code: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({
    default: 'Solicitud',
  })
  type: string;

  @Column({
    default: 'MEDIA',
  })
  priority: string;

  @Column({
    type: 'enum',
    enum: CorrespondenceStatus,
    default: CorrespondenceStatus.PENDIENTE,
  })
  status: CorrespondenceStatus;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({
    name: 'sender_id',
  })
  sender: User;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({
    name: 'responsible_id',
  })
  responsible: User;

  @ManyToMany(() => User, {
    eager: true,
  })
  @JoinTable({
    name: 'correspondence_participants',
  })
  participants: User[];

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  dueDate: Date;

  @OneToMany(
    () => CorrespondenceAttachment,
    (attachment) =>
      attachment.correspondence,
    {
      cascade: true,
      eager: true,
    },
  )
  attachments: CorrespondenceAttachment[];

  @OneToMany(
    () => CorrespondenceComment,
    (comment) =>
      comment.correspondence,
    {
      cascade: true,
      eager: true,
    },
  )
  comments: CorrespondenceComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('correspondence_attachments')
export class CorrespondenceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  storedName: string;

  @Column()
  mimeType: string;

  @Column({
    type: 'bigint',
  })
  size: number;

  @ManyToOne(
    () => Correspondence,
    (correspondence) =>
      correspondence.attachments,
    {
      onDelete: 'CASCADE',
    },
  )
  correspondence: Correspondence;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('correspondence_comments')
export class CorrespondenceComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  body: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  author: User;

  @ManyToOne(
    () => Correspondence,
    (correspondence) =>
      correspondence.comments,
    {
      onDelete: 'CASCADE',
    },
  )
  correspondence: Correspondence;

  @CreateDateColumn()
  createdAt: Date;
}

/* =========================================================
   CORRESPONDENCIA INSTITUCIONAL
   Módulo nuevo separado de Asignaciones.
========================================================= */

@Entity('institutional_correspondence')
export class InstitutionalCorrespondence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*
   * Código interno generado por el sistema.
   * Ejemplo: CI-2026-00001
   */
  @Column({
    unique: true,
  })
  code: string;

  /*
   * Número oficial del oficio, memorando o documento.
   * Puede no existir al momento de registrar una entrada.
   */
  @Column({
    nullable: true,
  })
  referenceNumber: string;

  /*
   * ENTRADA o SALIDA.
   */
  @Column({
    type: 'enum',
    enum: InstitutionalCorrespondenceDirection,
  })
  direction: InstitutionalCorrespondenceDirection;

  /*
   * Oficio, memorando, circular, nota, etc.
   */
  @Column({
    default: 'Oficio',
  })
  documentType: string;

  @Column()
  subject: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  /*
   * Se mantienen como texto porque pueden ser personas,
   * oficinas o instituciones externas que no necesariamente
   * son usuarios del sistema.
   */
  @Column()
  sender: string;

  @Column()
  recipient: string;

  /*
   * Fecha en que la correspondencia fue recibida.
   * Aplica principalmente a ENTRADA.
   */
  @Column({
    type: 'date',
    nullable: true,
  })
  receivedDate: Date;

  /*
   * Fecha en que el documento fue emitido/enviado.
   * Aplica principalmente a SALIDA.
   */
  @Column({
    type: 'date',
    nullable: true,
  })
  issuedDate: Date;

  /*
   * Fecha máxima para atender o responder.
   */
  @Column({
    type: 'date',
    nullable: true,
  })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: InstitutionalCorrespondenceStatus,
    default:
      InstitutionalCorrespondenceStatus.RECIBIDA,
  })
  status: InstitutionalCorrespondenceStatus;

  /*
   * Usuario encargado del seguimiento.
   */
  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'responsible_id',
  })
  responsible: User;

  /*
   * Usuario que registró el documento en el sistema.
   */
  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'created_by_id',
  })
  createdBy: User;

  /*
   * Datos de la respuesta final.
   */
  @Column({
    nullable: true,
  })
  responseReference: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  responseDate: Date;

  @Column('text', {
    nullable: true,
  })
  responseSummary: string;

  /*
   * Archivos relacionados con la correspondencia.
   */
  @OneToMany(
    () =>
      InstitutionalCorrespondenceAttachment,
    (attachment) =>
      attachment.correspondence,
    {
      cascade: true,
      eager: true,
    },
  )
  attachments:
    InstitutionalCorrespondenceAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* =========================================================
   ADJUNTOS DE CORRESPONDENCIA INSTITUCIONAL
========================================================= */

@Entity(
  'institutional_correspondence_attachments',
)
export class InstitutionalCorrespondenceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  storedName: string;

  @Column()
  mimeType: string;

  @Column({
    type: 'bigint',
  })
  size: number;

  @ManyToOne(
    () => InstitutionalCorrespondence,
    (correspondence) =>
      correspondence.attachments,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'correspondence_id',
  })
  correspondence:
    InstitutionalCorrespondence;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'uploaded_by_id',
  })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}

/* =========================================================
   CARPETAS INSTITUCIONALES
   Estructura jerárquica del Archivo Institucional.
========================================================= */

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  code: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column({
    default: 0,
  })
  sortOrder: number;

  @ManyToOne(
    () => Folder,
    (folder) => folder.children,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'parent_id',
  })
  parent: Folder | null;

  @OneToMany(
    () => Folder,
    (folder) => folder.parent,
  )
  children: Folder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



/* =========================================================
   REPOSITORIO DOCUMENTAL
========================================================= */

@Entity('repository_documents')
export class RepositoryDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    default: 'Otro',
  })
  type: string;

  @Column({
    default: 'Otros',
  })
  category: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column({
    nullable: true,
  })
  version: string;

  @Column({
    default: ContentStatus.ACTIVO,
  })
  status: string;

  @Column({
    nullable: true,
  })
  originalName: string;

  @Column({
    nullable: true,
  })
  storedName: string;

  @Column({
    nullable: true,
  })
  mimeType: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  size: number;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  responsible: User;

  /*
   * Carpeta institucional a la que pertenece el documento.
   */
  @ManyToOne(() => Folder, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'folder_id',
  })
  folder: Folder | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* =========================================================
   PROCEDIMIENTOS
========================================================= */

@Entity('procedures')
export class Procedure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  code: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    default: 'Administrativo',
  })
  category: string;

  @Column({
    default: 'ACTIVO',
  })
  status: string;

  @Column()
  responsibleArea: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  validFrom: Date;

  @Column({
    type: 'date',
    nullable: true,
  })
  validUntil: Date;

  @Column('text', {
    nullable: true,
  })
  normative: string;

  @Column('simple-array', {
    nullable: true,
  })
  requirements: string[];

  @OneToMany(
    () => ProcedureStep,
    (step) => step.procedure,
    {
      cascade: true,
      eager: true,
    },
  )
  steps: ProcedureStep[];

  @Column('simple-json', {
    nullable: true,
  })
  links: {
    label: string;
    url: string;
  }[];

  @Column('simple-json', {
    nullable: true,
  })
  relatedForms: {
    label: string;
    formId?: string;
    url?: string;
  }[];

  @Column('simple-json', {
    nullable: true,
  })
  relatedDocuments: {
    label: string;
    documentId?: string;
  }[];

  /*
   * Carpeta institucional a la que pertenece el procedimiento.
   */
  @ManyToOne(() => Folder, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'folder_id',
  })
  folder: Folder | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('procedure_steps')
export class ProcedureStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stepOrder: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @ManyToOne(
    () => Procedure,
    (procedure) =>
      procedure.steps,
    {
      onDelete: 'CASCADE',
    },
  )
  procedure: Procedure;
}

/* =========================================================
   FORMULARIOS
========================================================= */

@Entity('forms')
export class InstitutionalForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column()
  category: string;

  @Column()
  format: string;

  @Column({
    nullable: true,
  })
  originalName: string;

  @Column({
    nullable: true,
  })
  storedName: string;

  @Column({
    nullable: true,
  })
  mimeType: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  size: number;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  createdBy: User;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  updatedBy: User;

  @Column({
    default: 0,
  })
  downloads: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* =========================================================
   ENLACES
========================================================= */

@Entity('external_links')
export class ExternalLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column({
    default: 'Institucional',
  })
  category: string;

  @Column({
    default: true,
  })
  active: boolean;
}

/* =========================================================
   NOTICIAS
========================================================= */

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  summary: string;

  @Column('text', {
    nullable: true,
  })
  content: string;

  @Column({
    default: 'Eventos',
  })
  category: string;

  @Column({
    type: 'enum',
    enum: NewsPriority,
    default: NewsPriority.MEDIA,
  })
  priority: NewsPriority;

  @Column({
    default: 'GENERAL',
  })
  targetArea: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  imageUrl: string;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  author: User;

  @Column({
    default: true,
  })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* =========================================================
   AUDITORÍA
========================================================= */

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  user: User;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({
    nullable: true,
  })
  entityId: string;

  @Column('text', {
    nullable: true,
  })
  detail: string;

  @CreateDateColumn()
  createdAt: Date;
}