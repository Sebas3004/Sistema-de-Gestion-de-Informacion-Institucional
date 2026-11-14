import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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

export enum NewsAudience {
  GENERAL = 'GENERAL',
  ESTUDIANTES = 'ESTUDIANTES',
  PROFESORES = 'PROFESORES',
  FUNCIONARIOS = 'FUNCIONARIOS',
}

/*
 * Correspondencia institucional real.
 */
export enum InstitutionalCorrespondenceDirection {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

/*
 * Expedientes: un expediente CERRADO es inmutable.
 */
export enum ExpedienteStatus {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
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

  /*
   * Público institucional al que pertenece el usuario.
   * Se utiliza para focalizar noticias y alertas.
   */
  @Column({
    type: 'enum',
    enum: NewsAudience,
    default: NewsAudience.GENERAL,
  })
  audienceType: NewsAudience;

  /*
   * Permite al usuario decidir si desea recibir
   * notificaciones de noticias por correo electrónico.
   */
  @Column({
    default: true,
  })
  receiveNewsEmails: boolean;

  /*
   * Prioridad mínima que debe tener una noticia
   * para generar una alerta por correo a este usuario.
   */
  @Column({
    type: 'enum',
    enum: NewsPriority,
    default: NewsPriority.MEDIA,
  })
  minimumNewsPriority: NewsPriority;

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

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, unique: true, nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ length: 30, default: 'Default' })
  color: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Folder, (folder) => folder.children, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Folder;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children: Folder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



/* =========================================================
   EXPEDIENTES
   Agrupan documentos del repositorio con foliado
   consecutivo. Se declara antes de RepositoryDocument
   porque emitDecoratorMetadata referencia la clase.
========================================================= */

@Entity('expedientes')
export class Expediente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*
   * Generado por el sistema: EXP-AAAA-NNNNN.
   */
  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Folder, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder | null;

  @Column({
    type: 'enum',
    enum: ExpedienteStatus,
    default: ExpedienteStatus.ABIERTO,
  })
  status: ExpedienteStatus;

  /*
   * Las relaciones NO son eager: el foliado bloquea la fila
   * con SELECT ... FOR UPDATE y PostgreSQL no lo permite
   * sobre el lado nullable de un LEFT JOIN.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy: User | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'close_reason', type: 'text', nullable: true })
  closeReason: string | null;

  /*
   * Próximo folio a asignar. Solo se incrementa dentro de
   * una transacción con bloqueo sobre el expediente.
   */
  @Column({ name: 'next_folio', type: 'int', default: 1 })
  nextFolio: number;

  @OneToMany(
    () => RepositoryDocument,
    (document) => document.expediente,
  )
  documents: RepositoryDocument[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* =========================================================
   REPOSITORIO DOCUMENTAL
========================================================= */

@Entity('repository_documents')
@Index(
  'UQ_repository_documents_expediente_folio',
  ['expediente', 'folio'],
  { unique: true },
)
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

  /*
   * Expediente al que pertenece (como máximo uno) y su
   * folio dentro de él. Solo los asigna ExpedientesService.
   */
  @ManyToOne(
    () => Expediente,
    (expediente) => expediente.documents,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'expediente_id',
  })
  expediente: Expediente | null;

  @Column({
    name: 'folio',
    type: 'int',
    nullable: true,
  })
  folio: number | null;

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

/*
 * INTERNO: sistemas institucionales propios.
 * EXTERNO: recursos de consulta legal/bibliográfica.
 */
export enum LinkType {
  INTERNO = 'INTERNO',
  EXTERNO = 'EXTERNO',
}

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
    type: 'enum',
    enum: LinkType,
    default: LinkType.EXTERNO,
  })
  type: LinkType;

  /*
   * El enlace solo funciona desde la red TEC o por VPN.
   * Hoy solo se informa en la interfaz; no se detecta
   * la IP del cliente.
   */
  @Column({
    name: 'requires_institutional_network',
    default: false,
  })
  requiresInstitutionalNetwork: boolean;

  @Column({
    name: 'sort_order',
    default: 0,
  })
  sortOrder: number;

  @Column({
    default: true,
  })
  active: boolean;

  /*
   * Público institucional al que pertenece el usuario.
   * Se utiliza para focalizar noticias y alertas.
   */
  @Column({
    type: 'enum',
    enum: NewsAudience,
    default: NewsAudience.GENERAL,
  })
  audienceType: NewsAudience;

  /*
   * Permite al usuario decidir si desea recibir
   * notificaciones de noticias por correo electrónico.
   */
  @Column({
    default: true,
  })
  receiveNewsEmails: boolean;

  /*
   * Prioridad mínima que debe tener una noticia
   * para generar una alerta por correo a este usuario.
   */
  @Column({
    type: 'enum',
    enum: NewsPriority,
    default: NewsPriority.MEDIA,
  })
  minimumNewsPriority: NewsPriority;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'created_by_id',
  })
  createdBy: User;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'updated_by_id',
  })
  updatedBy: User;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
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
    type: 'enum',
    enum: NewsAudience,
    default: NewsAudience.GENERAL,
  })
  targetArea: NewsAudience;

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

