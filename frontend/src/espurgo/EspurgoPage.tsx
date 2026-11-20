import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Badge,
  Card,
  Empty,
} from '../components';

import {
  useAuth,
} from '../auth';

import {
  api,
} from '../api';

import {
  ROLES,
} from '../roles';

/* =========================================================
   TIPOS
========================================================= */

type EspurgoStatus =
  | 'SOLICITADA'
  | 'PENDIENTE_DIRECCION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'ACTA_REGISTRADA';

type UserSummary = {
  id: string;
  name: string;
  email: string;
};

type RepositoryDocument = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  status?: string;
  originalName?: string | null;
};

type EspurgoRequest = {
  id: string;

  unitName: string;

  justification: string;

  status: EspurgoStatus;

  documents: RepositoryDocument[];

  requestedBy?: UserSummary | null;

  cisetReviewedBy?: UserSummary | null;

  cisetReviewedAt?: string | null;

  cisetNotes?: string | null;

  directorName?: string | null;

  directorDecisionBy?: UserSummary | null;

  directorDecisionAt?: string | null;

  directorNotes?: string | null;

  actOriginalName?: string | null;

  actStoredName?: string | null;

  actMimeType?: string | null;

  actSize?: number | null;

  actUploadedBy?: UserSummary | null;

  actUploadedAt?: string | null;

  createdAt: string;

  updatedAt: string;
};

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(
  value?: string | null,
) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    'es-CR',
  );
}

function errorMessage(
  error: any,
  fallback: string,
) {
  return (
    error?.response?.data
      ?.message ||
    fallback
  );
}

function StatusBadge({
  status,
}: {
  status: EspurgoStatus;
}) {
  switch (status) {
    case 'SOLICITADA':
      return (
        <Badge tone="blue">
          Solicitada
        </Badge>
      );

    case 'PENDIENTE_DIRECCION':
      return (
        <Badge tone="yellow">
          Pendiente de Dirección
        </Badge>
      );

    case 'APROBADA':
      return (
        <Badge tone="green">
          Aprobada
        </Badge>
      );

    case 'ACTA_REGISTRADA':
      return (
        <Badge tone="green">
          Acta registrada
        </Badge>
      );

    case 'RECHAZADA':
      return (
        <Badge tone="red">
          Rechazada
        </Badge>
      );

    default:
      return (
        <Badge>
          {status}
        </Badge>
      );
  }
}

/* =========================================================
   PÁGINA
========================================================= */

