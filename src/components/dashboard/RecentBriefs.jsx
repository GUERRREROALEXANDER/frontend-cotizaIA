import { ArrowUpRight } from "lucide-react";
import { Panel, formatRelative } from "../ui.jsx";
import { StaggerItem } from "../../motion/Motion.jsx";
import { channelFor, previewText } from "./dashboardData.js";

const MAX_BRIEFS = 5;

export function RecentBriefs({ briefs = [], onOpenBrief, className = "" }) {
  const items = briefs.slice(0, MAX_BRIEFS);

  return (
    <Panel className={`flex flex-col p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-fg">Briefs recientes</h2>
      <p className="mt-1 text-xs text-muted">Lo último que llegó a tu bandeja</p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-3.5 py-4 text-xs text-muted">
          Aún no hay briefs. Crea el primero desde la bandeja.
        </p>
      ) : (
        <ul className="mt-3">
          {items.map((brief, index) => {
            const channel = channelFor(brief.source);
            const ChannelIcon = channel.icon;
            return (
              <StaggerItem
                key={brief.id}
                index={index}
                as="li"
                className="border-b border-line last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpenBrief(brief)}
                  className="group flex w-full items-start gap-3 py-2.5 text-left transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted transition-colors duration-200 group-hover:text-brand">
                    <ChannelIcon size={14} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">
                        {channel.label} #{brief.id}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-faint">
                        {formatRelative(brief.receivedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {previewText(brief.rawText)}
                    </span>
                  </span>
                  <ArrowUpRight size={14} className="mt-1 shrink-0 text-faint transition-colors duration-200 group-hover:text-brand" aria-hidden />
                </button>
              </StaggerItem>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
