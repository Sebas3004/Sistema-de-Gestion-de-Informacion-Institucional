import React, { useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Badge, Card, Empty } from '../components';

import { useAuth } from '../auth';

import { FolderSelect, useFolderTree } from '../folders';

import { canCloseExpediente, canManageExpedientes } from '../permissions';

import {
  blobErrorMessage,
  Expediente,
  ExpedienteDetail,
  ExpedienteDocument,
  ExpedienteInput,
  ExpedienteStatus,
  expedienteErrorMessage,
  expedientesApi,
  formatDateTime,
  shortHash,
  VerifyResult,
} from './expedientesApi';

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STATUS_OPTIONS: { value: ExpedienteStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ABIERTO', label: 'Abiertos' },
  { value: 'CERRADO', label: 'Cerrados' },
];

const MIN_CLOSE_REASON = 10;

const EMPTY_FORM: ExpedienteInput = {
  name: '',
  description: '',
  folderId: '',
};

const countLabel = (total: number) =>
  `${total} ${total === 1 ? 'expediente' : 'expedientes'}`;

function StatusBadge({ status }: { status: ExpedienteStatus }) {
  return status === 'CERRADO' ? (
    <Badge tone="red">Cerrado</Badge>
  ) : (
    <Badge tone="green">Abierto</Badge>
  );
}

/* =========================================================
   PÁGINA DE EXPEDIENTES
   /expedientes      → listado
   /expedientes/:id  → detalle
========================================================= */

export function ExpedientesPage() {
  const { id } = useParams();

  return id ? <ExpedienteDetailView id={id} /> : <ExpedientesList />;
}

/* =========================================================
   FORMULARIO CREAR / EDITAR
========================================================= */

function ExpedienteForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing: Expediente | null;
  onSaved: (saved: ExpedienteDetail) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<ExpedienteInput>(
    editing
      ? {
          name: editing.name,
          description: editing.description || '',
          folderId: editing.folder?.id || '',
        }
      : EMPTY_FORM,
  );
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError('');

      /*
       * Solo los campos de los DTOs: el backend usa
       * forbidNonWhitelisted. folderId "" = sin carpeta.
       */
      const payload: ExpedienteInput = {
        name: f.name.trim(),
        description: (f.description || '').trim(),
        folderId: f.folderId || null,
      };

      const saved = editing
        ? await expedientesApi.update(editing.id, payload)
        : await expedientesApi.create(payload);

      onSaved(saved);
    } catch (error) {
      console.error('Error guardando expediente:', error);

      setFormError(
        expedienteErrorMessage(error, 'No se pudo guardar el expediente.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2>
        {editing ? `Editar expediente ${editing.code}` : 'Nuevo expediente'}
      </h2>

      {!editing && (
        <p>El código (EXP-AAAA-NNNNN) se asigna automáticamente al crearlo.</p>
      )}

      <form className="form" onSubmit={save}>
        <label>
          Nombre
          <input
            required
            autoFocus
            maxLength={200}
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </label>

        <label>
          Carpeta (opcional)
          <FolderSelect
            value={f.folderId || ''}
            onChange={(value) => setF({ ...f, folderId: value })}
          />
        </label>

        <label className="full">
          Descripción
          <textarea
            maxLength={2000}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </label>

        {formError && (
          <div className="links-error full" role="alert">
            {formError}
          </div>
        )}

        <div className="full repository-form-actions">
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancelar
          </button>

          <button type="submit" className="btn" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editing
                ? 'Guardar cambios'
                : 'Crear expediente'}
          </button>
        </div>
      </form>
    </Card>
  );
}

/* =========================================================
   LISTADO
========================================================= */

function ExpedientesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { flat: folders } = useFolderTree();

  const canManage = canManageExpedientes(user);

  const [data, setData] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ExpedienteStatus | ''>('');
  const [folderId, setFolderId] = useState('');

  const [showForm, setShowForm] = useState(false);

  /*
   * Los filtros se aplican en el backend
   * (GET /expedientes?search&status&folderId).
   */
  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');

      setData(await expedientesApi.list({ search, status, folderId }));
    } catch (error) {
      console.error('Error cargando expedientes:', error);

      setLoadError(
        expedienteErrorMessage(error, 'No se pudieron cargar los expedientes.'),
      );
    } finally {
      setLoading(false);
    }
  };

  /* La búsqueda por texto espera a que el usuario deje de escribir */
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);

    return () => window.clearTimeout(timer);
  }, [search, status, folderId]);

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>Expedientes</h1>

          <p>
            Agrupación de documentos del repositorio con foliado consecutivo y
            cierre formal.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cerrar formulario' : '+ Nuevo expediente'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <ExpedienteForm
          editing={null}
          onCancel={() => setShowForm(false)}
          onSaved={(saved) => navigate(`/expedientes/${saved.id}`)}
        />
      )}

      <Card>
        <div className="repository-toolbar">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o descripción..."
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpedienteStatus | '')}
          >
            {STATUS_OPTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
            <option value="">Todas las carpetas</option>

            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {`${'— '.repeat(folder.depth)}${folder.name}`}
              </option>
            ))}
          </select>

          <span>{countLabel(data.length)}</span>
        </div>
      </Card>

      {loading && !data.length ? (
        <Card>
          <Empty text="Cargando expedientes..." />
        </Card>
      ) : loadError ? (
        <div className="links-error" role="alert">
          {loadError}

          <button type="button" className="btn secondary" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : !data.length ? (
        <Card>
          <Empty
            text={
              search.trim() || status || folderId
                ? 'No se encontraron expedientes con ese criterio.'
                : 'No hay expedientes registrados.'
            }
          />
        </Card>
      ) : (
        <Card>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Carpeta</th>
                <th>Documentos</th>
                <th>Estado</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {data.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.code}</strong>
                  </td>
                  <td>{x.name}</td>
                  <td>{x.folder?.name || '-'}</td>
                  <td>{x.documentCount ?? 0}</td>
                  <td>
                    <StatusBadge status={x.status} />
                  </td>
                  <td>{formatDateTime(x.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => navigate(`/expedientes/${x.id}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

/* =========================================================
   DETALLE
========================================================= */

type Panel = 'none' | 'edit' | 'add' | 'close';

function ExpedienteDetailView({ id }: { id: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<ExpedienteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const [panel, setPanel] = useState<Panel>('none');

  const [available, setAvailable] = useState<ExpedienteDocument[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  /* Modal de confirmación del cierre */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  /* Integridad (REQ-EXP-002.3) */
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const closed = item?.status === 'CERRADO';

  /* Si está CERRADO no se muestra ninguna acción de edición */
  const canManage = canManageExpedientes(user) && !closed;
  const canClose = canCloseExpediente(user) && !closed;

  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');

      setItem(await expedientesApi.get(id));
    } catch (error) {
      console.error('Error cargando expediente:', error);

      setLoadError(
        expedienteErrorMessage(error, 'No se pudo cargar el expediente.'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPanel('none');
    setConfirmOpen(false);
    setNotice('');
    setVerifyResult(null);
    void load();
  }, [id]);

  const openPanel = async (next: Panel) => {
    setActionError('');
    setNotice('');
    setPanel(panel === next ? 'none' : next);

    if (next === 'add' && panel !== 'add') {
      setDocumentId('');

      try {
        const docs = await expedientesApi.repositoryDocuments();

        /*
         * Un documento solo puede estar en un expediente, y
         * solo se folian documentos con archivo (el backend
         * también lo valida y comprueba que exista en disco).
         */
        setAvailable(
          docs
            .filter((d) => !d.expediente && d.originalName)
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
            ),
        );
      } catch (error) {
        setActionError(
          expedienteErrorMessage(
            error,
            'No se pudieron cargar los documentos del repositorio.',
          ),
        );
      }
    }

    if (next === 'close') {
      setReason('');
    }
  };

  const addDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setBusy(true);
      setActionError('');

      const saved = await expedientesApi.addDocument(id, documentId);
      const added = saved.documents.find((d) => d.id === documentId);

      setItem(saved);
      setPanel('none');
      setNotice(
        added
          ? `Se agregó "${added.name}" con el folio ${added.folio}.`
          : 'Documento agregado al expediente.',
      );
    } catch (error) {
      console.error('Error foliando documento:', error);

      setActionError(
        expedienteErrorMessage(error, 'No se pudo agregar el documento.'),
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * La tarjeta solo recoge el motivo; la confirmación
   * se hace en el modal (openConfirm → confirmClose).
   */
  const openConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    setConfirmError('');
    setConfirmOpen(true);
  };

  const dismissConfirm = () => {
    if (!busy) {
      setConfirmOpen(false);
    }
  };

  const confirmClose = async () => {
    try {
      setBusy(true);
      setConfirmError('');

      const saved = await expedientesApi.close(id, reason.trim());

      setItem(saved);
      setConfirmOpen(false);
      setPanel('none');
      setActionError('');
      setVerifyResult(null);
      setNotice(
        `El expediente ${saved.code} se cerró y selló correctamente.`,
      );
    } catch (error) {
      console.error('Error cerrando expediente:', error);

      /* El error se muestra dentro del modal, que sigue abierto */
      setConfirmError(
        expedienteErrorMessage(error, 'No se pudo cerrar el expediente.'),
      );
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     INTEGRIDAD (REQ-EXP-002.3)
  ======================================================= */

  const runVerify = async () => {
    try {
      setVerifying(true);
      setActionError('');
      setNotice('');

      setVerifyResult(await expedientesApi.verify(id));
    } catch (error) {
      console.error('Error verificando expediente:', error);

      setVerifyResult(null);
      setActionError(
        expedienteErrorMessage(error, 'No se pudo verificar la integridad.'),
      );
    } finally {
      setVerifying(false);
    }
  };

  const copySeal = async () => {
    if (!item?.sealHash) {
      return;
    }

    try {
      await navigator.clipboard.writeText(item.sealHash);

      setActionError('');
      setNotice('Sello copiado al portapapeles.');
    } catch {
      setNotice('');
      setActionError(
        'No se pudo copiar el sello. Selecciónelo y cópielo manualmente.',
      );
    }
  };

  const downloadManifest = async () => {
    if (!item) {
      return;
    }

    try {
      setDownloading(true);
      setActionError('');

      await expedientesApi.downloadManifest(
        id,
        `${item.code}-manifiesto.json`,
      );

      setNotice(
        `Manifiesto descargado. Su SHA-256 debe coincidir con el sello del expediente.`,
      );
    } catch (error) {
      console.error('Error descargando manifiesto:', error);

      setNotice('');
      setActionError(
        await blobErrorMessage(error, 'No se pudo descargar el manifiesto.'),
      );
    } finally {
      setDownloading(false);
    }
  };

  /* Escape cierra el modal, salvo mientras se envía */
  useEffect(() => {
    if (!confirmOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, busy]);

  const documents = useMemo(() => item?.documents ?? [], [item]);

  if (loading && !item) {
    return (
      <Card>
        <Empty text="Cargando expediente..." />
      </Card>
    );
  }

  if (loadError || !item) {
    return (
      <>
        <div className="links-error" role="alert">
          {loadError || 'Expediente no encontrado.'}

          <button type="button" className="btn secondary" onClick={load}>
            Reintentar
          </button>
        </div>

        <button
          type="button"
          className="btn secondary"
          onClick={() => navigate('/expedientes')}
        >
          Volver a expedientes
        </button>
      </>
    );
  }

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>
            {item.code} · {item.name}
          </h1>

          <p>
            <StatusBadge status={item.status} />{' '}
            {closed &&
              `Cerrado el ${formatDateTime(item.closedAt)} por ${
                item.closedBy?.name || 'usuario desconocido'
              }`}
          </p>
        </div>

        <button
          type="button"
          className="btn secondary"
          onClick={() => navigate('/expedientes')}
        >
          Volver
        </button>
      </div>

      <Card>
        <h2>Información</h2>

        <p>
          <strong>Descripción:</strong> {item.description || '-'}
        </p>
        <p>
          <strong>Carpeta:</strong> {item.folder?.name || 'Sin carpeta'}
        </p>
        <p>
          <strong>Creado:</strong> {formatDateTime(item.createdAt)} por{' '}
          {item.createdBy?.name || '-'}
        </p>
        <p>
          <strong>Documentos foliados:</strong> {documents.length}
        </p>

        {closed && (
          <p>
            <strong>Motivo del cierre:</strong> {item.closeReason || '-'}
          </p>
        )}

        {(canManage || canClose) && (
          <div className="repository-form-actions">
            {canManage && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => openPanel('edit')}
              >
                Editar
              </button>
            )}

            {canManage && (
              <button
                type="button"
                className="btn"
                onClick={() => openPanel('add')}
              >
                + Agregar documento
              </button>
            )}

            {canClose && (
              <button
                type="button"
                className="btn danger"
                onClick={() => openPanel('close')}
              >
                Cerrar expediente
              </button>
            )}
          </div>
        )}
      </Card>

      {actionError && (
        <div className="links-error" role="alert">
          {actionError}
        </div>
      )}

      {/* Mismo aviso verde que la gestión de Usuarios */}
      {notice && (
        <div className="user-management-message" role="status">
          {notice}
        </div>
      )}

      {canManage && panel === 'edit' && (
        <ExpedienteForm
          editing={item}
          onCancel={() => setPanel('none')}
          onSaved={(saved) => {
            setItem(saved);
            setPanel('none');
            setNotice('Los cambios del expediente se guardaron correctamente.');
          }}
        />
      )}

      {canManage && panel === 'add' && (
        <Card>
          <h2>Agregar documento del repositorio</h2>

          <p>
            Se le asignará el folio {item.nextFolio}. Solo se listan documentos
            con archivo adjunto que no pertenecen a ningún expediente.
          </p>

          <form className="form" onSubmit={addDocument}>
            <label className="full">
              Documento
              <select
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              >
                <option value="">Seleccione un documento</option>

                {available.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.version ? ` (v${d.version})` : ''}
                    {d.folder?.name ? ` — ${d.folder.name}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="full repository-form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setPanel('none')}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn"
                disabled={busy || !documentId}
              >
                {busy ? 'Foliando...' : 'Agregar y foliar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {canClose && panel === 'close' && (
        <Card>
          <h2>Cerrar expediente</h2>

          <p>
            El cierre es definitivo: el expediente y sus documentos quedarán
            inmutables.
          </p>

          <form className="form" onSubmit={openConfirm}>
            <label className="full">
              Motivo del cierre (mínimo {MIN_CLOSE_REASON} caracteres)
              <textarea
                required
                minLength={MIN_CLOSE_REASON}
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>

            <div className="full repository-form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setPanel('none')}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn danger"
                disabled={
                  busy ||
                  reason.trim().length < MIN_CLOSE_REASON ||
                  !documents.length
                }
              >
                Confirmar cierre
              </button>
            </div>

            {!documents.length && (
              <div className="links-error full" role="alert">
                No se puede cerrar un expediente sin documentos.
              </div>
            )}
          </form>
        </Card>
      )}

      {/*
       * Modal de confirmación del cierre. Reutiliza las clases
       * del modal de Noticias (news-overlay / news-modal /
       * news-actions). Clic afuera o Escape lo cierran,
       * salvo mientras se envía.
       */}
      {canClose && confirmOpen && (
        <div className="news-overlay" onClick={dismissConfirm}>
          <div
            className="news-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-expediente-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="close-expediente-title">
              ¿Cerrar expediente {item.code}?
            </h2>

            <p>
              Esta acción es <strong>irreversible</strong>. El expediente
              quedará cerrado con{' '}
              <strong>
                {documents.length}{' '}
                {documents.length === 1
                  ? 'documento foliado'
                  : 'documentos foliados'}
              </strong>{' '}
              y ya no se podrán editar sus datos, agregar documentos ni
              modificar los documentos que contiene.
            </p>

            <p>
              <strong>Motivo del cierre:</strong>
            </p>

            <p style={{ whiteSpace: 'pre-wrap' }}>{reason.trim()}</p>

            {confirmError && (
              <div className="links-error" role="alert">
                {confirmError}
              </div>
            )}

            <div className="news-actions">
              <button
                type="button"
                className="btn secondary"
                autoFocus
                onClick={dismissConfirm}
                disabled={busy}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn danger"
                onClick={() => void confirmClose()}
                disabled={busy}
              >
                {busy ? 'Cerrando...' : 'Cerrar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          INTEGRIDAD (solo expedientes cerrados)
      ================================================= */}
      {closed && (
        <Card>
          <h2>Integridad</h2>

          {item.sealHash ? (
            <>
              <p>
                <strong>Sello SHA-256 (v{item.sealVersion ?? 1}):</strong>{' '}
                <code title={item.sealHash}>{shortHash(item.sealHash)}</code>{' '}
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => void copySeal()}
                >
                  Copiar
                </button>
              </p>

              <p>
                <strong>Sellado:</strong> {formatDateTime(item.sealedAt)}
              </p>
            </>
          ) : (
            <p>
              Este expediente se cerró antes del sellado de integridad y no
              tiene sello.
            </p>
          )}

          <div className="repository-form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => void runVerify()}
              disabled={verifying}
            >
              {verifying ? 'Verificando...' : 'Verificar integridad'}
            </button>

            {item.sealHash && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => void downloadManifest()}
                disabled={downloading}
              >
                {downloading ? 'Descargando...' : 'Descargar manifiesto'}
              </button>
            )}
          </div>

          {verifyResult && (
            <>
              {verifyResult.integro ? (
                <div className="user-management-message" role="status">
                  Expediente íntegro: el sello es válido y los{' '}
                  {verifyResult.documentos.length} archivos coinciden con sus
                  hashes. Verificado el{' '}
                  {formatDateTime(verifyResult.verificadoEn)}.
                </div>
              ) : (
                <div className="links-error" role="alert">
                  <span>
                    Expediente NO íntegro.{' '}
                    {verifyResult.sealValido === false &&
                      'El sello no es válido. '}
                    {verifyResult.motivo}{' '}
                    {verifyResult.documentos.some((d) => !d.ok) &&
                      `Documentos con fallas: ${
                        verifyResult.documentos.filter((d) => !d.ok).length
                      } de ${verifyResult.documentos.length}.`}
                  </span>
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Documento</th>
                    <th>Hash esperado</th>
                    <th>Hash actual</th>
                    <th>Resultado</th>
                  </tr>
                </thead>

                <tbody>
                  {verifyResult.documentos.map((d) => (
                    <tr key={`${d.folio}-${d.nombre}`}>
                      <td>
                        <strong>{d.folio}</strong>
                      </td>
                      <td>{d.nombre}</td>
                      <td>
                        <code title={d.hashEsperado || ''}>
                          {shortHash(d.hashEsperado)}
                        </code>
                      </td>
                      <td>
                        <code title={d.hashActual || ''}>
                          {shortHash(d.hashActual)}
                        </code>
                      </td>
                      <td>
                        {d.ok ? (
                          <Badge tone="green">Correcto</Badge>
                        ) : (
                          <>
                            <Badge tone="red">Falla</Badge> {d.motivo}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      )}

      <Card>
        <h2>Documentos</h2>

        {!documents.length ? (
          <Empty text="Este expediente aún no tiene documentos." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Versión</th>
                <th>Carpeta</th>
                <th>Responsable</th>
                <th>Hash SHA-256</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.folio}</strong>
                  </td>
                  <td>{d.name}</td>
                  <td>{d.type || '-'}</td>
                  <td>{d.version || '-'}</td>
                  <td>{d.folder?.name || '-'}</td>
                  <td>{d.responsible?.name || '-'}</td>
                  <td>
                    <code title={d.hash || 'Sin hash registrado'}>
                      {shortHash(d.hash)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
