import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "../../components/ui.jsx";
import { downloadProposalDocument } from "../../api.js";
import { toast } from "sonner";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

const pendingKey = (type) => `download-${type}`;

export function ProposalDocumentsList({ documents, proposalId, onDownload, working = "" }) {
  const [loadingType, setLoadingType] = useState(null);

  const isPending = (type) => loadingType === type || working === pendingKey(type);

  async function handleDownload(document) {
    setLoadingType(document.type);
    try {
      if (onDownload) {
        await onDownload(document.type, document.fileName);
        return;
      }
      const blob = await downloadProposalDocument(proposalId, document.type);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName || `propuesta-${proposalId}.pdf`;
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
      <p className="py-10 text-center text-sm text-muted">
        No hay documentos disponibles para esta propuesta.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {documents.map((document, index) => (
        <motion.li
          key={document.type}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
        >
          <Button
            variant="secondary"
            size="md"
            icon={Download}
            loading={isPending(document.type)}
            disabled={!!working || !!loadingType}
            onClick={() => handleDownload(document)}
            title={document.fileName}
            aria-label={`Descargar ${document.fileName}`}
          >
            <span className="flex items-center gap-2">
              <span className="max-w-56 truncate">{document.fileName}</span>
              <span className="font-mono text-xs font-normal text-faint">
                PDF · {Math.max(1, Math.round((document.sizeBytes || 0) / 1024))} KB
              </span>
            </span>
          </Button>
        </motion.li>
      ))}
    </ul>
  );
}
