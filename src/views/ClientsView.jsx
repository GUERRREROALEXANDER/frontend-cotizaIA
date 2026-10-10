import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { del, post, put } from "../api.js";
import { LimitedInput } from "../components/fields.jsx";
import { FormPanel } from "../components/settings/FormPanel.jsx";
import { HoldToConfirm } from "../components/settings/HoldToConfirm.jsx";
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  Skeleton,
  formatDate,
} from "../components/ui.jsx";
import { LIMITS } from "../limits.js";
import { StaggerItem } from "../motion/Motion.jsx";

const emptyForm = { name: "", email: "", company: "" };

export default function ClientsView({ clients, onClientsChange, onRefresh }) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const knownList = Array.isArray(clients) ? clients : null;
  const list = knownList || [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((client) =>
      [client.name, client.company, client.email].some((value) =>
        String(value || "").toLowerCase().includes(query),
      ),
    );
  }, [list, search]);

  function openCreate() {
    setDraft({ id: null, ...emptyForm });
  }

  function openEdit(client) {
    setDraft({
      id: client.id,
      name: client.name || "",
      email: client.email || "",
      company: client.company || "",
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("El nombre del cliente es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        email: draft.email.trim(),
        company: draft.company.trim(),
      };
      if (draft.id == null) {
        const created = await post("/api/clients", payload);
        onClientsChange([created, ...list.filter((item) => item.id !== created.id)]);
        toast.success("Cliente creado.");
      } else {
        const updated = await put(`/api/clients/${draft.id}`, payload);
        onClientsChange(list.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("Cliente actualizado.");
      }
      setDraft(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await del(`/api/clients/${id}`);
      onClientsChange(list.filter((item) => item.id !== id));
      toast.success("Cliente eliminado.");
      onRefresh?.();
    } catch (error) {
      if (error.status === 409) {
        toast.error("No se puede eliminar: el cliente tiene briefs asociados.");
      } else {
        toast.error(error.message || "No se pudo eliminar el cliente.");
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Las empresas para las que cotizas."
        actions={
          <>
            <LimitedInput
              limit={LIMITS.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente"
              aria-label="Buscar cliente"
              className="w-64"
            />
            <Button variant="primary" icon={Plus} onClick={openCreate}>
              Nuevo cliente
            </Button>
          </>
        }
      />

      <AnimatePresence initial={false}>
        {draft && (
          <FormPanel
            key="client-form"
            title={draft.id == null ? "Nuevo cliente" : "Editar cliente"}
            subtitle="Estos datos aparecen en las propuestas que envías."
            onSubmit={handleSave}
            className="mb-4"
            footer={
              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={saving}>
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Cancelar
                </Button>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <LimitedInput
                label="Nombre"
                limit={LIMITS.clientName}
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Nombre del contacto"
                required
              />
              <LimitedInput
                label="Correo electrónico"
                type="email"
                limit={LIMITS.email}
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                placeholder="contacto@empresa.com"
                required
              />
            </div>
            <LimitedInput
              label="Empresa"
              limit={LIMITS.company}
              value={draft.company}
              onChange={(event) => setDraft({ ...draft, company: event.target.value })}
              placeholder="Nombre de la empresa"
            />
          </FormPanel>
        )}
      </AnimatePresence>

      <Panel className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-semibold text-fg">Lista de clientes</p>
          <p className="mt-0.5 text-xs text-faint">
            {filtered.length === 1 ? "1 cliente en lista" : `${filtered.length} clientes en lista`}
          </p>
        </div>
        {knownList === null ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          list.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no tienes clientes"
              description="Crea el primero para empezar a cotizarle a una empresa real."
              action={
                <Button variant="primary" icon={Plus} onClick={openCreate}>
                  Crear el primer cliente
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Sin resultados"
              description="Ningún cliente coincide con esa búsqueda. Prueba con otro nombre, empresa o correo."
              action={
                <Button variant="ghost" onClick={() => setSearch("")}>
                  Limpiar búsqueda
                </Button>
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Nombre</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Empresa</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Correo</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Creado</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-muted">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((client, index) => (
                  <StaggerItem
                    as="tr"
                    key={client.id}
                    index={index}
                    className="transition-colors duration-200 hover:bg-surface-2"
                  >
                    <td className="px-5 py-3 text-[13px] font-medium text-fg">{client.name}</td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {client.company || <span className="text-faint">Sin empresa</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">{client.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-faint">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Pencil}
                          label={`Editar ${client.name}`}
                          onClick={() => openEdit(client)}
                        />
                        <HoldToConfirm compact onConfirm={() => handleDelete(client.id)} />
                      </div>
                    </td>
                  </StaggerItem>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
