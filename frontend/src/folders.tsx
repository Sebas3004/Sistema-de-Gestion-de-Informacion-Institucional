import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSearchParams } from 'react-router-dom';

import { Folder as FolderIcon } from 'lucide-react';

import { api } from './api';

import { Card } from './components';

import { useAuth } from './auth';

/* =========================================================
   TIPOS
========================================================= */

export type FolderNode = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  parentId: string | null;
  documentCount: number;
  procedureCount: number;
  totalCount: number;
  children: FolderNode[];
};

export type FlatFolder = FolderNode & {
  depth: number;
};

/* =========================================================
   UTILIDADES
========================================================= */

function flatten(
  nodes: FolderNode[],
  depth = 0,
  out: FlatFolder[] = [],
): FlatFolder[] {
  for (const node of nodes) {
    out.push({ ...node, depth });
    flatten(node.children, depth + 1, out);
  }

  return out;
}

/* Total de ítems de la carpeta y de todas sus subcarpetas */
function countDeep(
  node: FolderNode,
  key: 'documentCount' | 'procedureCount',
): number {
  return (
    node[key] +
    node.children.reduce(
      (total, child) => total + countDeep(child, key),
      0,
    )
  );
}

/* =========================================================
   HOOK: ÁRBOL DE CARPETAS
========================================================= */

export function useFolderTree() {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const response = await api.get('/folders/tree');
      setTree(response.data);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const flat = useMemo(() => flatten(tree), [tree]);

  const byId = useMemo(
    () =>
      new Map(
        flat.map(
          (folder) =>
            [folder.id, folder] as [string, FlatFolder],
        ),
      ),
    [flat],
  );

  /* Lista de carpetas desde la raíz hasta la indicada */
  const pathOf = useCallback(
    (id?: string | null): FlatFolder[] => {
      const result: FlatFolder[] = [];
      let cursor = id ? byId.get(id) : undefined;
      let guard = 0;

      while (cursor && guard < 50) {
        result.unshift(cursor);
        cursor = cursor.parentId
          ? byId.get(cursor.parentId)
          : undefined;
        guard += 1;
      }

      return result;
    },
    [byId],
  );

  /* Ruta en texto: "Vicerrectoría / Normativa" */
  const pathLabel = useCallback(
    (id?: string | null) =>
      pathOf(id)
        .map((folder) => folder.name)
        .join(' / '),
    [pathOf],
  );

  return {
    tree,
    flat,
    byId,
    loading,
    reload,
    pathOf,
    pathLabel,
  };
}

/* =========================================================
   HOOK: NAVEGACIÓN (la carpeta actual va en ?carpeta=ID)
========================================================= */

export function useFolderNav() {
  const treeState = useFolderTree();

  const [params, setParams] = useSearchParams();

  const requested = params.get('carpeta');

  const current: FlatFolder | null = requested
    ? treeState.byId.get(requested) || null
    : null;

  const open = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params);

      if (id) {
        next.set('carpeta', id);
      } else {
        next.delete('carpeta');
      }

      setParams(next);
    },
    [params, setParams],
  );

  return {
    ...treeState,
    current,
    currentId: current?.id ?? null,
    children: current ? current.children : treeState.tree,
    path: treeState.pathOf(current?.id),
    open,
  };
}

export type FolderNav = ReturnType<typeof useFolderNav>;

/* =========================================================
   SELECTOR DE CARPETA PARA FORMULARIOS
========================================================= */

export function FolderSelect({
  value,
  onChange,
  required = false,
  allowRoot = false,
  excludeId,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  allowRoot?: boolean;
  excludeId?: string;
}) {
  const { flat } = useFolderTree();

  return (
    <select
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">
        {allowRoot
          ? 'Raíz (sin carpeta padre)'
          : 'Seleccione una carpeta'}
      </option>

      {flat
        .filter((folder) => folder.id !== excludeId)
        .map((folder) => (
          <option key={folder.id} value={folder.id}>
            {`${'— '.repeat(folder.depth)}${folder.name}`}
          </option>
        ))}
    </select>
  );
}

/* =========================================================
   BARRA DE CARPETAS
   Migas de pan + tarjetas de subcarpetas + gestión (ADMIN)
========================================================= */