export default function EspurgoPage() {
  const {
    user,
  } = useAuth();

  const isAdmin =
    user?.roles?.includes(
      ROLES.ADMIN,
    );

  const canManage =
    user?.roles?.some(
      (role: string) =>
        role ===
          ROLES.ADMIN ||
        role ===
          ROLES.EDITOR,
    );

  const [
    requests,
    setRequests,
  ] =
    useState<
      EspurgoRequest[]
    >([]);

  const [
    documents,
    setDocuments,
  ] =
    useState<
      RepositoryDocument[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState('');

  const [
    actionError,
    setActionError,
  ] =
    useState('');

  const [
    notice,
    setNotice,
  ] =
    useState('');

  const [
    showCreateForm,
    setShowCreateForm,
  ] =
    useState(false);

  const [
    selected,
    setSelected,
  ] =
    useState<
      EspurgoRequest | null
    >(null);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  /* =======================================================
     FORMULARIO DE CREACIÓN
  ======================================================= */

  const [
    unitName,
    setUnitName,
  ] =
    useState('');

  const [
    justification,
    setJustification,
  ] =
    useState('');

  const [
    selectedDocumentIds,
    setSelectedDocumentIds,
  ] =
    useState<string[]>(
      [],
    );

  /* =======================================================
     CISET
  ======================================================= */

  const [
    cisetNotes,
    setCisetNotes,
  ] =
    useState('');

  /* =======================================================
     DIRECCIÓN
  ======================================================= */

  const [
    directorName,
    setDirectorName,
  ] =
    useState('');

  const [
    directorNotes,
    setDirectorNotes,
  ] =
    useState('');

  /* =======================================================
     ACTA
  ======================================================= */

  const [
    actFile,
    setActFile,
  ] =
    useState<File | null>(
      null,
    );

  /* =======================================================
     CARGA
  ======================================================= */

  const load = async () => {
    try {
      setLoading(true);

      setLoadError('');

      const [
        espurgoResponse,
        repositoryResponse,
      ] =
        await Promise.all([
          api.get(
            '/espurgo',
          ),

          api.get(
            '/repository',
          ),
        ]);

      setRequests(
        espurgoResponse.data,
      );

      setDocuments(
        repositoryResponse.data,
      );
    } catch (error) {
      console.error(
        'Error cargando espurgo:',
        error,
      );

      setLoadError(
        errorMessage(
          error,
          'No se pudo cargar la información de espurgo.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /* =======================================================
     DOCUMENTOS DISPONIBLES

     Evita mostrar documentos que ya están asociados
     a solicitudes activas.
  ======================================================= */

  const unavailableIds =
    useMemo(
      () =>
        new Set(
          requests
            .filter(
              (request) =>
                request.status !==
                  'RECHAZADA' &&
                request.status !==
                  'ACTA_REGISTRADA',
            )
            .flatMap(
              (request) =>
                request.documents.map(
                  (document) =>
                    document.id,
                ),
            ),
        ),
      [requests],
    );

  const availableDocuments =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            !unavailableIds.has(
              document.id,
            ),
        ),
      [
        documents,
        unavailableIds,
      ],
    );

  /* =======================================================
     CREAR SOLICITUD
  ======================================================= */

  const createRequest =
    async (
      event:
        React.FormEvent,
    ) => {
      event.preventDefault();

      try {
        setBusy(true);

        setActionError('');

        setNotice('');

        const {
          data,
        } =
          await api.post(
            '/espurgo',
            {
              unitName:
                unitName.trim(),

              justification:
                justification.trim(),

              documentIds:
                selectedDocumentIds,
            },
          );

        setRequests(
          (current) => [
            data,
            ...current,
          ],
        );

        setUnitName('');

        setJustification(
          '',
        );

        setSelectedDocumentIds(
          [],
        );

        setShowCreateForm(
          false,
        );

        setSelected(
          data,
        );

        setNotice(
          'La solicitud de espurgo se creó correctamente.',
        );
      } catch (error) {
        console.error(
          'Error creando solicitud de espurgo:',
          error,
        );

        setActionError(
          errorMessage(
            error,
            'No se pudo crear la solicitud de espurgo.',
          ),
        );
      } finally {
        setBusy(false);
      }
    };

  /* =======================================================
     ACTUALIZAR SOLICITUD EN MEMORIA
  ======================================================= */

  const replaceRequest = (
    updated:
      EspurgoRequest,
  ) => {
    setRequests(
      (current) =>
        current.map(
          (request) =>
            request.id ===
            updated.id
              ? updated
              : request,
        ),
    );

    setSelected(
      updated,
    );
  };

  /* =======================================================
     CISET
  ======================================================= */

  const cisetDecision =
    async (
      approved: boolean,
    ) => {
      if (!selected) {
        return;
      }

      try {
        setBusy(true);

        setActionError('');

        setNotice('');

        const {
          data,
        } =
          await api.patch(
            `/espurgo/${selected.id}/ciset-review`,
            {
              approved,

              notes:
                cisetNotes.trim(),
            },
          );

        replaceRequest(
          data,
        );

        setCisetNotes(
          '',
        );

        setNotice(
          approved
            ? 'CISET aprobó continuar con la solicitud.'
            : 'CISET rechazó la solicitud.',
        );
      } catch (error) {
        console.error(
          'Error registrando revisión CISET:',
          error,
        );

        setActionError(
          errorMessage(
            error,
            'No se pudo registrar la revisión del CISET.',
          ),
        );
      } finally {
        setBusy(false);
      }
    };

  /* =======================================================
     DIRECCIÓN
  ======================================================= */

  const directorDecision =
    async (
      approved: boolean,
    ) => {
      if (!selected) {
        return;
      }

      try {
        setBusy(true);

        setActionError('');

        setNotice('');

        const {
          data,
        } =
          await api.patch(
            `/espurgo/${selected.id}/director-decision`,
            {
              approved,

              directorName:
                directorName.trim(),

              notes:
                directorNotes.trim(),
            },
          );

        replaceRequest(
          data,
        );

        setDirectorNotes(
          '',
        );

        setNotice(
          approved
            ? 'Dirección aprobó el proceso de espurgo.'
            : 'Dirección rechazó el proceso de espurgo.',
        );
      } catch (error) {
        console.error(
          'Error registrando decisión de Dirección:',
          error,
        );

        setActionError(
          errorMessage(
            error,
            'No se pudo registrar la decisión de Dirección.',
          ),
        );
      } finally {
        setBusy(false);
      }
    };

  /* =======================================================
     ACTA
  ======================================================= */

  const uploadAct =
    async (
      event:
        React.FormEvent,
    ) => {
      event.preventDefault();

      if (
        !selected ||
        !actFile
      ) {
        setActionError(
          'Debe seleccionar un archivo para el acta.',
        );

        return;
      }

      try {
        setBusy(true);

        setActionError('');

        setNotice('');

        const formData =
          new FormData();

        formData.append(
          'file',
          actFile,
        );

        const {
          data,
        } =
          await api.post(
            `/espurgo/${selected.id}/act`,
            formData,
          );

        replaceRequest(
          data,
        );

        setActFile(
          null,
        );

        setNotice(
          'El acta se registró correctamente.',
        );
      } catch (error) {
        console.error(
          'Error registrando acta:',
          error,
        );

        setActionError(
          errorMessage(
            error,
            'No se pudo registrar el acta.',
          ),
        );
      } finally {
        setBusy(false);
      }
    };

  /* =======================================================
     DESCARGA DEL ACTA
  ======================================================= */

  const downloadAct =
    async () => {
      if (!selected) {
        return;
      }

      try {
        setActionError('');

        const response =
          await api.get(
            `/espurgo/${selected.id}/act/download`,
            {
              responseType:
                'blob',
            },
          );

        const url =
          window.URL.createObjectURL(
            response.data,
          );

        const link =
          document.createElement(
            'a',
          );

        link.href =
          url;

        link.download =
          selected
            .actOriginalName ||
          'acta-espurgo';

        document.body.appendChild(
          link,
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url,
        );
      } catch (error) {
        console.error(
          'Error descargando acta:',
          error,
        );

        setActionError(
          errorMessage(
            error,
            'No se pudo descargar el acta.',
          ),
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>
            Espurgo documental
          </h1>

          <p>
            Control del proceso de eliminación documental mediante revisión del CISET, aprobación de Dirección y registro del acta formal.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn"
            onClick={() =>
              setShowCreateForm(
                !showCreateForm,
              )
            }
          >
            {showCreateForm
              ? 'Cerrar formulario'
              : '+ Nueva solicitud'}
          </button>
        )}
      </div>

      {notice && (
        <div
          className="user-management-message"
          role="status"
        >
          {notice}
        </div>
      )}

      {actionError && (
        <div
          className="links-error"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {/* =================================================
          CREAR SOLICITUD
      ================================================= */}

      {canManage &&
        showCreateForm && (
          <Card>
            <h2>
              Nueva solicitud de espurgo
            </h2>

            <form
              className="form"
              onSubmit={
                createRequest
              }
            >
              <label>
                Unidad o escuela
                <input
                  required
                  maxLength={
                    200
                  }
                  value={
                    unitName
                  }
                  onChange={(
                    event,
                  ) =>
                    setUnitName(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Ej. Escuela de Computación"
                />
              </label>

              <label className="full">
                Justificación
                <textarea
                  required
                  maxLength={
                    3000
                  }
                  value={
                    justification
                  }
                  onChange={(
                    event,
                  ) =>
                    setJustification(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Indique el motivo por el que los documentos se someten al proceso de espurgo."
                />
              </label>

              <div className="full">
                <strong>
                  Documentos del repositorio
                </strong>

                {!availableDocuments.length ? (
                  <Empty text="No hay documentos disponibles para una nueva solicitud." />
                ) : (
                  <div
                    style={{
                      marginTop:
                        '12px',
                      display:
                        'grid',
                      gap:
                        '8px',
                    }}
                  >
                    {availableDocuments.map(
                      (
                        document,
                      ) => (
                        <label
                          key={
                            document.id
                          }
                          style={{
                            display:
                              'flex',
                            gap:
                              '10px',
                            alignItems:
                              'center',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(
                              document.id,
                            )}
                            onChange={(
                              event,
                            ) => {
                              if (
                                event
                                  .target
                                  .checked
                              ) {
                                setSelectedDocumentIds(
                                  (
                                    current,
                                  ) => [
                                    ...current,
                                    document.id,
                                  ],
                                );
                              } else {
                                setSelectedDocumentIds(
                                  (
                                    current,
                                  ) =>
                                    current.filter(
                                      (
                                        id,
                                      ) =>
                                        id !==
                                        document.id,
                                    ),
                                );
                              }
                            }}
                          />

                          <span>
                            <strong>
                              {
                                document.name
                              }
                            </strong>

                            {' — '}

                            {document.originalName ||
                              'Sin archivo asociado'}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="full repository-form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    setShowCreateForm(
                      false,
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn"
                  disabled={
                    busy ||
                    !selectedDocumentIds.length
                  }
                >
                  {busy
                    ? 'Guardando...'
                    : 'Crear solicitud'}
                </button>
              </div>
            </form>
          </Card>
        )}

      {/* =================================================
          LISTADO
      ================================================= */}

      {loading ? (
        <Card>
          <Empty text="Cargando solicitudes de espurgo..." />
        </Card>
      ) : loadError ? (
        <div
          className="links-error"
          role="alert"
        >
          {loadError}

          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              void load()
            }
          >
            Reintentar
          </button>
        </div>
      ) : !requests.length ? (
        <Card>
          <Empty text="No hay solicitudes de espurgo registradas." />
        </Card>
      ) : (
        <Card>
          <h2>
            Solicitudes
          </h2>

          <table>
            <thead>
              <tr>
                <th>
                  Unidad
                </th>

                <th>
                  Documentos
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Creada
                </th>

                <th>
                  Solicitante
                </th>

                <th />
              </tr>
            </thead>

            <tbody>
              {requests.map(
                (
                  request,
                ) => (
                  <tr
                    key={
                      request.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          request.unitName
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        request
                          .documents
                          .length
                      }
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          request.status
                        }
                      />
                    </td>

                    <td>
                      {formatDateTime(
                        request.createdAt,
                      )}
                    </td>

                    <td>
                      {request
                        .requestedBy
                        ?.name ||
                        '-'}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setSelected(
                            request,
                          );

                          setActionError(
                            '',
                          );

                          setNotice(
                            '',
                          );

                          setCisetNotes(
                            '',
                          );

                          setDirectorName(
                            request.directorName ||
                              '',
                          );

                          setDirectorNotes(
                            '',
                          );
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* =================================================
          DETALLE
      ================================================= */}

      {selected && (
        <>
          <Card>
            <div className="titlebar">
              <div>
                <h2>
                  Detalle de solicitud
                </h2>

                <p>
                  <StatusBadge
                    status={
                      selected.status
                    }
                  />
                </p>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setSelected(
                    null,
                  )
                }
              >
                Cerrar detalle
              </button>
            </div>

            <p>
              <strong>
                Unidad:
              </strong>{' '}
              {
                selected.unitName
              }
            </p>

            <p>
              <strong>
                Justificación:
              </strong>{' '}
              {
                selected.justification
              }
            </p>

            <p>
              <strong>
                Solicitada por:
              </strong>{' '}
              {selected
                .requestedBy
                ?.name ||
                '-'}
            </p>

            <p>
              <strong>
                Fecha:
              </strong>{' '}
              {formatDateTime(
                selected.createdAt,
              )}
            </p>

            <h3>
              Documentos asociados
            </h3>

            <table>
              <thead>
                <tr>
                  <th>
                    Nombre
                  </th>

                  <th>
                    Archivo
                  </th>

                  <th>
                    Estado actual
                  </th>
                </tr>
              </thead>

              <tbody>
                {selected.documents.map(
                  (
                    document,
                  ) => (
                    <tr
                      key={
                        document.id
                      }
                    >
                      <td>
                        {
                          document.name
                        }
                      </td>

                      <td>
                        {document.originalName ||
                          '-'}
                      </td>

                      <td>
                        {
                          document.status ||
                          '-'
                        }
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </Card>

          {/* ===============================================
              CISET
          =============================================== */}

          {selected.status ===
            'SOLICITADA' &&
            canManage && (
              <Card>
                <h2>
                  Revisión CISET
                </h2>

                <label>
                  Observaciones
                  <textarea
                    value={
                      cisetNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setCisetNotes(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Observaciones de la revisión..."
                  />
                </label>

                <div className="repository-form-actions">
                  <button
                    type="button"
                    className="btn danger"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void cisetDecision(
                        false,
                      )
                    }
                  >
                    Rechazar
                  </button>

                  <button
                    type="button"
                    className="btn"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void cisetDecision(
                        true,
                      )
                    }
                  >
                    Aprobar CISET
                  </button>
                </div>
              </Card>
            )}

          {/* ===============================================
              INFORMACIÓN CISET YA REGISTRADA
          =============================================== */}

          {selected
            .cisetReviewedAt && (
            <Card>
              <h2>
                Revisión CISET
              </h2>

              <p>
                <strong>
                  Revisado por:
                </strong>{' '}
                {selected
                  .cisetReviewedBy
                  ?.name ||
                  '-'}
              </p>

              <p>
                <strong>
                  Fecha:
                </strong>{' '}
                {formatDateTime(
                  selected.cisetReviewedAt,
                )}
              </p>

              <p>
                <strong>
                  Observaciones:
                </strong>{' '}
                {selected.cisetNotes ||
                  '-'}
              </p>
            </Card>
          )}

          {/* ===============================================
              DIRECCIÓN
          =============================================== */}

          {selected.status ===
            'PENDIENTE_DIRECCION' &&
            isAdmin && (
              <Card>
                <h2>
                  Decisión de Dirección
                </h2>

                <form className="form">
                  <label>
                    Director(a)
                    <input
                      required
                      maxLength={
                        200
                      }
                      value={
                        directorName
                      }
                      onChange={(
                        event,
                      ) =>
                        setDirectorName(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Nombre de la persona directora"
                    />
                  </label>

                  <label className="full">
                    Observaciones
                    <textarea
                      value={
                        directorNotes
                      }
                      onChange={(
                        event,
                      ) =>
                        setDirectorNotes(
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </label>

                  <div className="full repository-form-actions">
                    <button
                      type="button"
                      className="btn danger"
                      disabled={
                        busy ||
                        !directorName.trim()
                      }
                      onClick={() =>
                        void directorDecision(
                          false,
                        )
                      }
                    >
                      Rechazar
                    </button>

                    <button
                      type="button"
                      className="btn"
                      disabled={
                        busy ||
                        !directorName.trim()
                      }
                      onClick={() =>
                        void directorDecision(
                          true,
                        )
                      }
                    >
                      Aprobar Dirección
                    </button>
                  </div>
                </form>
              </Card>
            )}

          {/* ===============================================
              INFORMACIÓN DIRECCIÓN
          =============================================== */}

          {selected
            .directorDecisionAt && (
            <Card>
              <h2>
                Decisión de Dirección
              </h2>

              <p>
                <strong>
                  Director(a):
                </strong>{' '}
                {selected.directorName ||
                  '-'}
              </p>

              <p>
                <strong>
                  Registrada por:
                </strong>{' '}
                {selected
                  .directorDecisionBy
                  ?.name ||
                  '-'}
              </p>

              <p>
                <strong>
                  Fecha:
                </strong>{' '}
                {formatDateTime(
                  selected.directorDecisionAt,
                )}
              </p>

              <p>
                <strong>
                  Observaciones:
                </strong>{' '}
                {selected.directorNotes ||
                  '-'}
              </p>
            </Card>
          )}

          {/* ===============================================
              ACTA
          =============================================== */}

          {selected.status ===
            'APROBADA' &&
            isAdmin && (
              <Card>
                <h2>
                  Registrar acta firmada
                </h2>

                <p>
                  La solicitud fue aprobada por Dirección. Para cerrar el control documental del proceso debe registrarse el acta formal firmada.
                </p>

                <form
                  onSubmit={
                    uploadAct
                  }
                >
                  <label>
                    Acta
                    <input
                      type="file"
                      required
                      onChange={(
                        event,
                      ) =>
                        setActFile(
                          event
                            .target
                            .files?.[0] ||
                            null,
                        )
                      }
                    />
                  </label>

                  <div className="repository-form-actions">
                    <button
                      type="submit"
                      className="btn"
                      disabled={
                        busy ||
                        !actFile
                      }
                    >
                      {busy
                        ? 'Subiendo...'
                        : 'Registrar acta'}
                    </button>
                  </div>
                </form>
              </Card>
            )}

          {/* ===============================================
              ACTA REGISTRADA
          =============================================== */}

          {selected
            .actOriginalName && (
            <Card>
              <h2>
                Acta formal
              </h2>

              <p>
                <strong>
                  Archivo:
                </strong>{' '}
                {
                  selected.actOriginalName
                }
              </p>

              <p>
                <strong>
                  Registrada por:
                </strong>{' '}
                {selected
                  .actUploadedBy
                  ?.name ||
                  '-'}
              </p>

              <p>
                <strong>
                  Fecha:
                </strong>{' '}
                {formatDateTime(
                  selected.actUploadedAt,
                )}
              </p>

              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  void downloadAct()
                }
              >
                Descargar acta
              </button>
            </Card>
          )}

          {selected.status ===
            'ACTA_REGISTRADA' && (
            <Card>
              <h2>
                Proceso documentado
              </h2>

              <p>
                La solicitud cuenta con revisión del CISET, aprobación de Dirección y acta formal registrada.
              </p>

              <p>
                <strong>
                  Importante:
                </strong>{' '}
                este módulo registra y controla la autorización del espurgo. No elimina automáticamente los archivos del repositorio.
              </p>
            </Card>
          )}

          {selected.status ===
            'RECHAZADA' && (
            <Card>
              <h2>
                Solicitud rechazada
              </h2>

              <p>
                El proceso terminó sin autorización de eliminación documental.
              </p>
            </Card>
          )}
        </>
      )}
    </>
  );
}