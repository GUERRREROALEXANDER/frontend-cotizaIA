import { del, get, upload } from "../api.js";
import { HoldToConfirm } from "../components/settings/HoldToConfirm.jsx";
import { useEffect, useRef, useState } from "react";
import { Brain, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  Skeleton,
  Badge,
} from "../components/ui.jsx";
import { formatDateTime } from "../components/ui.jsx";
import {
  KNOWLEDGE_FILE,
  formatKnowledgeKind,
  formatKnowledgeSize,
  knowledgeChunkText,
  validateKnowledgeFile,
} from "../knowledge.js";

export default function KnowledgeView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  async function loadDocuments() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await get("/api/knowledge/documents");
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  function pickFile(event) {
    const next = event.target.files?.[0] || null;
    setFile(next);
    setProgress(0);
    setFileError(next ? validateKnowledgeFile(next) : "");
  }

  async function submitUpload(event) {
    event.preventDefault();
    const rejection = validateKnowledgeFile(file);
    if (rejection) {
      setFileError(rejection);
      toast.error(rejection);
      return;
    }
    setFileError("");
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const created = await upload("/api/knowledge/documents", formData, {
        onProgress: (ratio) => setProgress(ratio),
      });
      setProgress(1);
      if (created?.documentId != null) {
        setDocuments((current) => [
          {
            documentId: created.documentId,
            name: created.name || file.name,
            kind: "PROPOSAL_PDF",
            items: Array.isArray(created.items) ? created.items.length : 0,
            passages: Number(created.passages || 0),
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      } else {
        await loadDocuments();
      }
      toast.success(`Documento "${created?.name || file?.name}" agregado a la memoria.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      toast.error(error.message || "No se pudo subir el documento.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id) {
    try {
      await del(`/api/knowledge/documents/${id}`);
      setDocuments((current) => current.filter((doc) => doc.documentId !== id));
      toast.success("Documento eliminado.");
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar el documento.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Base de conocimiento"
        description="Los PDF de propuestas pasadas que el agente usa como memoria al estimar."
        actions={
          <span className="text-xs text-faint">
            PDF · máx. {formatKnowledgeSize(KNOWLEDGE_FILE.maxBytes)}
          </span>
        }
      />

      <Panel className="mb-4 p-5">
        <form onSubmit={submitUpload} className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-medium text-muted">Documento PDF</span>
            <input
              ref={inputRef}
              type="file"
              accept={KNOWLEDGE_FILE.accept}
              onChange={pickFile}
              disabled={uploading}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-brand/70 file:bg-transparent file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-brand hover:file:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <Button type="submit" variant="primary" icon={Upload} loading={uploading} disabled={!file || uploading}>
            {uploading ? `Subiendo ${Math.round(progress * 100)} %` : "Subir PDF"}
          </Button>
        </form>
        {file && !fileError && (
          <p className="mt-2 text-xs text-muted">
            {file.name} · {formatKnowledgeSize(file.size)}
          </p>
        )}
        {fileError && (
          <p role="alert" className="mt-2 text-xs text-danger">{fileError}</p>
        )}
      </Panel>

      {loading ? (
        <Panel className="space-y-3 p-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Panel>
      ) : loadError && documents.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Brain}
            title="No se pudo cargar la base de conocimiento"
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => void loadDocuments()}>
                Intentar de nuevo
              </Button>
            }
          />
        </Panel>
      ) : documents.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Brain}
            title="Aún no hay documentos"
            description="Sube tu primer PDF de una propuesta pasada para que el agente aprenda cómo cotizas."
            action={
              <Button variant="primary" icon={Upload} onClick={() => inputRef.current?.click()}>
                Subir PDF
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Panel key={doc.documentId} className="flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
                <FileText size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg" title={doc.name}>
                  {doc.name}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge tone="accent">{formatKnowledgeKind(doc.kind)}</Badge>
                  <span>{knowledgeChunkText(doc)}</span>
                  <span aria-label="Fecha de carga">{formatDateTime(doc.createdAt)}</span>
                </p>
              </div>
              <HoldToConfirm compact onConfirm={() => deleteDocument(doc.documentId)} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
