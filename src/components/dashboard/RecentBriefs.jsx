import { ArrowUpRight, Inbox } from "lucide-react";
import { Button, EmptyState, Panel, formatRelative } from "../ui.jsx";
import { FadeUp, StaggerItem } from "../../motion/Motion.jsx";
import AnimatedLink from "../motion/AnimatedLink.jsx";
import { channelFor, previewText } from "./dashboardData.js";

const MAX_BRIEFS = 5;

export function RecentBriefs({ briefs = [], onOpenBrief, onNavigate, className = "" }) {
  const items = briefs.slice(0, MAX_BRIEFS);

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">Briefs recientes</h2>
          <p className="mt-1 text-sm text-muted">Lo último que llegó a tu bandeja</p>
        </div>
        {items.length > 0 && onNavigate && (
          <AnimatedLink onClick={() => onNavigate("inbox")} className="text-sm">
            Ver bandeja
          </AnimatedLink>
        )}
      </div>

      {items.length === 0 ? (
        <FadeUp delay={0.1}>
          <EmptyState
            icon={Inbox}
            title="Todavía no hay briefs"
            description="Pega el mensaje de tu cliente o sube el PDF y el agente arma la cotización."
            action={
              onNavigate ? (
                <Button variant="primary" onClick={() => onNavigate("inbox")}>
                  Crear el primer brief
                </Button>
              ) : null
            }
          />
        </FadeUp>
      ) : (
        <ul className="mt-2">
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
                  className="group -mx-2 flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
                    <ChannelIcon size={16} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium text-fg">
                        {channel.label} #{brief.id}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-faint">
                        {formatRelative(brief.receivedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {previewText(brief.rawText)}
                    </span>
                  </span>
                  <ArrowUpRight size={16} className="mt-1 shrink-0 text-faint transition-colors duration-200 group-hover:text-brand" aria-hidden />
                </button>
              </StaggerItem>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
