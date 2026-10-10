import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { PDF_LIMITS } from "../../limits.js";
import { duration, ease } from "../../motion/presets.js";

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
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-accent-soft ${
            dragOver ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2 hover:border-accent"
          } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-muted">
            <Upload size={20} strokeWidth={1.6} aria-hidden />
          </span>
          <p className="text-sm font-medium text-fg">Arrastra tu PDF aquí o pulsa para elegirlo</p>
          <p className="text-xs text-faint">Solo PDF, hasta {maxMb} MB y 30 páginas</p>
        </div>
      </motion.div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
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
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <FileText size={16} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-fg">{file.name}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-faint">{formatMb(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onFileChange?.(null)}
            disabled={disabled}
            aria-label="Quitar archivo"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg disabled:opacity-50"
          >
            <X size={14} aria-hidden />
          </button>
        </motion.div>
      )}
    </div>
  );
}
