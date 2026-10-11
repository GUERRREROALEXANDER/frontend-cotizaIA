import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { PDF_LIMITS } from "../../limits.js";
import { duration, ease } from "../../motion/presets.js";
import { IconButton } from "../ui.jsx";

const maxMb = Math.round(PDF_LIMITS.maxBytes / (1024 * 1024));

function formatMb(bytes) {
  return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdfFile(file) {
  if (!file) return false;
  if (file.type) return file.type === "application/pdf";
  return String(file.name || "").toLowerCase().endsWith(".pdf");
}

// Drag and drop zone for PDF briefs. Validation runs on the client so
// oversized or non PDF files never reach the upload endpoint.
export default function PdfDropzone({ file, onFileChange, onReject, disabled = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function validateAndEmit(candidate) {
    if (!candidate) return;
    if (!isPdfFile(candidate)) {
      onReject?.("Solo se aceptan archivos PDF. Selecciona un archivo con formato PDF.");
      return;
    }
    if (candidate.size > PDF_LIMITS.maxBytes) {
      onReject?.(`El archivo supera el limite de ${maxMb} MB. Reduce su tamaño e intenta de nuevo.`);
      return;
    }
    onFileChange?.(candidate);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  return (
    <div>
      <motion.div
        animate={{ scale: dragOver ? 1.01 : 1 }}
        transition={{ duration: duration.state, ease: ease.out }}
      >
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Subir archivo PDF. Arrastra un PDF aquí o pulsa para elegirlo."
          aria-disabled={disabled || undefined}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (disabled) return;
            validateAndEmit(event.dataTransfer?.files?.[0]);
          }}
          className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-accent-soft ${
            dragOver ? "border-brand bg-accent-soft" : "border-line-strong bg-surface hover:border-brand"
          } ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-brand">
            <Upload size={24} strokeWidth={1.8} aria-hidden />
          </span>
          <p className="text-xl font-bold tracking-tight text-fg">Suelta el PDF aquí</p>
          <p className="text-sm text-muted">o pulsa para elegirlo. Solo PDF, hasta {maxMb} MB y 30 páginas</p>
        </div>
      </motion.div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        aria-hidden
        onChange={(event) => {
          validateAndEmit(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.state, ease: ease.out }}
          className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
            <FileText size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg">{file.name}</span>
            <span className="mt-0.5 block font-mono text-xs text-faint">{formatMb(file.size)}</span>
          </span>
          <IconButton icon={X} label="Quitar archivo" disabled={disabled} onClick={() => onFileChange?.(null)} />
        </motion.div>
      )}
    </div>
  );
}
