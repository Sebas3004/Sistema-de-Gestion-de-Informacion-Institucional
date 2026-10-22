import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ExternalLink } from 'lucide-react';

import { Badge, Card, Empty } from '../components';

import { useAuth } from '../auth';

import { canDeactivateLinks, canManageLinks } from '../permissions';

import {
  isSafeUrl,
  LinkInput,
  linkErrorMessage,
  linksApi,
  LinkType,
  QuickLink,
} from './linksApi';

/* =========================================================
   CONFIGURACIÓN DE PESTAÑAS
========================================================= */

const TABS: {
  type: LinkType;
  label: string;
}[] = [
  {
    type: 'INTERNO',
    label: 'Sistemas institucionales',
  },
  {
    type: 'EXTERNO',
    label: 'Recursos externos',
  },
];

const NETWORK_TOOLTIP =
  'Solo funciona desde la red del TEC. Fuera del campus, conéctese primero a la VPN institucional.';

const countLabel = (total: number) =>
  `${total} ${total === 1 ? 'enlace' : 'enlaces'}`;

const EMPTY_FORM: LinkInput = {
  name: '',
  url: '',
  description: '',
  category: '',
  type: 'INTERNO',
  requiresInstitutionalNetwork: false,
};

/* =========================================================
   PÁGINA DE ACCESOS RÁPIDOS
========================================================= */

