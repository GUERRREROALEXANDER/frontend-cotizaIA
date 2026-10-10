import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Coins, Pencil, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { del, get, post, put } from "../api.js";
import { Field, LimitedInput, fieldClass } from "../components/fields.jsx";
import { FormPanel } from "../components/settings/FormPanel.jsx";
import { HoldToConfirm } from "../components/settings/HoldToConfirm.jsx";
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  Skeleton,
  formatCurrency,
  formatDate,
} from "../components/ui.jsx";
import { LIMITS } from "../limits.js";
import { StaggerItem } from "../motion/Motion.jsx";

const emptyRateForm = { amount: "", from: "", to: "" };

function toInstant(date) {
  return `${date}T00:00:00Z`;
}

export default function RatesView() {
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [roleDraft, setRoleDraft] = useState(null);
  const [savingRole, setSavingRole] = useState(false);
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [savingRate, setSavingRate] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadRoles() {
    setRolesLoading(true);
    try {
      const data = await get("/api/roles");
      const next = data || [];
      setRoles(next);
      setSelectedId((current) => {
        if (current != null && next.some((role) => role.id === current)) return current;
        return next.length > 0 ? next[0].id : null;
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRolesLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setRates([]);
      return undefined;
    }
    let cancelled = false;
    setRatesLoading(true);
    get(`/api/roles/${selectedId}/rates`)
      .then((data) => {
        if (!cancelled) setRates(data || []);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function createRole(event) {
    event.preventDefault();
    if (!roleDraft.name.trim()) {
      toast.error("El nombre del rol es obligatorio.");
      return;
    }
    setSavingRole(true);
    try {
      const created = await post("/api/roles", { name: roleDraft.name.trim() });
      setRoles((current) => {
        const next = [...current, created];
        if (selectedId == null) setSelectedId(created.id);
        return next;
      });
      setRoleDraft(null);
      toast.success("Rol creado.");
    } catch (error) {
      toast.error(error.message || "No se pudo crear el rol.");
    } finally {
      setSavingRole(false);
    }
  }

  async function deleteRole(id) {
    try {
      await del(`/api/roles/${id}`);
      setRoles((current) => {
        const next = current.filter((role) => role.id !== id);
        if (selectedId === id) setSelectedId(next.length > 0 ? next[0].id : null);
        return next;
      });
      toast.success("Rol eliminado.");
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el rol.");
    }
  }

  async function createRate(event) {
    event.preventDefault();
    const amount = Number(rateForm.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error("El valor por hora debe ser un número entero mayor que 0.");
      return;
    }
    setSavingRate(true);
    try {
      const payload = { copPerHour: amount };
      if (rateForm.from) payload.effectiveFrom = toInstant(rateForm.from);
      if (rateForm.to) payload.effectiveTo = toInstant(rateForm.to);
      const created = await post(`/api/roles/${selectedId}/rates`, payload);
      setRates((current) => [...current, created]);
      setRateForm(emptyRateForm);
      toast.success("Tarifa agregada.");
    } catch (error) {
      toast.error(error.message || "No se pudo agregar la tarifa.");
    } finally {
      setSavingRate(false);
    }
  }

  async function saveEditRate(id) {
    const amount = Number(editingRate.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error("El valor por hora debe ser un número entero mayor que 0.");
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await put(`/api/rates/${id}`, { copPerHour: amount });
      setRates((current) => current.map((rate) => (rate.id === updated.id ? { ...rate, ...updated } : rate)));
      setEditingRate(null);
      toast.success("Tarifa actualizada.");
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar la tarifa.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteRate(id) {
    try {
      await del(`/api/rates/${id}`);
      setRates((current) => current.filter((rate) => rate.id !== id));
      toast.success("Tarifa eliminada.");
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar la tarifa.");
    }
  }

  const selectedRole = roles.find((role) => role.id === selectedId) || null;

  return (
    <div>
      <PageHeader
        title="Roles y tarifas"
        description="Cuánto cobras por hora según quién hace el trabajo. Valores en COP."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setRoleDraft({ name: "" })}>
            Nuevo rol
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {roleDraft && (
          <FormPanel
            key="role-form"
            title="Nuevo rol"
            subtitle="Ejemplos: diseñador senior, desarrollador, gerente de proyecto."
            onSubmit={createRole}
            className="mb-4"
            footer={
              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={savingRole}>
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setRoleDraft(null)}>
                  Cancelar
                </Button>
              </div>
            }
          >
            <LimitedInput
              label="Nombre del rol"
              limit={LIMITS.roleName}
              value={roleDraft.name}
              onChange={(event) => setRoleDraft({ name: event.target.value })}
              placeholder="Ej. Desarrollador senior"
              required
            />
          </FormPanel>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="overflow-hidden lg:col-span-4">
          <div className="border-b border-line px-5 py-4">
            <p className="text-sm font-semibold text-fg">Roles</p>
            <p className="mt-0.5 text-xs text-faint">
              {roles.length === 1 ? "1 rol en lista" : `${roles.length} roles en lista`}
            </p>
          </div>
          {rolesLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : roles.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="Aún no hay roles"
              description="Crea el primero para empezar a definir cuánto cobras por hora."
              action={
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setRoleDraft({ name: "" })}>
                  Crear el primer rol
                </Button>
              }
            />
          ) : (
            <div className="space-y-1 p-3">
              {roles.map((role) => {
                const active = role.id === selectedId;
                return (
                  <div
                    key={role.id}
                    className={`flex items-center gap-1 rounded-lg transition-colors duration-200 ${active ? "bg-surface-2" : "hover:bg-surface-2"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(role.id)}
                      aria-current={active || undefined}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-left"
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${active ? "bg-accent-soft text-accent" : "border border-line bg-surface text-muted"}`}
                      >
                        <UserRound size={15} aria-hidden />
                      </span>
                      <span className="truncate text-[13px] font-medium text-fg">{role.name}</span>
                    </button>
                    <HoldToConfirm compact onConfirm={() => deleteRole(role.id)} />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden lg:col-span-8">
          <div className="border-b border-line px-5 py-4">
            <p className="text-sm font-semibold text-fg">
              {selectedRole ? `Tarifas de ${selectedRole.name}` : "Tarifas"}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              Cada tarifa indica desde cuándo aplica y hasta cuándo. Sin fecha de fin, sigue vigente.
            </p>
          </div>
          {ratesLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : selectedRole == null ? (
            <EmptyState
              icon={Coins}
              title="Elige un rol"
              description="Selecciona un rol de la lista para ver y gestionar sus tarifas por hora."
            />
          ) : rates.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Sin tarifas todavía"
              description="Agrega la primera tarifa con el formulario de abajo. Los valores están en COP."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Tarifa</th>
                    <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Vigente desde</th>
                    <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Vigente hasta</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-muted">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rates.map((rate, index) => {
                    const isEditing = editingRate?.id === rate.id;
                    return (
                      <StaggerItem
                        as="tr"
                        key={rate.id}
                        index={index}
                        className="transition-colors duration-200 hover:bg-surface-2"
                      >
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              step={1000}
                              required
                              aria-label="Nuevo valor por hora"
                              value={editingRate.amount}
                              onChange={(event) => setEditingRate({ ...editingRate, amount: event.target.value })}
                              className={`${fieldClass} w-40`}
                            />
                          ) : (
                            <span className="font-mono text-[13px] tabular text-fg">
                              {formatCurrency(rate.copPerHour)} / hora
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                          {formatDate(rate.effectiveFrom)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                          {rate.effectiveTo ? formatDate(rate.effectiveTo) : "Sin límite"}
                        </td>
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingRate(null)}>
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                loading={savingEdit}
                                onClick={() => saveEditRate(rate.id)}
                              >
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <IconButton
                                icon={Pencil}
                                label="Editar tarifa"
                                onClick={() => setEditingRate({ id: rate.id, amount: String(rate.copPerHour) })}
                              />
                              <HoldToConfirm compact onConfirm={() => deleteRate(rate.id)} />
                            </div>
                          )}
                        </td>
                      </StaggerItem>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {selectedRole != null && (
            <form onSubmit={createRate} className="space-y-4 border-t border-line p-5">
              <p className="text-sm font-semibold text-fg">Agregar tarifa</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Valor por hora (COP)" htmlFor="rate-amount">
                  <input
                    id="rate-amount"
                    type="number"
                    min={1}
                    step={1000}
                    required
                    value={rateForm.amount}
                    onChange={(event) => setRateForm({ ...rateForm, amount: event.target.value })}
                    placeholder="80000"
                    className={fieldClass}
                  />
                </Field>
                <Field label="Vigente desde" htmlFor="rate-from">
                  <input
                    id="rate-from"
                    type="date"
                    value={rateForm.from}
                    onChange={(event) => setRateForm({ ...rateForm, from: event.target.value })}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Vigente hasta" htmlFor="rate-to">
                  <input
                    id="rate-to"
                    type="date"
                    value={rateForm.to}
                    onChange={(event) => setRateForm({ ...rateForm, to: event.target.value })}
                    className={fieldClass}
                  />
                </Field>
              </div>
              <Button type="submit" variant="primary" loading={savingRate}>
                Agregar tarifa
              </Button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}