export function FolderBar({
  nav,
  kind,
}: {
  nav: FolderNav;
  kind: 'documents' | 'procedures';
}) {
  const { user } = useAuth();

  const isAdmin = Boolean(user?.roles?.includes('ADMIN'));

  const [mode, setMode] = useState<'create' | 'edit' | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
  });

  const countKey =
    kind === 'documents' ? 'documentCount' : 'procedureCount';

  const noun =
    kind === 'documents' ? 'documento(s)' : 'procedimiento(s)';

  const current = nav.current;

  const isDefault = current?.code === 'SIN-CLASIFICAR';

  const startCreate = () => {
    setForm({
      name: '',
      code: '',
      description: '',
      parentId: '',
    });

    setMode('create');
  };

  const startEdit = () => {
    if (!current) {
      return;
    }

    setForm({
      name: current.name,
      code: current.code || '',
      description: current.description || '',
      parentId: current.parentId || '',
    });

    setMode('edit');
  };

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert('El nombre de la carpeta es obligatorio.');
      return;
    }

    try {
      setSaving(true);

      if (mode === 'create') {
        await api.post('/folders', {
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          parentId: nav.currentId,
        });
      } else if (mode === 'edit' && current) {
        await api.patch(`/folders/${current.id}`, {
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          parentId: form.parentId || null,
        });
      }

      await nav.reload();

      setMode(null);
    } catch (error: any) {
      console.error('Error guardando carpeta:', error);

      alert(
        error?.response?.data?.message ||
          'No se pudo guardar la carpeta.',
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!current) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la carpeta "${current.name}"? Solo se puede eliminar si está vacía.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const parentId = current.parentId;

      await api.delete(`/folders/${current.id}`);

      await nav.reload();

      nav.open(parentId);
    } catch (error: any) {
      console.error('Error eliminando carpeta:', error);

      alert(
        error?.response?.data?.message ||
          'No se pudo eliminar la carpeta.',
      );
    }
  };

  return (
    <Card>
      <div className="folder-bar">
        <div className="folder-bar-top">
          <nav
            className="folder-breadcrumb"
            aria-label="Ruta de carpetas"
          >
            <button
              type="button"
              className={!current ? 'current' : ''}
              onClick={() => nav.open(null)}
            >
              Todas las carpetas
            </button>

            {nav.path.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <span>/</span>

                <button
                  type="button"
                  className={
                    index === nav.path.length - 1 ? 'current' : ''
                  }
                  onClick={() => nav.open(folder.id)}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {isAdmin && (
            <div className="folder-admin-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={startCreate}
              >
                {current ? '+ Subcarpeta' : '+ Carpeta'}
              </button>

              {current && !isDefault && (
                <>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={startEdit}
                  >
                    Editar carpeta
                  </button>

                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => void remove()}
                  >
                    Eliminar carpeta
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {mode && isAdmin && (
          <form className="form" onSubmit={submit}>
            <label>
              Nombre
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>

            <label>
              Código oficial (opcional)
              <input
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value })
                }
              />
            </label>

            <label className="full">
              Descripción (opcional)
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </label>

            {mode === 'edit' && current && (
              <label className="full">
                Carpeta padre
                <FolderSelect
                  allowRoot
                  excludeId={current.id}
                  value={form.parentId}
                  onChange={(value) =>
                    setForm({ ...form, parentId: value })
                  }
                />
              </label>
            )}

            <div className="full repository-form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setMode(null)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn"
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : mode === 'create'
                  ? 'Crear carpeta'
                  : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {nav.children.length > 0 && (
          <div className="folder-grid">
            {nav.children.map((folder) => (
              <button
                type="button"
                key={folder.id}
                className="folder-card"
                onClick={() => nav.open(folder.id)}
              >
                <span className="folder-card-icon">
                  <FolderIcon size={26} />
                </span>

                <span className="folder-card-body">
                  <strong>{folder.name}</strong>

                  {folder.code && <small>{folder.code}</small>}

                  <small>
                    {countDeep(folder, countKey)} {noun}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}

        {!nav.loading &&
          !current &&
          nav.children.length === 0 && (
            <p className="folder-hint">
              Todavía no hay carpetas creadas.
            </p>
          )}

        {!current && nav.children.length > 0 && (
          <p className="folder-hint">
            Seleccione una carpeta para ver su contenido, o use el
            buscador para buscar en todo el sistema.
          </p>
        )}

        {current && nav.children.length === 0 && (
          <p className="folder-hint">
            Esta carpeta no tiene subcarpetas.
          </p>
        )}
      </div>
    </Card>
  );
}