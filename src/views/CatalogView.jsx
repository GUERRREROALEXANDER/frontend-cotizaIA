import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { del, get, post, put } from "../api.js";
import { Field, LimitedInput, LimitedTextarea, fieldClass } from "../components/fields.jsx";
import { FormPanel } from "../components/settings/FormPanel.jsx";
import { HoldToConfirm } from "../components/settings/HoldToConfirm.jsx";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  Skeleton,
} from "../components/ui.jsx";
import { LIMITS } from "../limits.js";
import { StaggerItem } from "../motion/Motion.jsx";

const emptyServiceDraft = { name: "", description: "" };
const emptyRequirementDraft = { name: "", description: "", estimatedHours: "" };

function requirementCountText(count) {
  return count === 1 ? "1 requisito" : `${count} requisitos`;
}

export default function CatalogView() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [openIds, setOpenIds] = useState({});
  const [serviceDraft, setServiceDraft] = useState(null);
  const [savingService, setSavingService] = useState(false);
  const [requirementDraft, setRequirementDraft] = useState(null);
  const [savingRequirement, setSavingRequirement] = useState(false);

  async function loadCatalog() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await get("/api/catalog");
      setServices(data || []);
    } catch (error) {
      setLoadError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  function toggleService(id) {
    setOpenIds((current) => ({ ...current, [id]: !current[id] }));
  }

  function openCreateService() {
    setServiceDraft({ id: null, ...emptyServiceDraft });
  }

  function openEditService(service) {
    setServiceDraft({ id: service.id, name: service.name || "", description: service.description || "" });
  }

  async function saveService(event) {
    event.preventDefault();
    if (!serviceDraft.name.trim()) {
      toast.error("El nombre del servicio es obligatorio.");
      return;
    }
    setSavingService(true);
    try {
      const payload = { name: serviceDraft.name.trim(), description: serviceDraft.description.trim() };
      if (serviceDraft.id == null) {
        const created = await post("/api/catalog", payload);
        const withTypes = { ...created, requirementTypes: created.requirementTypes || [] };
        setServices((current) => [withTypes, ...current]);
        setOpenIds((current) => ({ ...current, [withTypes.id]: true }));
        toast.success("Servicio creado.");
      } else {
        const updated = await put(`/api/catalog/${serviceDraft.id}`, payload);
        setServices((current) =>
          current.map((service) =>
            service.id === updated.id
              ? { ...service, ...updated, requirementTypes: updated.requirementTypes || service.requirementTypes }
              : service,
          ),
        );
        toast.success("Servicio actualizado.");
      }
      setServiceDraft(null);
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el servicio.");
    } finally {
      setSavingService(false);
    }
  }

  async function deleteService(id) {
    try {
      await del(`/api/catalog/${id}`);
      setServices((current) => current.filter((service) => service.id !== id));
      setOpenIds((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (requirementDraft?.serviceId === id) setRequirementDraft(null);
      toast.success("Servicio eliminado.");
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el servicio.");
    }
  }

  function openAddRequirement(serviceId) {
    setRequirementDraft({ serviceId, id: null, ...emptyRequirementDraft });
  }

  function openEditRequirement(serviceId, requirement) {
    setRequirementDraft({
      serviceId,
      id: requirement.id,
      name: requirement.name || "",
      description: requirement.description || "",
      estimatedHours: String(requirement.estimatedHours ?? ""),
    });
  }

  async function saveRequirement(event) {
    event.preventDefault();
    if (!requirementDraft.name.trim()) {
      toast.error("El nombre del requisito es obligatorio.");
      return;
    }
    if (!requirementDraft.description.trim()) {
      toast.error("La descripción del requisito es obligatoria.");
      return;
    }
    const hours = Number(requirementDraft.estimatedHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 9999) {
      toast.error("Las horas estimadas deben estar entre 0 y 9999.");
      return;
    }
    setSavingRequirement(true);
    try {
      const payload = {
        name: requirementDraft.name.trim(),
        description: requirementDraft.description.trim(),
        estimatedHours: hours,
      };
      const { serviceId, id } = requirementDraft;
      if (id == null) {
        const created = await post(`/api/catalog/${serviceId}/requirement-types`, payload);
        setServices((current) =>
          current.map((service) =>
            service.id === serviceId
              ? { ...service, requirementTypes: [...(service.requirementTypes || []), created] }
              : service,
          ),
        );
        toast.success("Requisito agregado.");
      } else {
        const updated = await put(`/api/catalog/${serviceId}/requirement-types/${id}`, payload);
        setServices((current) =>
          current.map((service) =>
            service.id === serviceId
              ? {
                  ...service,
                  requirementTypes: (service.requirementTypes || []).map((item) =>
                    item.id === updated.id ? { ...item, ...updated } : item,
                  ),
                }
              : service,
          ),
        );
        toast.success("Requisito actualizado.");
      }
      setRequirementDraft(null);
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el requisito.");
    } finally {
      setSavingRequirement(false);
    }
  }

  async function deleteRequirement(serviceId, requirementId) {
    try {
      await del(`/api/catalog/${serviceId}/requirement-types/${requirementId}`);
      setServices((current) =>
        current.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                requirementTypes: (service.requirementTypes || []).filter((item) => item.id !== requirementId),
              }
            : service,
        ),
      );
      toast.success("Requisito eliminado.");
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el requisito.");
    }
  }

  function renderRequirementForm(serviceId) {
    const isEdit = requirementDraft.id != null;
    return (
      <form onSubmit={saveRequirement} className="space-y-3">
        <p className="text-xs font-medium text-fg">{isEdit ? "Editar requisito" : "Nuevo requisito"}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
          <LimitedInput
            label="Nombre del requisito"
            limit={LIMITS.requirementName}
            value={requirementDraft.name}
            onChange={(event) => setRequirementDraft({ ...requirementDraft, name: event.target.value })}
            placeholder="Ej. Diseño de pantalla principal"
            required
          />
          <Field label="Horas estimadas" htmlFor={`req-hours-${serviceId}`}>
            <input
              id={`req-hours-${serviceId}`}
              type="number"
              min={0}
              max={9999}
              step={0.5}
              required
              value={requirementDraft.estimatedHours}
              onChange={(event) => setRequirementDraft({ ...requirementDraft, estimatedHours: event.target.value })}
              placeholder="8"
              className={fieldClass}
            />
          </Field>
        </div>
        <LimitedTextarea
          label="Descripción del requisito"
          limit={LIMITS.description}
          rows={2}
          value={requirementDraft.description}
          onChange={(event) => setRequirementDraft({ ...requirementDraft, description: event.target.value })}
          placeholder="Qué incluye este requisito y qué queda por fuera."
          required
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="primary" loading={savingRequirement}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRequirementDraft(null)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title="Catálogo de servicios"
        description="Lo que vendes y cuántas horas toma cada requisito. El agente estima con esto."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreateService}>
            Nuevo servicio
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {serviceDraft && serviceDraft.id == null && (
          <FormPanel
            key="service-form"
            title="Nuevo servicio"
            subtitle="Agrupa los requisitos que siempre cotizas juntos."
            onSubmit={saveService}
            className="mb-4"
            footer={
              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={savingService}>
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setServiceDraft(null)}>
                  Cancelar
                </Button>
              </div>
            }
          >
            <LimitedInput
              label="Nombre del servicio"
              limit={LIMITS.catalogName}
              value={serviceDraft.name}
              onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })}
              placeholder="Ej. Sitio web corporativo"
              required
            />
            <LimitedTextarea
              label="Descripción"
              limit={LIMITS.description}
              rows={2}
              value={serviceDraft.description}
              onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })}
              placeholder="Qué incluye este servicio en una frase."
            />
          </FormPanel>
        )}
      </AnimatePresence>

      {loading ? (
        <Panel className="space-y-3 p-5">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Panel>
      ) : loadError && services.length === 0 ? (
        <Panel>
          <EmptyState
            icon={BookOpen}
            title="No se pudo cargar el catálogo"
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => void loadCatalog()}>
                Intentar de nuevo
              </Button>
            }
          />
        </Panel>
      ) : services.length === 0 && !serviceDraft ? (
        <Panel>
          <EmptyState
            icon={BookOpen}
            title="Tu catálogo está vacío"
            description="Crea tu primer servicio para que el agente sepa qué vendes y cuánto tarda cada requisito."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreateService}>
                Nuevo servicio
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {services.map((service, index) => {
            const open = Boolean(openIds[service.id]);
            const isEditing = serviceDraft?.id === service.id;
            const requirements = service.requirementTypes || [];
            const draftHere = requirementDraft?.serviceId === service.id;
            return (
              <StaggerItem key={service.id} index={index}>
                <Panel className="overflow-hidden">
                  <div className="flex items-start gap-2 p-5">
                    {isEditing ? (
                      <form onSubmit={saveService} className="min-w-0 flex-1 space-y-3">
                        <LimitedInput
                          label="Nombre del servicio"
                          limit={LIMITS.catalogName}
                          value={serviceDraft.name}
                          onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })}
                          required
                        />
                        <LimitedTextarea
                          label="Descripción"
                          limit={LIMITS.description}
                          rows={2}
                          value={serviceDraft.description}
                          onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" variant="primary" loading={savingService}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setServiceDraft(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleService(service.id)}
                        aria-expanded={open}
                        aria-label={`Ver requisitos de ${service.name}`}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <ChevronDown
                          size={16}
                          aria-hidden
                          className={`mt-1 shrink-0 text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-fg">{service.name}</span>
                            <Badge>{requirementCountText(requirements.length)}</Badge>
                          </span>
                          {service.description && (
                            <span className="mt-1 line-clamp-1 block text-xs text-muted">
                              {service.description}
                            </span>
                          )}
                        </span>
                      </button>
                    )}
                    {!isEditing && (
                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          icon={Pencil}
                          label={`Editar ${service.name}`}
                          onClick={() => openEditService(service)}
                        />
                        <HoldToConfirm compact onConfirm={() => deleteService(service.id)} />
                      </div>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {open && !isEditing && (
                      <motion.div
                        key={`reqs-${service.id}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-line"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-line">
                                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Requisito</th>
                                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Descripción</th>
                                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted">Horas estimadas</th>
                                <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-muted">
                                  <span className="sr-only">Acciones</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {requirements.map((requirement, requirementIndex) =>
                                draftHere && requirementDraft.id === requirement.id ? (
                                  <tr key={requirement.id}>
                                    <td colSpan={4} className="bg-surface-2/40 px-5 py-4">
                                      {renderRequirementForm(service.id)}
                                    </td>
                                  </tr>
                                ) : (
                                  <StaggerItem
                                    as="tr"
                                    key={requirement.id}
                                    index={requirementIndex}
                                    className="transition-colors duration-200 hover:bg-surface-2"
                                  >
                                    <td className="px-5 py-3 text-[13px] font-medium text-fg">
                                      {requirement.name}
                                    </td>
                                    <td
                                      className="max-w-72 truncate px-5 py-3 text-xs text-muted"
                                      title={requirement.description}
                                    >
                                      {requirement.description}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs tabular text-fg">
                                      {requirement.estimatedHours} h
                                    </td>
                                    <td className="px-5 py-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <IconButton
                                          icon={Pencil}
                                          label={`Editar ${requirement.name}`}
                                          onClick={() => openEditRequirement(service.id, requirement)}
                                        />
                                        <HoldToConfirm
                                          compact
                                          onConfirm={() => deleteRequirement(service.id, requirement.id)}
                                        />
                                      </div>
                                    </td>
                                  </StaggerItem>
                                ),
                              )}
                              {requirements.length === 0 && !draftHere && (
                                <tr>
                                  <td colSpan={4} className="px-5 py-4 text-xs text-faint">
                                    Este servicio aún no tiene requisitos. Agrega el primero para que el agente pueda estimar.
                                  </td>
                                </tr>
                              )}
                              {draftHere && requirementDraft.id == null && (
                                <tr>
                                  <td colSpan={4} className="bg-surface-2/40 px-5 py-4">
                                    {renderRequirementForm(service.id)}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {!draftHere && (
                          <div className="border-t border-line px-5 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Plus}
                              onClick={() => openAddRequirement(service.id)}
                            >
                              Agregar requisito
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Panel>
              </StaggerItem>
            );
          })}
        </div>
      )}
    </div>
  );
}
