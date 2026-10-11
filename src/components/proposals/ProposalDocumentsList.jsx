import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Download } from "lucide-react";
import { formatCurrency } from "../../components/ui.jsx";
import { downloadProposalDocument } from "../../api.js";
import { toast } from "sonner";

export function ProposalDocumentsList({ documents, proposalId }) {
  const [loadingType, setLoadingType] = useState(null);

  async function handleDownload(type, fileName) {
    setLoadingType(type);
    try {
      const blob = await downloadProposalDocument(proposalId, type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `propuesta-${proposalId}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Documento descargado");
    } catch (error) {
      toast.error(error.message || "No se pudo descargar el documento");
    } finally {
      setLoadingType(null);
    }
  }

  if (!documents?.length) {
    return (
      <p className="text-sm text-muted text-center py-8">
        No hay documentos disponibles para esta propuesta.
      </p>
    );
  }

  return (
    <div className="space-y-2" role="list">
      {documents.map((document) => (
        <motion.button
          key={document.type}
          layout
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleDownload(document.type, document.fileName)}
          disabled={loadingType === document.type}
          className="group flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-surface p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
          role="listitem"
          aria-label={`Descargar ${document.fileName}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="shrink-0 grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-brand" aria-hidden>
              <FileText size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg truncate">{document.fileName}</p>
              <p className="text-xs text-muted">
                PDF · {Math.max(1, Math.round((document.sizeBytes || 0) / 1024))} KB
              </p>
            </div>
          </div>
          {loadingType === document.type ? (
            <Loader2 size={18} className="animate-spin text-muted" aria-hidden />
          ) : (
            <Download size={18} className="text-muted group-hover:text-fg transition-colors" aria-hidden />
          )}
        </motion.button>
      ))}
    </div>
  );
}