export function LinksPage() {
  const { user } = useAuth();

  const canManage = canManageLinks(user);
  const canDeactivate = canDeactivateLinks(user);

  const [data, setData] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [tab, setTab] = useState<LinkType>('INTERNO');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuickLink | null>(null);
  const [f, setF] = useState<LinkInput>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  /*
   * El formulario se muestra arriba de la página; al abrirlo
   * desde una tarjeta hay que llevar la vista hasta él.
   * El contador fuerza el efecto aunque ya estuviera abierto.
   */
  const formRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [formFocusRequest, setFormFocusRequest] = useState(0);

  useEffect(() => {
    if (!formFocusRequest) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    firstFieldRef.current?.focus({ preventScroll: true });
  }, [formFocusRequest]);

  /*
   * ADMIN / EDITOR cargan también los inactivos
   * (GET /links/manage); el resto, solo activos.
   */
  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');

      setData(canManage ? await linksApi.listAll() : await linksApi.list());
    } catch (error) {
      console.error('Error cargando enlaces:', error);

      setLoadError(
        linkErrorMessage(error, 'No se pudieron cargar los accesos rápidos.'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(data.map((x) => x.category))).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' }),
      ),
    [data],
  );

  const counts = useMemo(() => {
    const visible = data.filter((x) => x.active);

    return {
      INTERNO: visible.filter((x) => x.type === 'INTERNO').length,
      EXTERNO: visible.filter((x) => x.type === 'EXTERNO').length,
    };
  }, [data]);

  /*
   * Filtra por pestaña, búsqueda e inactivos, y agrupa
   * por categoría manteniendo el orden del backend.
   */
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = data.filter((x) => {
      if (x.type !== tab) {
        return false;
      }

      if (!x.active && !(canDeactivate && showInactive)) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [x.name, x.description].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(q),
      );
    });

    const map = new Map<string, QuickLink[]>();

    for (const item of filtered) {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    }

    // Sin distinguir mayúsculas ni tildes ("Ámbito" junto a "ambiente").
    for (const items of map.values()) {
      items.sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      );
    }

    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' }),
    );
  }, [data, tab, search, showInactive, canDeactivate]);

  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);

  /* =======================================================
     FORMULARIO
  ======================================================= */

  const openCreate = () => {
    setEditing(null);
    setF({ ...EMPTY_FORM, type: tab });
    setFormError('');
    setShowForm(true);
    setFormFocusRequest((n) => n + 1);
  };

  const openEdit = (item: QuickLink) => {
    setEditing(item);
    setF({
      name: item.name,
      url: item.url,
      description: item.description || '',
      category: item.category,
      type: item.type,
      requiresInstitutionalNetwork: item.requiresInstitutionalNetwork,
    });
    setFormError('');
    setShowForm(true);
    setFormFocusRequest((n) => n + 1);
  };

  const resetForm = () => {
    setEditing(null);
    setF(EMPTY_FORM);
    setFormError('');
    setShowForm(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError('');

      /*
       * Solo los campos de CreateLinkDto/UpdateLinkDto: el
       * backend usa forbidNonWhitelisted y rechaza cualquier
       * otro (id, active, createdBy, fechas...).
       */
      const payload: LinkInput = {
        name: f.name.trim(),
        url: f.url.trim(),
        description: (f.description || '').trim(),
        category: f.category.trim(),
        type: f.type,
        requiresInstitutionalNetwork: f.requiresInstitutionalNetwork,
      };

      if (editing) {
        await linksApi.update(editing.id, payload);
      } else {
        await linksApi.create(payload);
      }

      setTab(payload.type);

      await load();

      resetForm();
    } catch (error) {
      console.error('Error guardando enlace:', error);

      setFormError(linkErrorMessage(error, 'No se pudo guardar el enlace.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: QuickLink) => {
    try {
      setActionError('');

      if (item.active) {
        await linksApi.deactivate(item.id);
      } else {
        await linksApi.restore(item.id);
      }

      await load();
    } catch (error) {
      console.error('Error cambiando estado del enlace:', error);

      setActionError(
        linkErrorMessage(error, 'No se pudo cambiar el estado del enlace.'),
      );
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>Accesos rápidos</h1>

          <p>Sistemas del TEC y fuentes de consulta legal y bibliográfica.</p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn"
            onClick={() => (showForm ? resetForm() : openCreate())}
          >
            {showForm ? 'Cerrar formulario' : '+ Nuevo enlace'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <div ref={formRef}>
        <Card>
          <h2>{editing ? `Editar enlace: ${editing.name}` : 'Nuevo enlace'}</h2>

          <form className="form" onSubmit={save}>
            <label>
              Nombre
              <input
                ref={firstFieldRef}
                required
                maxLength={180}
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </label>

            <label>
              URL
              <input
                required
                type="url"
                maxLength={2048}
                placeholder="https://"
                value={f.url}
                onChange={(e) => setF({ ...f, url: e.target.value })}
              />
            </label>

            <label>
              Tipo
              <select
                value={f.type}
                onChange={(e) =>
                  setF({ ...f, type: e.target.value as LinkType })
                }
              >
                {TABS.map((x) => (
                  <option key={x.type} value={x.type}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Categoría
              <input
                required
                maxLength={80}
                list="links-categories"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              />

              <datalist id="links-categories">
                {categories.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </label>

            <label className="links-checkbox full">
              <input
                type="checkbox"
                checked={f.requiresInstitutionalNetwork}
                onChange={(e) =>
                  setF({
                    ...f,
                    requiresInstitutionalNetwork: e.target.checked,
                  })
                }
              />
              Requiere red TEC o VPN
            </label>

            <label className="full">
              Descripción
              <textarea
                maxLength={500}
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
              <button
                type="button"
                className="btn secondary"
                onClick={resetForm}
              >
                Cancelar
              </button>

              <button type="submit" className="btn" disabled={saving}>
                {saving
                  ? 'Guardando...'
                  : editing
                    ? 'Guardar cambios'
                    : 'Crear enlace'}
              </button>
            </div>
          </form>
        </Card>
        </div>
      )}

      <div className="links-tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.type}
            type="button"
            role="tab"
            aria-selected={tab === x.type}
            className={'links-tab' + (tab === x.type ? ' active' : '')}
            onClick={() => setTab(x.type)}
          >
            {x.label}
            <span>{counts[x.type]}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="repository-toolbar">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
          />

          {canDeactivate && (
            <label className="links-checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar inactivos
            </label>
          )}

          <span>{countLabel(total)}</span>
        </div>
      </Card>

      {actionError && (
        <div className="links-error" role="alert">
          {actionError}
        </div>
      )}

      {loading ? (
        <Card>
          <Empty text="Cargando accesos rápidos..." />
        </Card>
      ) : loadError ? (
        <div className="links-error" role="alert">
          {loadError}

          <button type="button" className="btn secondary" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : !groups.length ? (
        <Card>
          <Empty
            text={
              search.trim()
                ? 'No se encontraron enlaces con ese criterio.'
                : 'No hay enlaces registrados en esta sección.'
            }
          />
        </Card>
      ) : (
        groups.map(([category, items]) => (
          <section className="links-group" key={category}>
            <h2>{category}</h2>

            <div className="links-grid">
              {items.map((x) => (
                <article
                  key={x.id}
                  className={'links-card' + (x.active ? '' : ' inactive')}
                >
                  {/* Solo el contenido se apaga en inactivos, no los botones */}
                  <div className="links-card-content">
                    <div className="links-card-tags">
                      {x.requiresInstitutionalNetwork && (
                        <span
                          className="badge amber"
                          title={NETWORK_TOOLTIP}
                          aria-label={`Requiere red TEC o VPN. ${NETWORK_TOOLTIP}`}
                        >
                          Requiere red TEC o VPN
                        </span>
                      )}

                      {!x.active && <Badge tone="red">Inactivo</Badge>}
                    </div>

                    <h3>{x.name}</h3>

                    {x.description && <p>{x.description}</p>}
                  </div>

                  {/* Mismas clases que la tabla de Usuarios: btn / btn secondary */}
                  <div className="links-card-footer">
                    {x.active ? (
                      isSafeUrl(x.url) ? (
                        <a
                          className="btn"
                          href={x.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="links-invalid">URL no válida</span>
                      )
                    ) : (
                      canDeactivate && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => toggleActive(x)}
                        >
                          Restaurar
                        </button>
                      )
                    )}

                    {canManage && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => openEdit(x)}
                      >
                        Editar
                      </button>
                    )}

                    {x.active && canDeactivate && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => toggleActive(x)}
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
